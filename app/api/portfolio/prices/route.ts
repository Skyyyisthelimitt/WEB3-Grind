import { NextRequest, NextResponse } from "next/server";

/* ----------------------- Types ----------------------- */
type PriceData = {
  [tokenId: string]: {
    usd: number;
    usd_24h_change?: number;
    eur?: number;
    php?: number;
  };
};

/* ----------------------- Popular Token Mappings ----------------------- */
// Map common token symbols to CoinGecko IDs
const SYMBOL_TO_COINGECKO: Record<string, string> = {
  ETH: "ethereum",
  WETH: "weth",
  BTC: "bitcoin",
  WBTC: "wrapped-bitcoin",
  USDT: "tether",
  USDC: "usd-coin",
  DAI: "dai",
  SOL: "solana",
  LINK: "chainlink",
  UNI: "uniswap",
  AAVE: "aave",
  ARB: "arbitrum",
  OP: "optimism",
  MATIC: "matic-network",
  PEPE: "pepe",
  SHIB: "shiba-inu",
  APE: "apecoin",
  LDO: "lido-dao",
  CRV: "curve-dao-token",
  MKR: "maker",
  COMP: "compound-governance-token",
  SNX: "havven",
  SUSHI: "sushi",
  GRT: "the-graph",
  ENS: "ethereum-name-service",
  BLUR: "blur",
  IMX: "immutable-x",
  SAND: "the-sandbox",
  MANA: "decentraland",
  AXS: "axie-infinity",
  DYDX: "dydx",
  GMX: "gmx",
  RDNT: "radiant-capital",
  MAGIC: "magic",
  STG: "stargate-finance",
  PENDLE: "pendle",
  RETH: "rocket-pool-eth",
  STETH: "staked-ether",
  CBETH: "coinbase-wrapped-staked-eth",
  FRAX: "frax",
  FXS: "frax-share",
  RAY: "raydium",
  JTO: "jito-governance-token",
  JUP: "jupiter-exchange-solana",
  BONK: "bonk",
  WIF: "dogwifcoin",
  PYTH: "pyth-network",
  RNDR: "render-token",
  HNT: "helium",
  MOBILE: "helium-mobile",
  MSOL: "marinade-staked-sol",
  JITOSOL: "jito-staked-sol",
};

/* ----------------------- CoinGecko Fetcher ----------------------- */
async function fetchCoinGeckoPrices(tokenIds: string[], currency: string = "usd"): Promise<PriceData> {
  if (tokenIds.length === 0) return {};

  const currencies = ["usd", "eur", "php"];
  const ids = tokenIds.join(",");
  
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${currencies.join(",")}&include_24hr_change=true`;
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!res.ok) {
      console.error("CoinGecko API error:", res.status, res.statusText);
      return {};
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching CoinGecko prices:", error);
    return {};
  }
}

/* ----------------------- API Route Handler ----------------------- */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symbols, currency = "usd" } = body;

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json({ error: "No token symbols provided" }, { status: 400 });
    }

    // Map symbols to CoinGecko IDs
    const tokenIdMap: Record<string, string> = {};
    const coingeckoIds: string[] = [];

    for (const symbol of symbols) {
      const upperSymbol = symbol.toUpperCase();
      const coingeckoId = SYMBOL_TO_COINGECKO[upperSymbol];
      if (coingeckoId) {
        tokenIdMap[upperSymbol] = coingeckoId;
        if (!coingeckoIds.includes(coingeckoId)) {
          coingeckoIds.push(coingeckoId);
        }
      }
    }

    // Fetch prices from CoinGecko
    const prices = await fetchCoinGeckoPrices(coingeckoIds, currency);

    // Map back to token symbols
    const result: Record<string, { price: number; change24h: number; priceEur?: number; pricePHP?: number }> = {};

    for (const [symbol, coingeckoId] of Object.entries(tokenIdMap)) {
      const priceData = prices[coingeckoId];
      if (priceData) {
        result[symbol] = {
          price: priceData.usd || 0,
          change24h: priceData.usd_24h_change || 0,
          priceEur: priceData.eur,
          pricePHP: priceData.php,
        };
      }
    }

    return NextResponse.json({ prices: result });
  } catch (error) {
    console.error("Error in prices API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ----------------------- GET Handler for Quick Access ----------------------- */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbols = searchParams.get("symbols");

  if (!symbols) {
    return NextResponse.json({ error: "No symbols provided" }, { status: 400 });
  }

  const symbolList = symbols.split(",").map(s => s.trim().toUpperCase());
  
  // Map symbols to CoinGecko IDs
  const coingeckoIds: string[] = [];
  const tokenIdMap: Record<string, string> = {};

  for (const symbol of symbolList) {
    const coingeckoId = SYMBOL_TO_COINGECKO[symbol];
    if (coingeckoId) {
      tokenIdMap[symbol] = coingeckoId;
      if (!coingeckoIds.includes(coingeckoId)) {
        coingeckoIds.push(coingeckoId);
      }
    }
  }

  const prices = await fetchCoinGeckoPrices(coingeckoIds);

  const result: Record<string, { price: number; change24h: number; priceEur?: number; pricePHP?: number }> = {};

  for (const [symbol, coingeckoId] of Object.entries(tokenIdMap)) {
    const priceData = prices[coingeckoId];
    if (priceData) {
      result[symbol] = {
        price: priceData.usd || 0,
        change24h: priceData.usd_24h_change || 0,
        priceEur: priceData.eur,
        pricePHP: priceData.php,
      };
    }
  }

  return NextResponse.json({ prices: result });
}
