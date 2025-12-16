import { NextRequest, NextResponse } from "next/server";

/* ----------------------- Types ----------------------- */
type TokenBalance = {
  contractAddress: string;
  tokenBalance: string;
  symbol?: string;
  name?: string;
  decimals?: number;
  logo?: string;
};

type ChainConfig = {
  name: string;
  alchemyNetwork: string;
  chainId: number;
  nativeSymbol: string;
  nativeName: string;
  nativeDecimals: number;
  coingeckoId: string;
  color: string;
  logo: string;
};

const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  ethereum: {
    name: "Ethereum",
    alchemyNetwork: "eth-mainnet",
    chainId: 1,
    nativeSymbol: "ETH",
    nativeName: "Ethereum",
    nativeDecimals: 18,
    coingeckoId: "ethereum",
    color: "#627EEA",
    logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  },
  base: {
    name: "Base",
    alchemyNetwork: "base-mainnet",
    chainId: 8453,
    nativeSymbol: "ETH",
    nativeName: "Ethereum",
    nativeDecimals: 18,
    coingeckoId: "ethereum",
    color: "#0052FF",
    logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",
  },
  arbitrum: {
    name: "Arbitrum",
    alchemyNetwork: "arb-mainnet",
    chainId: 42161,
    nativeSymbol: "ETH",
    nativeName: "Ethereum",
    nativeDecimals: 18,
    coingeckoId: "ethereum",
    color: "#28A0F0",
    logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
  },
  optimism: {
    name: "Optimism",
    alchemyNetwork: "opt-mainnet",
    chainId: 10,
    nativeSymbol: "ETH",
    nativeName: "Ethereum",
    nativeDecimals: 18,
    coingeckoId: "ethereum",
    color: "#FF0420",
    logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png",
  },
  polygon: {
    name: "Polygon",
    alchemyNetwork: "polygon-mainnet",
    chainId: 137,
    nativeSymbol: "POL",
    nativeName: "Polygon",
    nativeDecimals: 18,
    coingeckoId: "matic-network",
    color: "#8247E5",
    logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
  },
};

/* ----------------------- Alchemy API Helper ----------------------- */
async function fetchAlchemyBalances(address: string, chain: string) {
  const config = CHAIN_CONFIGS[chain];
  if (!config) return { native: "0", tokens: [] };

  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  if (!alchemyKey) {
    console.error("NEXT_PUBLIC_ALCHEMY_API_KEY not set");
    return { native: "0", tokens: [] };
  }

  const baseUrl = `https://${config.alchemyNetwork}.g.alchemy.com/v2/${alchemyKey}`;

  try {
    // Fetch native balance
    const nativeRes = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [address, "latest"],
      }),
    });

    const nativeText = await nativeRes.text();
    let nativeData;
    try {
      nativeData = JSON.parse(nativeText);
    } catch (e) {
      console.error(`Error parsing native balance JSON for ${chain}. Response:`, nativeText.slice(0, 200));
      return { native: "0", tokens: [] };
    }

    const nativeBalance = nativeData.result
      ? (parseInt(nativeData.result, 16) / Math.pow(10, config.nativeDecimals)).toString()
      : "0";

    // Fetch ERC-20 token balances
    const tokenRes = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "alchemy_getTokenBalances",
        params: [address],
      }),
    });

    const tokenText = await tokenRes.text();
    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch (e) {
      console.error(`Error parsing token balances JSON for ${chain}. Response:`, tokenText.slice(0, 200));
      // Continue with just native balance if tokens fail
      tokenData = { result: { tokenBalances: [] } };
    }

    const tokens: TokenBalance[] = [];
    if (tokenData.result?.tokenBalances) {
      // Filter out zero balances
      const nonZeroBalances = tokenData.result.tokenBalances.filter(
        (t: { tokenBalance: string }) =>
          t.tokenBalance && t.tokenBalance !== "0x0" && t.tokenBalance !== "0x"
      );

      // Fetch metadata for each token (limit to top 20 to avoid rate limits)
      for (const token of nonZeroBalances.slice(0, 20)) {
        try {
          const metaRes = await fetch(baseUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 3,
              method: "alchemy_getTokenMetadata",
              params: [token.contractAddress],
            }),
          });
          const metaData = await metaRes.json();
          const meta = metaData.result;

          if (meta) {
            const balance =
              parseInt(token.tokenBalance, 16) / Math.pow(10, meta.decimals || 18);
            if (balance > 0.0001) {
              // Filter dust
              tokens.push({
                contractAddress: token.contractAddress,
                tokenBalance: balance.toString(),
                symbol: meta.symbol,
                name: meta.name,
                decimals: meta.decimals,
                logo: meta.logo,
              });
            }
          }
        } catch (e) {
          console.error(`Error fetching token metadata for ${token.contractAddress}`, e);
        }
      }
    }

    return { native: nativeBalance, tokens };
  } catch (error) {
    console.error(`Error fetching ${chain} balances:`, error);
    return { native: "0", tokens: [] };
  }
}

/* ----------------------- Solana Balance Helper ----------------------- */
async function fetchSolanaBalances(address: string) {
  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_SOL_KEY;
  if (!alchemyKey) {
    console.error("NEXT_PUBLIC_ALCHEMY_SOL_KEY not set");
    return { native: "0", tokens: [] };
  }

  const solanaUrl = `https://solana-mainnet.g.alchemy.com/v2/${alchemyKey}`;

  try {
    // Fetch native SOL balance
    const balanceRes = await fetch(solanaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [address],
      }),
    });
    const balanceData = await balanceRes.json();
    const lamports = balanceData.result?.value || 0;
    const solBalance = (lamports / 1e9).toString();

    // Fetch SPL token balances
    const tokenRes = await fetch(solanaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "getTokenAccountsByOwner",
        params: [
          address,
          { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
          { encoding: "jsonParsed" },
        ],
      }),
    });
    const tokenData = await tokenRes.json();

    const tokens: TokenBalance[] = [];
    if (tokenData.result?.value) {
      for (const account of tokenData.result.value) {
        const info = account.account?.data?.parsed?.info;
        if (info && info.tokenAmount?.uiAmount > 0.0001) {
          tokens.push({
            contractAddress: info.mint,
            tokenBalance: info.tokenAmount.uiAmount.toString(),
            symbol: info.mint.slice(0, 4).toUpperCase(),
            name: `SPL Token ${info.mint.slice(0, 6)}`,
            decimals: info.tokenAmount.decimals,
          });
        }
      }
    }

    return { native: solBalance, tokens };
  } catch (error) {
    console.error("Error fetching Solana balances:", error);
    return { native: "0", tokens: [] };
  }
}

/* ----------------------- API Route Handler ----------------------- */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const evmAddress = searchParams.get("evmAddress");
  const solanaAddress = searchParams.get("solanaAddress");

  if (!evmAddress && !solanaAddress) {
    return NextResponse.json({ error: "No wallet addresses provided" }, { status: 400 });
  }

  const results: {
    chain: string;
    chainName: string;
    color: string;
    native: { symbol: string; name: string; balance: string; logo?: string };
    tokens: TokenBalance[];
  }[] = [];

  // Fetch EVM balances
  if (evmAddress) {
    const chains = ["ethereum", "base", "arbitrum", "optimism", "polygon"];
    for (const chain of chains) {
      const config = CHAIN_CONFIGS[chain];
      const { native, tokens } = await fetchAlchemyBalances(evmAddress, chain);
      results.push({
        chain,
        chainName: config.name,
        color: config.color,
        native: {
          symbol: config.nativeSymbol,
          name: config.nativeName,
          balance: native,
          logo: config.logo,
        },
        tokens,
      });
    }
  }

  // Fetch Solana balances
  if (solanaAddress) {
    const { native, tokens } = await fetchSolanaBalances(solanaAddress);
    results.push({
      chain: "solana",
      chainName: "Solana",
      color: "#9945FF",
      native: {
        symbol: "SOL",
        name: "Solana",
        balance: native,
        logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
      },
      tokens,
    });
  }

  return NextResponse.json({ balances: results });
}
