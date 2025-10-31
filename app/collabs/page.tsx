"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function CollabsPage() {
  const [collabs, setCollabs] = useState([]);
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="p-6 text-gray-100">
      <h1 className="text-2xl font-semibold mb-4">
        Collab Management - {tab === "done" ? "Done" : "Ongoing"}
      </h1>
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
              ) : collabs.length > 0 ? (
                collabs.map((c: any) => (
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
                    No {tab} collabs found
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
