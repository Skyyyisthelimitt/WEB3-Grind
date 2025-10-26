"use client";
import { useEffect, useState } from "react";

export default function CollabsPage() {
  const [collabs, setCollabs] = useState([]);

  useEffect(() => {
    fetch("/api/collabs")
      .then((res) => res.json())
      .then((data) => setCollabs(data.collabs || []))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="p-6 text-gray-100">
      <h1 className="text-2xl font-semibold mb-4">Collab Management</h1>
      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="min-w-full text-sm text-gray-300">
          <thead className="bg-gray-800 text-gray-400 uppercase">
            <tr>
              <th className="px-4 py-2 text-left">Project</th>
              <th className="px-4 py-2 text-left">Twitter</th>
              <th className="px-4 py-2 text-left">Community</th>
              <th className="px-4 py-2 text-left">Spots</th>
              <th className="px-4 py-2 text-left">Team Spots</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Due Date</th>
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
                        Discord
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-2">{c.spots}</td>
                  <td className="px-4 py-2">{c.teamSpots}</td>
                  <td className="px-4 py-2">{c.status}</td>
                  <td className="px-4 py-2">{c.dueAt}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={7}>
                  No collabs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
