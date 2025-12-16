import { NextRequest, NextResponse } from 'next/server';

// Types
type NFTItem = {
  id: string; // Unique ID (contract+tokenId)
  name: string;
  collection: string;
  image: string;
  tokenId: string;
  contractAddress: string;
  chain: string;
  chainColor: string;
  isListed: boolean;
  floorPrice?: number; // Optional
  listingPrice?: number; // Optional
  receivedDate: string; // approximate or real
};

type AlchemyNFTResponse = {
  ownedNfts: {
    contract: { address: string; name: string; openSeaMetadata?: { floorPrice?: number; collectionName?: string } };
    tokenId: string;
    name?: string;
    image: { originalUrl?: string; thumbnailUrl?: string; cachedUrl?: string };
    collection?: { name?: string; slug?: string; floorPrice?: number }; // V3 response varies
    acquiredAt?: object; // V3 returns acquisition info
  }[];
};

type _HeliusAssetResponse = {
  items: {
    id: string;
    content: {
      metadata: { name: string; symbol: string };
      files: { uri: string; cdn_uri?: string; mime: string }[];
      links: { image?: string };
    };
    grouping: { group_key: string; group_value: string }[]; // Collection info
    ownership: { frozen: boolean; delegated: boolean };
    compression: { compressed: boolean };
  }[];
};

const CHAIN_CONFIGS: Record<string, { apiSubdomain: string; color: string; label: string }> = {
  ethereum: { apiSubdomain: "eth-mainnet", color: "#627EEA", label: "Ethereum" },
  base: { apiSubdomain: "base-mainnet", color: "#0052FF", label: "Base" },
  arbitrum: { apiSubdomain: "arb-mainnet", color: "#28A0F0", label: "Arbitrum" },
  polygon: { apiSubdomain: "polygon-mainnet", color: "#8247E5", label: "Polygon" },
  optimism: { apiSubdomain: "opt-mainnet", color: "#FF0420", label: "Optimism" },
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const evmAddress = searchParams.get('evmAddress');
  const solanaAddress = searchParams.get('solanaAddress');
  
  if (!evmAddress && !solanaAddress) {
    return NextResponse.json({ nfts: [] });
  }

  const nfts: NFTItem[] = [];
  const errors: string[] = [];

  // 1. Fetch EVM NFTs (Alchemy)
  if (evmAddress && process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
    const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
    
    // We'll fetch from supported chains in parallel
    const evmPromises = Object.entries(CHAIN_CONFIGS).map(async ([chainKey, config]) => {
      try {
        // Alchemy NFT V3 API endpoint
        // Alchemy NFT V3 API endpoint - Removed SPAM filter to mimic Rabby
        const url = `https://${config.apiSubdomain}.g.alchemy.com/nft/v3/${apiKey}/getNFTsForOwner?owner=${evmAddress}&withMetadata=true&pageSize=100`;
        
        const res = await fetch(url, { headers: { accept: 'application/json' } });
        if (!res.ok) {
           const text = await res.text();
           console.error(`Alchemy ${chainKey} failed: ${res.status} ${text}`);
           throw new Error(`Alchemy ${chainKey} error: ${res.statusText}`);
        }
        
        const data: AlchemyNFTResponse = await res.json();
        console.log(`Alchemy ${chainKey} found ${data.ownedNfts?.length || 0} NFTs`);
        
        return data.ownedNfts.map((nft) => {
          const start = new Date(2024, 0, 1).getTime();
          const end = new Date().getTime();
          const randomTime = new Date(start + Math.random() * (end - start));
          
          return {
            id: `${chainKey}-${nft.contract.address}-${nft.tokenId}`,
            name: nft.name || `#${nft.tokenId}`,
            collection: nft.collection?.name || nft.contract.name || "Unknown Collection",
            image: nft.image.cachedUrl || nft.image.originalUrl || "",
            tokenId: nft.tokenId,
            contractAddress: nft.contract.address,
            chain: chainKey,
            chainColor: config.color,
            isListed: false, // Detecting listings requires Opensea API or specialized Alchemy endpoint
            floorPrice: nft.contract.openSeaMetadata?.floorPrice || 0, // Alchemy V3 sometimes includes this
            listingPrice: undefined,
            receivedDate: randomTime.toLocaleDateString(), // Placeholder until we parse acquiredAt correctly
          };
        }).filter(item => item.image); // Filter out NFTs without images
      } catch (err) {
        console.error(`Error fetching ${chainKey} NFTs:`, err);
        errors.push(`${chainKey}: ${err instanceof Error ? err.message : String(err)}`);
        return [];
      }
    });

    const evmResults = await Promise.all(evmPromises);
    evmResults.forEach(chainNfts => nfts.push(...chainNfts));
  }

  // 2. Fetch Solana NFTs (Helius)
  if (solanaAddress && process.env.NEXT_PUBLIC_HELIUS_API_KEY) {
    try {
      const start = new Date(2024, 0, 1).getTime();
      const end = new Date().getTime();
      const randomTime = new Date(start + Math.random() * (end - start));
      
      const url = `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'my-id',
          method: 'getAssetsByOwner',
          params: {
            ownerAddress: solanaAddress,
            page: 1, // Only first 1000 for now
            limit: 1000,
            displayOptions: {
              showFungible: false, // Don't show tokens
              showNativeBalance: false,
            },
          },
        }),
      });

      const data = await response.json();
      
      if (data.result && data.result.items) {
        const solNfts: NFTItem[] = data.result.items.map((item: any) => {
           // Helper to clean URLs
           const sanitizeUrl = (url: string) => {
             if (!url) return "";
             if (url.startsWith("ipfs://")) return url.replace("ipfs://", "https://ipfs.io/ipfs/");
             return url;
           };

           // Parse image - prioritize CDN and Links
           const rawImage = item.content?.links?.image || item.content?.files?.[0]?.cdn_uri || item.content?.files?.[0]?.uri || "";
           const image = sanitizeUrl(rawImage);
           
           // Parse collection
           let collectionName = "Solana Collection";
           const collectionGroup = item.grouping?.find((g: any) => g.group_key === "collection");
           if (collectionGroup) {
             // Use symbol as collection name proxy if available, otherwise address
             collectionName = item.content?.metadata?.symbol || `Collection ${collectionGroup.group_value.substring(0,6)}...`; 
           }
           
           // Helius name often contains the collection name or is just the name
           return {
             id: `solana-${item.id}`,
             name: item.content?.metadata?.name || "Unknown NFT",
             collection: collectionName, // Helius grouping is just an address, simplifying for now
             image: image,
             tokenId: item.id,
             contractAddress: item.id,
             chain: "solana",
             chainColor: "#9945FF",
             isListed: false, // Requires specific marketplace check
             floorPrice: 0, // Helius DAS doesn't provide floor price directly
             listingPrice: undefined,
             receivedDate: randomTime.toLocaleDateString(),
           };
        }).filter((item: NFTItem) => item.image); // Filter out invalid images
        
        nfts.push(...solNfts);
      }
    } catch (err) {
      console.error("Error fetching Solana NFTs:", err);
      errors.push(`solana: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 3. Sort by Name or Collection
  nfts.sort((a, b) => a.collection.localeCompare(b.collection));

  return NextResponse.json({ nfts, count: nfts.length, errors });
}
