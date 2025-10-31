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
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    project: "",
    x: "",
    type: "" as WLType | "",
    chain: "" as Chain | "",
    wallet: "",
    mintDate: "",
    mintPrice: "",
  });

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
        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="relative flex-1 max-w-[420px]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search whitelists or collabs…"
              className="w-full rounded-xl bg-zinc-900/70 border border-blue-500/20 ring-1 ring-blue-500/30 shadow shadow-blue-500/20 px-3 py-2 pr-10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60"></span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-2 rounded-xl text-sm font-medium bg-blue-600/10 text-white border border-blue-500/20 ring-1 ring-blue-500/30 shadow shadow-blue-500/20 hover:bg-blue-600/20 hover:text-white transition-transform active:scale-95 whitespace-nowrap shrink-0"
          >
            + Add Whitelist
          </button>
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

      {/* Add Whitelist Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => {
          setIsModalOpen(false);
          setFormData({ project: "", x: "", type: "" as WLType | "", chain: "" as Chain | "", wallet: "", mintDate: "", mintPrice: "" });
        }}>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">Add Whitelist</h2>
                <p className="text-sm text-zinc-400 mt-1">Add a new whitelist entry to your sheet</p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFormData({ project: "", x: "", type: "" as WLType | "", chain: "" as Chain | "", wallet: "", mintDate: "", mintPrice: "" });
                }}
                className="text-zinc-400 hover:text-zinc-100 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              console.log("Form data:", formData);
              // TODO: Submit to API/Google Sheet
              setFormData({ project: "", x: "", type: "" as WLType | "", chain: "" as Chain | "", wallet: "", mintDate: "", mintPrice: "" });
              setIsModalOpen(false);
            }} className="p-6 space-y-4">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Project Name *</label>
                <input
                  type="text"
                  required
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/20"
                  placeholder="Enter project name"
                />
              </div>

              {/* X Link */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">X Link</label>
                <input
                  type="url"
                  value={formData.x}
                  onChange={(e) => setFormData({ ...formData, x: e.target.value })}
                  className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/20"
                  placeholder="https://x.com/..."
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Type *</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as WLType })}
                  className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/20"
                >
                  <option value="">Select type</option>
                  <option value="GTD">GTD</option>
                  <option value="FCFS">FCFS</option>
                  <option value="WL">WL</option>
                  <option value="OG">OG</option>
                </select>
              </div>

              {/* Chain */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Chain *</label>
                <select
                  required
                  value={formData.chain}
                  onChange={(e) => setFormData({ ...formData, chain: e.target.value as Chain })}
                  className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/20"
                >
                  <option value="">Select chain</option>
                  <option value="ETH">ETH</option>
                  <option value="SOL">SOL</option>
                  <option value="BTC">BTC</option>
                  <option value="APE">APE</option>
                  <option value="BASE">BASE</option>
                  <option value="ABS">ABS</option>
                  <option value="Monad">MONAD</option>
                  <option value="HYPER">HYPER</option>
                </select>
              </div>

              {/* Wallet */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Wallet *</label>
                <select
                  required
                  value={formData.wallet}
                  onChange={(e) => setFormData({ ...formData, wallet: e.target.value })}
                  className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/20"
                >
                  <option value="">Select wallet</option>
                  <option value="Main">Main</option>
                  <option value="2nd Wallet">2nd Wallet</option>
                  <option value="Alphabot Wallet">Alphabot Wallet</option>
                  <option value="HOC">HOC</option>
                </select>
              </div>

              {/* Mint Date */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Mint Date</label>
                <input
                  type="date"
                  value={formData.mintDate}
                  onChange={(e) => setFormData({ ...formData, mintDate: e.target.value })}
                  className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/20"
                />
              </div>

              {/* Mint Price */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Mint Price</label>
                <input
                  type="text"
                  value={formData.mintPrice}
                  onChange={(e) => setFormData({ ...formData, mintPrice: e.target.value })}
                  className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/20"
                  placeholder="e.g., 0.5 SOL, 45$, TBA"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormData({ project: "", x: "", type: "" as WLType | "", chain: "" as Chain | "", wallet: "", mintDate: "", mintPrice: "" });
                  }}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-zinc-800/50 text-zinc-300 border border-zinc-700 hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600/10 text-white border border-blue-500/20 ring-1 ring-blue-500/30 shadow shadow-blue-500/20 hover:bg-blue-600/20 transition"
                >
                  Add Whitelist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-3 py-2">{children}</th>;
}
function Td({ children, className="" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}
