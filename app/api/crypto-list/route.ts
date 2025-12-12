import { NextResponse } from "next/server";

const CACHE = new Map<string, { data: any; expiresAt: number }>();
const TTL = 60 * 1000; // 60 seconds

export async function GET() {
  const API_KEY = process.env.COINMARKETCAP_API_KEY;
  const cacheKey = "crypto-list";
  const cached = CACHE.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.data);
  }

  // Top cryptocurrencies to fetch
  const symbols = "BTC,ETH,SOL,BNB,XRP,ADA,DOGE,AVAX,DOT,LINK,MATIC,UNI,ATOM,LTC,APE,ARB,OP,SUI,APT,INJ";

  try {
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbols}&convert=USD`;
    const resp = await fetch(url, {
      headers: { "X-CMC_PRO_API_KEY": API_KEY ?? "" },
      cache: "no-store",
    });

    if (!resp.ok) {
      // Return fallback data if API fails
      return NextResponse.json({ cryptos: getFallbackData() });
    }

    const json = await resp.json();
    const cryptos = Object.entries(json.data || {}).map(([symbol, coin]: [string, any]) => ({
      id: coin.slug,
      symbol: coin.symbol,
      name: coin.name,
      price: coin.quote?.USD?.price ?? 0,
      marketCap: coin.quote?.USD?.market_cap ?? 0,
      circulatingSupply: coin.circulating_supply ?? 0,
      change24h: coin.quote?.USD?.percent_change_24h ?? 0,
      sparkline: generateSparkline(coin.quote?.USD?.price ?? 100, coin.quote?.USD?.percent_change_24h ?? 0),
    }));

    const result = { cryptos };
    CACHE.set(cacheKey, { data: result, expiresAt: now + TTL });
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("Crypto list fetch error:", e.message);
    return NextResponse.json({ cryptos: getFallbackData() });
  }
}

// Generate sparkline data based on price and 24h change
function generateSparkline(price: number, change: number): number[] {
  const points = 12;
  const startPrice = price / (1 + change / 100);
  const step = (price - startPrice) / points;
  return Array.from({ length: points }, (_, i) => {
    const base = startPrice + step * i;
    const noise = base * (Math.random() * 0.02 - 0.01);
    return base + noise;
  });
}

// Fallback data when API is unavailable
function getFallbackData() {
  return [
    { id: "bitcoin", symbol: "BTC", name: "Bitcoin", price: 97500, marketCap: 1920000000000, circulatingSupply: 19700000, change24h: 2.15, sparkline: [95000, 96000, 95500, 97000, 96500, 97500] },
    { id: "ethereum", symbol: "ETH", name: "Ethereum", price: 3650, marketCap: 439000000000, circulatingSupply: 120200000, change24h: 1.32, sparkline: [3500, 3550, 3600, 3580, 3620, 3650] },
    { id: "solana", symbol: "SOL", name: "Solana", price: 225, marketCap: 107000000000, circulatingSupply: 475000000, change24h: -0.84, sparkline: [230, 228, 225, 227, 224, 225] },
    { id: "bnb", symbol: "BNB", name: "BNB", price: 715, marketCap: 103000000000, circulatingSupply: 144000000, change24h: 0.45, sparkline: [710, 712, 715, 713, 716, 715] },
    { id: "xrp", symbol: "XRP", name: "XRP", price: 2.35, marketCap: 135000000000, circulatingSupply: 57400000000, change24h: -1.23, sparkline: [2.40, 2.38, 2.35, 2.37, 2.34, 2.35] },
    { id: "cardano", symbol: "ADA", name: "Cardano", price: 1.05, marketCap: 37000000000, circulatingSupply: 35200000000, change24h: 3.21, sparkline: [1.00, 1.02, 1.03, 1.04, 1.06, 1.05] },
    { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", price: 0.42, marketCap: 62000000000, circulatingSupply: 147000000000, change24h: 5.67, sparkline: [0.38, 0.40, 0.41, 0.40, 0.43, 0.42] },
    { id: "avalanche", symbol: "AVAX", name: "Avalanche", price: 48.50, marketCap: 20000000000, circulatingSupply: 412000000, change24h: -2.15, sparkline: [50, 49, 48, 49, 47, 48.5] },
    { id: "polkadot", symbol: "DOT", name: "Polkadot", price: 8.75, marketCap: 13500000000, circulatingSupply: 1540000000, change24h: 1.89, sparkline: [8.50, 8.60, 8.70, 8.65, 8.80, 8.75] },
    { id: "chainlink", symbol: "LINK", name: "Chainlink", price: 25.80, marketCap: 16200000000, circulatingSupply: 628000000, change24h: 4.32, sparkline: [24, 24.5, 25, 25.2, 25.6, 25.8] },
  ];
}
