"use client";
import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const COMMUNITIES = [
  "Minted",
  "HOC",
  "Truth",
  "Doosin Alpha",
  "Viriya",
  "Source Alpha",
  "Aji Club",
];

function CollabsContent() {
  const [collabs, setCollabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab") || "ongoing";

  // Form state
  const [formData, setFormData] = useState({
    project: "",
    twitter: "",
    community: "",
    spots: "",
    contact: "",
    teamSpots: "",
    status: "",
    dueAt: "",
    giveawayLink: "",
    winners: "",
  });

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/collabs?id=${id}&tab=${tab}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete collab");
        return;
      }
      // Refresh the collabs list
      setLoading(true);
      const refreshRes = await fetch(`/api/collabs?tab=${tab}`, { cache: "no-store" });
      const refreshJson = await refreshRes.json();
      const filteredCollabs = (refreshJson.collabs || []).filter((collab: any) => 
        collab.project || collab.twitter || collab.community || collab.spots
      );
      setCollabs(filteredCollabs);
      setLoading(false);
    } catch (error) {
      console.error("Error deleting collab:", error);
      alert("Failed to delete collab. Please try again.");
    }
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/collabs?tab=${tab}`)
      .then((res) => res.json())
      .then((data) => {
        // Filter out rows where all main fields are empty
        const filteredCollabs = (data.collabs || []).filter((collab: any) => 
          collab.project || 
          collab.twitter || 
          collab.community || 
          collab.spots
        );
        setCollabs(filteredCollabs);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [tab]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return collabs;
    return collabs.filter((c: any) =>
      [c.project, c.twitter, c.community, c.status, c.spots].filter(Boolean).join(" ").toLowerCase().includes(s)
    );
  }, [collabs, q]);

  return (
    <div className="p-6 text-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">
          Collab Management - {tab === "done" ? "Done" : "Ongoing"} <span className="text-sm text-zinc-500">({filtered.length})</span>
        </h1>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="relative flex-1 max-w-[420px]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search collabs…"
              className="w-full rounded-xl bg-zinc-900/70 border border-white/20 ring-1 ring-white/10 shadow shadow-black/20 px-3 py-2 pr-10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60"></span>
          </div>
          <button
            onClick={() => {
              setFormData({ project: "", twitter: "", community: "", spots: "", contact: "", teamSpots: "", status: "", dueAt: "", giveawayLink: "", winners: "" });
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-zinc-100 text-zinc-900 hover:bg-white transition-all hover:scale-105 active:scale-95 whitespace-nowrap shrink-0"
          >
            Add Collab
          </button>
        </div>
      </div>
      <div className="border border-gray-800 rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-300">
            <thead className="bg-gray-800 text-gray-400 uppercase sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left">Project</th>
                <th className="px-4 py-2 text-left">Twitter</th>
                <th className="px-4 py-2 text-left">Community</th>
                <th className="px-4 py-2 text-left">Spots</th>
                <th className="px-4 py-2 text-left">Team Spots</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Due Date</th>
                <th className="px-4 py-2 text-left">GA</th>
                <th className="px-4 py-2 text-left">Winners</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-2 text-center">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-800/40">
                    <td className="px-4 py-2">{c.project}</td>
                    <td className="px-4 py-2">
                      <a href={c.twitter} className="text-blue-400 hover:underline" target="_blank">
                        Twitter
                      </a>
                    </td>
                    <td className="px-4 py-2">
                      {c.community ? (
                        c.community.match(/^https?:\/\//i)
                          ? <a href={c.community} className="text-blue-400 hover:underline" target="_blank">{c.community}</a>
                          : c.community
                      ) : "-"}
                    </td>
                    <td className="px-4 py-2">{c.spots}</td>
                    <td className="px-4 py-2">{c.teamSpots}</td>
                    <td className="px-4 py-2">{c.status}</td>
                    <td className="px-4 py-2">{c.dueAt}</td>
                    <td className="px-4 py-2">
                      {c.giveawayLink ? (
                        <a 
                          href={c.giveawayLink} 
                          className="text-blue-400 hover:underline break-all" 
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {c.giveawayLink}
                        </a>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-2">
                      {c.winners ? (
                        <a 
                          href={c.winners}
                          className="text-blue-400 hover:underline" 
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Winners Sheet
                        </a>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setFormData({
                              project: c.project || "",
                              twitter: c.twitter || "",
                              community: c.community || "",
                              spots: c.spots || "",
                              contact: c.contact || "",
                              teamSpots: c.teamSpots || "",
                              status: c.status || "",
                              dueAt: c.dueAt || "",
                              giveawayLink: c.giveawayLink || "",
                              winners: c.winners || "",
                            });
                            setEditingId(c.id);
                            setIsModalOpen(true);
                          }}
                          className="px-2 py-1 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-900 hover:bg-white transition-all hover:scale-105 active:scale-95"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${c.project}"?`)) {
                              handleDelete(c.id);
                            }
                          }}
                          className="px-2 py-1 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-900 hover:bg-white transition-all hover:scale-105 active:scale-95"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-2 text-center text-gray-500">
                    {q.trim() ? "No collabs match your search" : `No ${tab} collabs found`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Collab Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => {
          setIsModalOpen(false);
          setFormData({ project: "", twitter: "", community: "", spots: "", contact: "", teamSpots: "", status: "", dueAt: "", giveawayLink: "", winners: "" });
          setEditingId(null);
        }}>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">{editingId ? "Edit Collab" : "Add Collab"}</h2>
                <p className="text-sm text-zinc-400 mt-1">{editingId ? "Update collab entry" : `Add a new collab entry to your ${tab} sheet`}</p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFormData({ project: "", twitter: "", community: "", spots: "", contact: "", teamSpots: "", status: "", dueAt: "", giveawayLink: "", winners: "" });
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
                const payload = { ...formData, tab };
                const url = editingId ? `/api/collabs?id=${editingId}&tab=${tab}` : "/api/collabs";
                const method = editingId ? "PUT" : "POST";
                const res = await fetch(url, {
                  method,
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                  cache: "no-store",
                });
                const data = await res.json();
                if (!res.ok) {
                  const errorMsg = data.error || data.message || `Failed to ${editingId ? "update" : "add"} collab`;
                  console.error("API Error:", errorMsg);
                  alert(`Error: ${errorMsg}`);
                  setIsSubmitting(false);
                  return;
                }
                // Reset form and close modal
                setFormData({ project: "", twitter: "", community: "", spots: "", contact: "", teamSpots: "", status: "", dueAt: "", giveawayLink: "", winners: "" });
                setEditingId(null);
                setIsModalOpen(false);
                setIsSubmitting(false);
                // Refresh the collabs list
                setLoading(true);
                const refreshRes = await fetch(`/api/collabs?tab=${tab}`, { cache: "no-store" });
                const refreshJson = await refreshRes.json();
                const filteredCollabs = (refreshJson.collabs || []).filter((collab: any) => 
                  collab.project || collab.twitter || collab.community || collab.spots
                );
                setCollabs(filteredCollabs);
                setLoading(false);
              } catch (error) {
                console.error("Error submitting form:", error);
                alert(`Failed to ${editingId ? "update" : "add"} collab. Please try again.`);
                setIsSubmitting(false);
                setLoading(false);
              }
            }} className="p-6 space-y-4">
              {/* Project */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Project *</label>
                <input
                  type="text"
                  required
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/20"
                  placeholder="Enter project name"
                />
              </div>

              {/* Twitter */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Twitter/X Link</label>
                <input
                  type="url"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/20"
                  placeholder="https://x.com/..."
                />
              </div>

              {/* Community */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Community</label>
                <select
                  value={formData.community}
                  onChange={(e) => setFormData({ ...formData, community: e.target.value })}
                  className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/20"
                >
                  <option value="">Select community</option>
                  {COMMUNITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Spots */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Spots</label>
                <input
                  type="text"
                  value={formData.spots}
                  onChange={(e) => setFormData({ ...formData, spots: e.target.value })}
                  className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/20"
                  placeholder="e.g., 5 GTD, 20 FCFS"
                />
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Contact</label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/20"
                  placeholder="Enter contact (e.g., orpheuzkaze)"
                />
              </div>

              {/* Team Spots */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Team Spots</label>
                <input
                  type="text"
                  value={formData.teamSpots}
                  onChange={(e) => setFormData({ ...formData, teamSpots: e.target.value })}
                  className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/20"
                  placeholder="Enter team spots"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/20"
                >
                  <option value="">Select status</option>
                  <option value="Not Posted">Not Posted</option>
                  <option value="Posted">Posted</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Cancel">Cancel</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Due Date</label>
                <input
                  type="date"
                  value={formData.dueAt}
                  onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                  className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/20"
                />
              </div>

              {/* Giveaway Link */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Giveaway Link (GA)</label>
                <input
                  type="url"
                  value={formData.giveawayLink}
                  onChange={(e) => setFormData({ ...formData, giveawayLink: e.target.value })}
                  className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/20"
                  placeholder="https://..."
                />
              </div>

              {/* Winners */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Winners Link</label>
                <input
                  type="url"
                  value={formData.winners}
                  onChange={(e) => setFormData({ ...formData, winners: e.target.value })}
                  className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/20"
                  placeholder="https://..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormData({ project: "", twitter: "", community: "", spots: "", contact: "", teamSpots: "", status: "", dueAt: "", giveawayLink: "", winners: "" });
                    setEditingId(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-zinc-800/50 text-zinc-300 border border-zinc-700 hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-zinc-100 text-zinc-900 hover:bg-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (editingId ? "Updating..." : "Adding...") : (editingId ? "Update Collab" : "Add Collab")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CollabsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-100">Loading...</div>}>
      <CollabsContent />
    </Suspense>
  );
}