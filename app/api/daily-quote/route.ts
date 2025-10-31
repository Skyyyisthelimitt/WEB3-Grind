import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://zenquotes.io/api/today", { cache: "no-store" });
    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: txt }, { status: res.status });
    }
    const data = await res.json();
    const first = Array.isArray(data) && data.length ? data[0] : null;
    return NextResponse.json({
      text: first?.q || "Keep going.",
      author: first?.a || "",
    });
  } catch (e: any) {
    return NextResponse.json({ text: "Ship, learn, iterate.", author: "" });
  }
}
