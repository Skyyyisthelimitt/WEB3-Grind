// app/whitelists/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Chain = "ETH" | "SOL" | "BTC" | "APE" | "BASE" | "ABS" | "Monad" | "HYPER";
type WLType = "GTD" | "FCFS" | "OG" | "WL";
type WL = {
  id: number;
  project: string;
  x?: string;
  chain: Chain;
  type: WLType;
  wallets?: string;
  mintDate?: string;
  price?: string;
};

export default function WhitelistsPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<WL[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/wl", { cache: "no-store" });
        const json = await res.json();
        if (alive) setRows(Array.isArray(json?.wls) ? json.wls : []);
      } catch (e) {
        console.error(e);
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r =>
      [r.project, r.x, r.chain, r.type, r.wallets].filter(Boolean).join(" ").toLowerCase().includes(s)
    );
  }, [rows, q]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Whitelists <span className="text-sm text-zinc-500">({filtered.length})</span></h1>
        <div className="relative w-80">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by project, chain, type, wallet…"
            className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-3 py-2 pr-9 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60">🔎</span>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/60 text-zinc-300">
            <tr>
              <Th>Project</Th>
              <Th>X</Th>
              <Th>Type</Th>
              <Th>Chain</Th>
              <Th>Wallet</Th>
              <Th>Mint Date</Th>
              <Th>Mint Price</Th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="py-10 text-center text-zinc-500">Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-zinc-500">
                  No rows yet. Add one in your sheet or check <Link href="/api/wl" className="text-violet-400 hover:underline">/api/wl</Link>.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-zinc-900 hover:bg-white/5 transition">
                <Td className="font-medium">{r.project}</Td>
                <Td>{r.x ? <a href={r.x} target="_blank" className="text-violet-400 hover:underline">{r.x}</a> : "-"}</Td>
                <Td>{r.type}</Td>
                <Td>{r.chain}</Td>
                <Td>{r.wallets || "-"}</Td>
                <Td>{r.mintDate || "-"}</Td>
                <Td>{r.price ?? "-"}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Source: Google Sheet → <code>/api/wl</code>. If you don’t see your rows, open{" "}
        <Link href="/api/wl" className="text-violet-400 hover:underline">/api/wl</Link> to confirm the API is returning data.
      </p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-3 py-2">{children}</th>;
}
function Td({ children, className="" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}
