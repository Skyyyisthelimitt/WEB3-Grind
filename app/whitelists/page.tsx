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
  mintTime?: string;
  mintTimezone?: string;
};

export default function WhitelistsPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<WL[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    project: "",
    x: "",
    type: "" as WLType | "",
    chain: "" as Chain | "",
    wallet: "",
    mintDate: "",
    mintPrice: "",
    mintTime: "",
    mintTimezone: "UTC",
  });

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/wl?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete whitelist");
        return;
      }
      // Refresh the list
      const refreshRes = await fetch("/api/wl", { cache: "no-store" });
      const refreshJson = await refreshRes.json();
      setRows(Array.isArray(refreshJson?.wls) ? refreshJson.wls : []);
    } catch (error) {
      console.error("Error deleting whitelist:", error);
      alert("Failed to delete whitelist. Please try again.");
    }
  };

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
              placeholder="Search whitelists…"
              className="w-full rounded-xl bg-zinc-900/70 border border-blue-500/20 ring-1 ring-blue-500/30 shadow shadow-blue-500/20 px-3 py-2 pr-10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60"></span>
          </div>
          <button
            onClick={() => {
              setFormData({ project: "", x: "", type: "" as WLType | "", chain: "" as Chain | "", wallet: "", mintDate: "", mintPrice: "", mintTime: "", mintTimezone: "UTC" });
              setEditingId(null);
              setIsModalOpen(true);
            }}
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
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="py-10 text-center text-zinc-500">Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-zinc-500">
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
                <Td>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setFormData({
                          project: r.project,
                          x: r.x || "",
                          type: r.type,
                          chain: r.chain,
                          wallet: r.wallets || "",
                          mintDate: r.mintDate || "",
                          mintPrice: r.price || "",
                          mintTime: r.mintTime || "",
                          mintTimezone: r.mintTimezone || "UTC",
                        });
                        setEditingId(r.id);
                        setIsModalOpen(true);
                      }}
                      className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-600/10 text-white border border-blue-500/20 ring-1 ring-blue-500/30 shadow shadow-blue-500/20 hover:bg-blue-600/20 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${r.project}"?`)) {
                          handleDelete(r.id);
                        }
                      }}
                      className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-600/10 text-white border border-blue-500/20 ring-1 ring-blue-500/30 shadow shadow-blue-500/20 hover:bg-blue-600/20 transition"
                    >
                      Delete
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Whitelist Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => {
          setIsModalOpen(false);
          setFormData({ project: "", x: "", type: "" as WLType | "", chain: "" as Chain | "", wallet: "", mintDate: "", mintPrice: "", mintTime: "", mintTimezone: "UTC" });
          setEditingId(null);
        }}>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">{editingId ? "Edit Whitelist" : "Add Whitelist"}</h2>
                <p className="text-sm text-zinc-400 mt-1">{editingId ? "Update whitelist entry" : "Add a new whitelist entry to your sheet"}</p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFormData({ project: "", x: "", type: "" as WLType | "", chain: "" as Chain | "", wallet: "", mintDate: "", mintPrice: "", mintTime: "", mintTimezone: "UTC" });
                  setEditingId(null);
                }}
                className="text-zinc-400 hover:text-zinc-100 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmitting(true);
              try {
                const url = editingId ? `/api/wl?id=${editingId}` : "/api/wl";
                const method = editingId ? "PUT" : "POST";
                const res = await fetch(url, {
                  method,
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(formData),
                });
                const data = await res.json();
                if (!res.ok) {
                  alert(data.error || `Failed to ${editingId ? "update" : "add"} whitelist`);
                  setIsSubmitting(false);
                  return;
                }
                // Reset form and close modal
                setFormData({ project: "", x: "", type: "" as WLType | "", chain: "" as Chain | "", wallet: "", mintDate: "", mintPrice: "", mintTime: "", mintTimezone: "UTC" });
                setEditingId(null);
                setIsModalOpen(false);
                setIsSubmitting(false);
                // Refresh the whitelist list
                const refreshRes = await fetch("/api/wl", { cache: "no-store" });
                const refreshJson = await refreshRes.json();
                setRows(Array.isArray(refreshJson?.wls) ? refreshJson.wls : []);
              } catch (error) {
                console.error("Error submitting form:", error);
                alert(`Failed to ${editingId ? "update" : "add"} whitelist. Please try again.`);
                setIsSubmitting(false);
              }
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

              {/* Mint Time */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Mint Time</label>
                <input
                  type="time"
                  value={formData.mintTime}
                  onChange={(e) => setFormData({ ...formData, mintTime: e.target.value })}
                  className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/20"
                />
              </div>

              {/* Mint Timezone */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Timezone</label>
                <select
                  value={formData.mintTimezone}
                  onChange={(e) => setFormData({ ...formData, mintTimezone: e.target.value })}
                  className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/20"
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">EST (UTC-5)</option>
                  <option value="PST">PST (UTC-8)</option>
                  <option value="CST">CST (UTC-6)</option>
                  <option value="GMT">GMT (UTC+0)</option>
                  <option value="JST">JST (UTC+9)</option>
                  <option value="SGT">SGT (UTC+8)</option>
                  <option value="PH">PH (UTC+8)</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormData({ project: "", x: "", type: "" as WLType | "", chain: "" as Chain | "", wallet: "", mintDate: "", mintPrice: "", mintTime: "", mintTimezone: "UTC" });
                    setEditingId(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-zinc-800/50 text-zinc-300 border border-zinc-700 hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600/10 text-white border border-blue-500/20 ring-1 ring-blue-500/30 shadow shadow-blue-500/20 hover:bg-blue-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (editingId ? "Updating..." : "Adding...") : (editingId ? "Update Whitelist" : "Add Whitelist")}
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
