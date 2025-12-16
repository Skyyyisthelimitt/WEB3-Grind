import { NextRequest, NextResponse } from 'next/server';

// Activity types
type ActivityType = 'mint' | 'swap' | 'send' | 'receive' | 'list' | 'sale' | 'unknown';

type Activity = {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: number;
  value?: string;
  chain: string;
  txHash: string;
  explorerUrl: string;
};

// Chain configs for Alchemy
const EVM_CHAINS = [
  { key: 'ethereum', subdomain: 'eth-mainnet', explorer: 'https://etherscan.io/tx/' },
  { key: 'base', subdomain: 'base-mainnet', explorer: 'https://basescan.org/tx/' },
  { key: 'arbitrum', subdomain: 'arb-mainnet', explorer: 'https://arbiscan.io/tx/' },
  { key: 'polygon', subdomain: 'polygon-mainnet', explorer: 'https://polygonscan.com/tx/' },
  { key: 'optimism', subdomain: 'opt-mainnet', explorer: 'https://optimistic.etherscan.io/tx/' },
];

// Helius transaction type mapping
const HELIUS_TYPE_MAP: Record<string, ActivityType> = {
  'NFT_MINT': 'mint',
  'NFT_SALE': 'sale',
  'NFT_LISTING': 'list',
  'SWAP': 'swap',
  'TRANSFER': 'send', // Will be refined based on direction
  'TOKEN_MINT': 'mint',
  'UNKNOWN': 'unknown',
};

// Format time ago
function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

// Fetch Solana activity from Helius
async function fetchSolanaActivity(address: string): Promise<Activity[]> {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) {
    console.warn('Missing HELIUS_API_KEY');
    return []; 
  }

  try {
    const response = await fetch(
      `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${apiKey}&limit=15`,
      { next: { revalidate: 30 } } // Cache for 30 seconds
    );

    if (!response.ok) {
      console.error('Helius API error:', response.status, await response.text());
      return [];
    }

    const transactions = await response.json();
    
    // Normalize address for comparison
    const searchAddr = address.toLowerCase();

    return transactions.map((tx: any) => {
      const type = HELIUS_TYPE_MAP[tx.type] || 'unknown';
      
      // Refine transfer direction
      let refinedType = type;
      let title = tx.description || tx.type;
      let value = '';

      // Parse token transfers for value
      if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
        const transfer = tx.tokenTransfers[0];
        const amount = transfer.tokenAmount || 0;
        const symbol = transfer.mint?.slice(0, 4) || 'tokens';
        
        // Check for address match (case insensitive)
        const from = (transfer.fromUserAccount || '').toLowerCase();
        const to = (transfer.toUserAccount || '').toLowerCase();

        if (from === searchAddr) {
          refinedType = 'send';
          value = `-${amount.toFixed(2)} ${symbol}`;
        } else if (to === searchAddr) {
          refinedType = 'receive';
          value = `+${amount.toFixed(2)} ${symbol}`;
        }
      }

      // Parse native transfers
      if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
        const transfer = tx.nativeTransfers[0];
        const solAmount = (transfer.amount / 1e9).toFixed(4);
        
        const from = (transfer.fromUserAccount || '').toLowerCase();
        const to = (transfer.toUserAccount || '').toLowerCase();

        if (from === searchAddr) {
          refinedType = 'send';
          value = `-${solAmount} SOL`;
        } else if (to === searchAddr) {
          refinedType = 'receive';
          value = `+${solAmount} SOL`;
        }
      }

      // Better titles based on type
      if (tx.type === 'SWAP') {
        title = 'Swapped tokens';
        if (tx.description) title = tx.description.split(' on ')[0]; // Remove DEX name
      } else if (tx.type === 'NFT_MINT') {
        title = 'Minted NFT';
      } else if (tx.type === 'NFT_SALE') {
        title = 'Sold NFT';
      } else if (tx.type === 'TRANSFER') {
        title = refinedType === 'receive' ? 'Received' : 'Sent';
      }

      return {
        id: tx.signature,
        type: refinedType,
        title: title.length > 30 ? title.substring(0, 30) + '...' : title,
        description: tx.description,
        timestamp: tx.timestamp * 1000, // Convert to ms
        value,
        chain: 'solana',
        txHash: tx.signature,
        explorerUrl: `https://solscan.io/tx/${tx.signature}`,
      };
    });
  } catch (error) {
    console.error('Error fetching Solana activity:', error);
    return [];
  }
}

// Fetch EVM activity from Alchemy
async function fetchEvmActivity(address: string): Promise<Activity[]> {
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    console.log('No Alchemy API key configured');
    return [];
  }

  const activities: Activity[] = [];

  // Fetch from all EVM chains in parallel
  const promises = EVM_CHAINS.map(async (chain) => {
    try {
      // Fetch outgoing transfers
      const outgoingRes = await fetch(
        `https://${chain.subdomain}.g.alchemy.com/v2/${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'alchemy_getAssetTransfers',
            params: [{
              fromBlock: '0x0',
              toBlock: 'latest',
              fromAddress: address,
              category: ['external', 'erc20', 'erc721', 'erc1155'],
              order: 'desc',
              maxCount: '0x5', // 5 transactions per chain to keep it fast
              withMetadata: true,
            }],
          }),
          next: { revalidate: 30 },
        }
      );

      if (outgoingRes.ok) {
        const data = await outgoingRes.json();
        const transfers = data.result?.transfers || [];
        
        for (const tx of transfers) {
          let type: ActivityType = 'send';
          let title = 'Sent';
          let value = '';

          if (tx.from === '0x0000000000000000000000000000000000000000') {
            type = 'mint';
            title = 'Minted';
          }

          if (tx.value) {
            const symbol = tx.asset || 'ETH';
            value = `-${parseFloat(tx.value).toFixed(4)} ${symbol}`;
          }

          if (tx.asset) {
            title = `${title} ${tx.asset}`;
          }

          const timestamp = tx.metadata?.blockTimestamp 
            ? new Date(tx.metadata.blockTimestamp).getTime()
            : Date.now();

          activities.push({
            id: `${tx.hash}-${tx.uniqueId}`,
            type,
            title: title.length > 30 ? title.substring(0, 30) + '...' : title,
            timestamp,
            value,
            chain: chain.key,
            txHash: tx.hash,
            explorerUrl: `${chain.explorer}${tx.hash}`,
          });
        }
      }

      // Fetch incoming transfers
      const incomingRes = await fetch(
        `https://${chain.subdomain}.g.alchemy.com/v2/${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'alchemy_getAssetTransfers',
            params: [{
              fromBlock: '0x0',
              toBlock: 'latest',
              toAddress: address,
              category: ['external', 'erc20', 'erc721', 'erc1155'],
              order: 'desc',
              maxCount: '0x5',
              withMetadata: true,
            }],
          }),
          next: { revalidate: 30 },
        }
      );

      if (incomingRes.ok) {
        const data = await incomingRes.json();
        const transfers = data.result?.transfers || [];

        for (const tx of transfers) {
          let type: ActivityType = 'receive';
          let title = 'Received';
          let value = '';

          if (tx.from === '0x0000000000000000000000000000000000000000') {
            type = 'mint';
            title = 'Minted';
          }

          if (tx.value) {
            const symbol = tx.asset || 'ETH';
            value = `+${parseFloat(tx.value).toFixed(4)} ${symbol}`;
          }

          if (tx.asset) {
            title = `${title} ${tx.asset}`;
          }

          const timestamp = tx.metadata?.blockTimestamp 
            ? new Date(tx.metadata.blockTimestamp).getTime()
            : Date.now();

          activities.push({
            id: `${tx.hash}-${tx.uniqueId}-in`,
            type,
            title: title.length > 30 ? title.substring(0, 30) + '...' : title,
            timestamp,
            value,
            chain: chain.key,
            txHash: tx.hash,
            explorerUrl: `${chain.explorer}${tx.hash}`,
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching activity for ${chain.key}:`, error);
    }
  });

  await Promise.all(promises);

  return activities;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const evmAddress = searchParams.get('evmAddress');
  const solanaAddress = searchParams.get('solanaAddress');

  if (!evmAddress && !solanaAddress) {
    return NextResponse.json({ error: 'No wallet address provided' }, { status: 400 });
  }

  const allActivities: Activity[] = [];

  // Fetch in parallel
  const [solanaActivities, evmActivities] = await Promise.all([
    solanaAddress ? fetchSolanaActivity(solanaAddress) : Promise.resolve([]),
    evmAddress ? fetchEvmActivity(evmAddress) : Promise.resolve([]),
  ]);

  allActivities.push(...solanaActivities, ...evmActivities);

  // Sort by timestamp (newest first) and limit to 20
  const sortedActivities = allActivities
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20)
    .map(activity => ({
      ...activity,
      timeAgo: timeAgo(activity.timestamp),
    }));

  return NextResponse.json({ activities: sortedActivities });
}
