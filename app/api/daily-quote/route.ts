import { NextResponse } from "next/server";

const FALLBACK_QUOTES = [
  { text: "Ship, learn, iterate.", author: "" },
  { text: "Keep going.", author: "" },
  { text: "Progress over perfection.", author: "" },
  { text: "Build in public.", author: "" },
  { text: "Consistency beats intensity.", author: "" },
];

export async function GET() {
  // Try random quote first (more variety)
  try {
    const res = await fetch("https://zenquotes.io/api/random", { 
      cache: "no-store",
      next: { revalidate: 0 }
    });
    
    if (res.ok) {
      const data = await res.json();
      const first = Array.isArray(data) && data.length ? data[0] : null;
      if (first?.q) {
        return NextResponse.json({
          text: first.q,
          author: first.a || "",
        });
      }
    }
  } catch (e) {
    console.error("Random quote fetch failed:", e);
  }

  // Fallback to today's quote
  try {
    const res = await fetch("https://zenquotes.io/api/today", { 
      cache: "no-store",
      next: { revalidate: 0 }
    });
    
    if (res.ok) {
      const data = await res.json();
      const first = Array.isArray(data) && data.length ? data[0] : null;
      if (first?.q) {
        return NextResponse.json({
          text: first.q,
          author: first.a || "",
        });
      }
    }
  } catch (e) {
    console.error("Today quote fetch failed:", e);
  }

  // Final fallback: return a random fallback quote
  const randomFallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
  return NextResponse.json(randomFallback);
}
