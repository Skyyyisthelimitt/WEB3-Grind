import { NextResponse } from "next/server";

const PRICE_CACHE = new Map<
  string,
  { data: any; expiresAt: number }
>();
const PRICE_TTL = 60 * 1000; // 60 seconds

export async function GET(request: Request) {
  const API_KEY = process.env.COINMARKETCAP_API_KEY;
  const urlObj = new URL(request.url);
  const symbolsParam = urlObj.searchParams.get("symbols") ?? "BTC,ETH,SOL";
  const normalized = symbolsParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const uniqueSymbols = Array.from(new Set(normalized));
  const symbolQuery = (uniqueSymbols.length ? uniqueSymbols : ["BTC", "ETH", "SOL"]).join(",");

  const cacheKey = symbolQuery;
  const cached = PRICE_CACHE.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.data);
  }

  const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbolQuery}&convert=USD`;
  try {
    const resp = await fetch(url, {
      headers: { "X-CMC_PRO_API_KEY": API_KEY ?? "" },
      cache: "no-store",
    });
    if (!resp.ok) {
      const text = await resp.text();
      if (cached) {
        return NextResponse.json(cached.data);
      }
      return NextResponse.json({ error: text }, { status: resp.status });
    }
    const data = await resp.json();
    PRICE_CACHE.set(cacheKey, { data, expiresAt: now + PRICE_TTL });
    return NextResponse.json(data);
  } catch (e: any) {
    if (cached) {
      return NextResponse.json(cached.data);
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
