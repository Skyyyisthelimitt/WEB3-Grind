import { NextResponse } from "next/server";

const TIMEFRAME_MAP: Record<
  string,
  { endpoint: "histohour" | "histoday"; limit: number }
> = {
  "1": { endpoint: "histohour", limit: 24 }, // 24 hours worth of points
  "7": { endpoint: "histohour", limit: 7 * 24 }, // 7 days, hourly resolution
  "30": { endpoint: "histoday", limit: 30 }, // 30 daily closes
};

const SYMBOLS = new Set(["BTC", "ETH", "SOL"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") || "BTC").toUpperCase();
  const days = searchParams.get("days") || "7";

  const { endpoint, limit } = TIMEFRAME_MAP[days] ?? TIMEFRAME_MAP["7"];
  const fsym = SYMBOLS.has(symbol) ? symbol : "BTC";
  const apiKey = process.env.CRYPTOCOMPARE_API_KEY;

  const url = new URL(`https://min-api.cryptocompare.com/data/v2/${endpoint}`);
  url.searchParams.set("fsym", fsym);
  url.searchParams.set("tsym", "USD");
  url.searchParams.set("limit", String(limit));

  try {
    const resp = await fetch(url, {
      headers: apiKey
        ? {
            authorization: `Apikey ${apiKey}`,
          }
        : undefined,
      cache: "no-store",
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: text }, { status: resp.status });
    }

    const data = await resp.json();

    if (data.Response === "Error") {
      return NextResponse.json({ error: data.Message }, { status: 502 });
    }

    const points: { close: number }[] = data?.Data?.Data ?? [];
    const prices = points.map((point) => Number(point.close) || 0);

    return NextResponse.json({ prices });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

