import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "BTC";
  const days = searchParams.get("days") || "7";
  
  // Map symbols to CoinGecko IDs
  const coinMap: Record<string, string> = {
    BTC: "bitcoin",
    ETH: "ethereum",
    SOL: "solana",
  };
  
  const coinId = coinMap[symbol] || "bitcoin";
  
  try {
    // CoinGecko free API - no key needed
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=${days === "1" ? "hourly" : "daily"}`;
    
    const resp = await fetch(url, {
      cache: 'no-store',
    });
    
    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: text }, { status: resp.status });
    }
    
    const data = await resp.json();
    
    // Extract prices array: [[timestamp, price], ...]
    const prices = data.prices || [];
    
    // Return simplified array of price values
    return NextResponse.json({ 
      prices: prices.map(([timestamp, price]: [number, number]) => price),
      timestamps: prices.map(([timestamp]: [number]) => timestamp),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

