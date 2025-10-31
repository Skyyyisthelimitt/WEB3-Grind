import { NextResponse } from "next/server";

export async function GET() {
  const API_KEY = process.env.COINMARKETCAP_API_KEY;
  const url =
    "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC,ETH,SOL&convert=USD";
  try {
    const resp = await fetch(url, {
      headers: { "X-CMC_PRO_API_KEY": API_KEY ?? "" },
      // Ensure this uses nodejs fetch (runs only on server)
      cache: 'no-store',
    });
    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: text }, { status: resp.status });
    }
    const data = await resp.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
