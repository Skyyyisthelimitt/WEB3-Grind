"use client";
import { useEffect, useState } from "react";

const extractSheetId = (url: string) => {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

const getSheetUrl = (winners: string) => {
  // Check if it's already a URL
  if (winners.startsWith('https://docs.google.com')) {
    return winners;
  }
  // If it's just a title/name, construct URL using the master spreadsheet
  return `https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_MASTER_SHEET_ID}/edit#gid=0`;
};

export default function CollabsPage() {
  const [collabs, setCollabs] = useState([]);

  useEffect(() => {
    fetch("/api/collabs")
      .then((res) => res.json())
      .then((data) => setCollabs(data.collabs || []))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="p-6 text-gray-100 h-screen">
      <h1 className="text-2xl font-semibold mb-4">Collab Management</h1>
      <div className="border border-gray-800 rounded-lg max-h-[calc(100vh-8rem)] overflow-hidden">
        <div className="overflow-y-auto">
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
            <tbody>
              {collabs.length > 0 ? (
                collabs.map((c: any) => (
                  <tr key={c.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                    <td className="px-4 py-2">{c.project}</td>
                    <td className="px-4 py-2">
                      <a href={c.twitter} className="text-blue-400 hover:underline" target="_blank">
                        Twitter
                      </a>
                    </td>
                    <td className="px-4 py-2">
                      {c.community ? (
                        <a href={c.community} className="text-blue-400 hover:underline" target="_blank">
                          {c.communityType || 'Community'} {/* Show community type if available */}
                        </a>
                      ) : (
                        "-"
                      )}
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
                          href={getSheetUrl(c.winners)}
                          className="text-blue-400 hover:underline" 
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {c.winners.includes('https://') ? 'Winners Sheet' : c.winners}
                        </a>
                      ) : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={9}>
                    No collabs found
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
