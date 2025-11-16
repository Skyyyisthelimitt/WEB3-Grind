"use client";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";

export default function CollabsPage() {
  const [collabs, setCollabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab") || "ongoing";

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
              placeholder="Search whitelists or collabs…"
              className="w-full rounded-xl bg-zinc-900/70 border border-blue-500/20 ring-1 ring-blue-500/30 shadow shadow-blue-500/20 px-3 py-2 pr-10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60"></span>
          </div>
          <button
            onClick={() => {
              // TODO: Open add collab modal
              console.log("Add collab clicked");
            }}
            className="px-3 py-2 rounded-xl text-sm font-medium bg-blue-600/10 text-white border border-blue-500/20 ring-1 ring-blue-500/30 shadow shadow-blue-500/20 hover:bg-blue-600/20 hover:text-white transition-transform active:scale-95 whitespace-nowrap shrink-0"
          >
            + Add Collab
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-2 text-center">
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
                          href={c.winners}  // Use the direct URL instead of getSheetUrl
                          className="text-blue-400 hover:underline" 
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Winners Sheet
                        </a>
                      ) : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-2 text-center text-gray-500">
                    {q.trim() ? "No collabs match your search" : `No ${tab} collabs found`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
