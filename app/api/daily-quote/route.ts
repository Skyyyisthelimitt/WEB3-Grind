import { NextResponse } from "next/server";

const FALLBACK_QUOTES = [
  { text: "Ship, learn, iterate.", author: "" },
  { text: "Keep going.", author: "" },
  { text: "Progress over perfection.", author: "" },
  { text: "Build in public.", author: "" },
  { text: "Consistency beats intensity.", author: "" },
];

const fetchWithTimeout = async (url: string, timeoutMs = 4000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
};

export async function GET() {
  // Try random quote first (more variety)
  try {
    const res = await fetchWithTimeout("https://zenquotes.io/api/random");
    if (res.ok) {
      const data = await res.json();
      const first = Array.isArray(data) && data.length ? data[0] : null;
      if (first?.q) {
        return NextResponse.json({ text: first.q, author: first.a || "" });
      }
    }
  } catch {
    // timed out or network error — fall through to fallback
  }

  // Fallback to today's quote
  try {
    const res = await fetchWithTimeout("https://zenquotes.io/api/today");
    if (res.ok) {
      const data = await res.json();
      const first = Array.isArray(data) && data.length ? data[0] : null;
      if (first?.q) {
        return NextResponse.json({ text: first.q, author: first.a || "" });
      }
    }
  } catch {
    // timed out or network error — fall through to fallback
  }

  // Final fallback: return a random local quote
  const randomFallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
  return NextResponse.json(randomFallback);
}
