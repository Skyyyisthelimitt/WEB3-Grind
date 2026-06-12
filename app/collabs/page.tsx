"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { 
  Search01Icon, 
  Notification03Icon, 
  Delete01Icon, 
  Calendar01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Link01Icon,
  Add01Icon,
  CheckmarkCircle01Icon,
  UserMultiple02Icon,
  Copy01Icon,
  DragDropIcon,
} from "hugeicons-react";
import EditProfileModal from "../components/EditProfileModal";


const DEFAULT_COMMUNITIES = [
  "Minted",
  "HOC",
  "Truth",
  "Doosin Alpha",
  "Viriya",
  "Source Alpha",
  "Aji Club",
];

const STATUS_OPTIONS = ["Not Posted", "Posted", "Submitted", "Cancel"];

type Collab = {
  id: number;
  project: string;
  twitter?: string;
  community?: string;
  spots?: string;
  contact?: string;
  teamSpots?: string;
  status?: string;
  dueAt?: string; // ISO timestamp
  giveawayLink?: string;
  winners?: string;
};

const getStatusColor = (status: string) => {
  switch(status) {
    case "Not Posted": return "#38bdf8"; // blue
    case "Posted": return "#fbbf24"; // yellow
    case "Submitted": return "#86efac"; // green
    case "Cancel": return "#f87171"; // red
    default: return "#94a3b8"; // slate
  }
};

export default function CollabsPage() {
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab") || "ongoing";
  
  const [rows, setRows] = useState<Collab[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const debounceTimers = useRef<Record<number, NodeJS.Timeout>>({});

  // Bulk select
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Sort
  const [sortConfig, setSortConfig] = useState<{ col: keyof Collab; dir: 'asc' | 'desc' } | null>(null);
  
  // Profile State
  const [profile, setProfile] = useState<any>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const json = await res.json();
        setProfile(json.profile);
      }
    } catch (e) {
      console.error("Profile fetch error", e);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Community State
  const [communities, setCommunities] = useState<string[]>(DEFAULT_COMMUNITIES);

  useEffect(() => {
    const saved = localStorage.getItem('collab_communities');
    if (saved) {
      try {
        setCommunities(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved communities", e);
      }
    }
  }, []);

  const handleAddCommunity = (newCom: string) => {
    if (newCom && !communities.includes(newCom)) {
      const updated = [...communities, newCom];
      setCommunities(updated);
      localStorage.setItem('collab_communities', JSON.stringify(updated));
    }
  };

  const handleRemoveCommunity = (com: string) => {
    if (confirm(`Remove community "${com}"?`)) {
      const updated = communities.filter(c => c !== com);
      setCommunities(updated);
      localStorage.setItem('collab_communities', JSON.stringify(updated));
    }
  };

  // Load Initial Data
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/collabs?tab=${tab}`, { cache: "no-store" });
        const json = await res.json();
        if (alive) {
          setRows(json.collabs || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [tab]);

  // Create Row
  const createRow = async () => {
    const tempId = Date.now();
    const newRow: Partial<Collab> = {
      project: "New Collab",
      status: tab === "done" ? "Submitted" : "Not Posted",
    };
    
    setRows(prev => [...prev, { id: tempId, ...newRow } as Collab]);

    try {
      const res = await fetch("/api/collabs", {
        method: "POST",
        body: JSON.stringify(newRow),
      });
      if (!res.ok) {
        const json = await res.json();
        console.error(json);
      } else {
        const refreshRes = await fetch(`/api/collabs?tab=${tab}`, { cache: "no-store" });
        const json = await refreshRes.json();
        setRows(json.collabs || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update Row — handles single edits, OR bulk edits if the row is selected
  const updateRow = async (id: number, updates: Partial<Collab>) => {
    const isBulk = selectedIds.has(id) && selectedIds.size > 1;
    const targetIds = isBulk ? Array.from(selectedIds) : [id];

    setRows(prev => prev.map(r => targetIds.includes(r.id) ? { ...r, ...updates } : r));

    targetIds.forEach(targetId => {
      if (debounceTimers.current[targetId]) clearTimeout(debounceTimers.current[targetId]);
      debounceTimers.current[targetId] = setTimeout(async () => {
        try {
          await fetch(`/api/collabs?id=${targetId}`, { method: "PUT", body: JSON.stringify(updates) });
        } catch (e) { console.error("Failed to save", e); }
        delete debounceTimers.current[targetId];
      }, 500);
    });
  };

  // Delete Row
  const deleteRow = async (id: number) => {
    if(!confirm("Delete this collab?")) return;
    setRows(prev => prev.filter(r => r.id !== id));
    setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    await fetch(`/api/collabs?id=${id}`, { method: "DELETE" });
  };

  // Bulk Delete
  const handleDeleteSelected = async () => {
    if (!selectedIds.size) return;
    if (!confirm(`Delete ${selectedIds.size} selected collab(s)?`)) return;
    const ids = Array.from(selectedIds);
    setRows(prev => prev.filter(r => !selectedIds.has(r.id)));
    setSelectedIds(new Set());
    await Promise.all(ids.map(id => fetch(`/api/collabs?id=${id}`, { method: "DELETE" })));
  };

  // Duplicate Row
  const duplicateRow = async (id: number) => {
    const src = rows.find(r => r.id === id);
    if (!src) return;
    const newRow = {
      project: src.project + " (copy)",
      twitter: src.twitter,
      community: src.community,
      spots: src.spots,
      contact: src.contact,
      teamSpots: src.teamSpots,
      status: src.status || "Not Posted",
      giveawayLink: src.giveawayLink,
      winners: src.winners,
    };
    const tempId = Date.now();
    setRows(prev => [...prev, { id: tempId, ...newRow } as Collab]);
    try {
      const res = await fetch("/api/collabs", { method: "POST", body: JSON.stringify(newRow) });
      if (res.ok) {
        const refreshRes = await fetch(`/api/collabs?tab=${tab}`, { cache: "no-store" });
        const json = await refreshRes.json();
        setRows(json.collabs || []);
      }
    } catch (e) { console.error(e); }
  };

  // Sort
  const handleSort = (col: keyof Collab) => {
    setSortConfig(prev =>
      prev?.col === col
        ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { col, dir: 'asc' }
    );
  };

  // Excel-like multi-line paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startRowIdx: number, colName: keyof Collab) => {
    const pasteData = e.clipboardData.getData('text');
    if (pasteData.includes('\n')) {
      e.preventDefault();
      const lines = pasteData.split(/\r?\n/).filter(line => line.trim() !== '');
      
      const newRows = [...rows];
      const updatesToMake: { id: number; updates: Partial<Collab> }[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const targetRowIdx = startRowIdx + i;
        if (targetRowIdx < filtered.length) {
          const targetRow = filtered[targetRowIdx];
          updatesToMake.push({ id: targetRow.id, updates: { [colName]: lines[i].trim() } });
          const realIdx = newRows.findIndex(r => r.id === targetRow.id);
          if (realIdx >= 0) newRows[realIdx] = { ...newRows[realIdx], [colName]: lines[i].trim() };
        }
      }
      
      setRows(newRows);
      
      updatesToMake.forEach(({ id, updates }) => {
        if (debounceTimers.current[id]) clearTimeout(debounceTimers.current[id]);
        debounceTimers.current[id] = setTimeout(async () => {
          try {
            await fetch(`/api/collabs?id=${id}`, { method: "PUT", body: JSON.stringify(updates) });
          } catch (e) {}
          delete debounceTimers.current[id];
        }, 500);
      });
    }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = !s
      ? rows
      : rows.filter(r =>
          [r.project, r.twitter, r.community, r.status, r.contact]
            .map(v => (v || "").toString().toLowerCase())
            .join(" ")
            .includes(s)
        );
    if (sortConfig) {
      list = [...list].sort((a, b) => {
        const av = (a[sortConfig.col] || "").toString().toLowerCase();
        const bv = (b[sortConfig.col] || "").toString().toLowerCase();
        return sortConfig.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return list;
  }, [rows, q, sortConfig]);

  // Select all (only filtered rows)
  const allFilteredSelected = filtered.length > 0 && filtered.every(r => selectedIds.has(r.id));
  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(prev => { const s = new Set(prev); filtered.forEach(r => s.delete(r.id)); return s; });
    } else {
      setSelectedIds(prev => { const s = new Set(prev); filtered.forEach(r => s.add(r.id)); return s; });
    }
  };

  const handleDateChange = (id: number, isoDate: string) => {
    updateRow(id, { dueAt: isoDate });
  };

  // Sort indicator helper
  const SortIcon = ({ col }: { col: keyof Collab }) => {
    if (sortConfig?.col !== col) return <ArrowDown01Icon size={10} className="inline ml-1 opacity-20" />;
    return sortConfig.dir === 'asc'
      ? <ArrowUp01Icon size={10} className="inline ml-1 text-blue-400" />
      : <ArrowDown01Icon size={10} className="inline ml-1 text-blue-400" />;
  };

  return (
    <div className="flex flex-col min-h-screen pb-10">
      {/* Sticky Header */}
      <div className="h-[88px] border-b border-zinc-900/60 bg-black/40 backdrop-blur-sm sticky top-0 z-30">
        <div className="h-full w-full max-w-[1500px] mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search01Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search collabs..."
              className="w-full pl-10 pr-12 py-2 rounded-xl bg-zinc-900/60 border border-white/30 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          <div className="flex items-center gap-3">

             <button 
               onClick={() => setIsEditProfileOpen(true)}
               className="w-10 h-10 rounded-full overflow-hidden border-2 border-zinc-700 hover:border-zinc-500 transition-colors flex items-center justify-center bg-zinc-800"
             >
               {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt="Profile" width={40} height={40} className="w-full h-full object-cover"/>
               ) : (
                  <UserMultiple02Icon size={20} className="text-zinc-400" />
               )}
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto w-full px-4 md:px-6 pt-6 flex-1">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">{tab === "done" ? "Done Collabs" : "Ongoing Collabs"}</h1>
            <p className="text-sm text-zinc-400 mt-1">
              {tab === "done" 
                ? "View your completed and submitted collaborations." 
                : "Track and manage your active collaborations and their status."}
            </p>
          </div>
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all text-sm font-medium"
            >
              <Delete01Icon size={14} />
              Delete {selectedIds.size} selected
            </button>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800 overflow-x-auto bg-black/40">
           <table className="w-full text-sm" style={{ tableLayout: "fixed", minWidth: "1280px" }}>
             <thead className="bg-zinc-900/50 text-white">
               <tr>
                 <th className="w-[40px] bg-zinc-900/20 border-r border-zinc-800 px-2 text-center">
                   <input
                     type="checkbox"
                     checked={allFilteredSelected}
                     onChange={toggleSelectAll}
                     className="accent-blue-500 w-4 h-4 cursor-pointer"
                   />
                 </th>
                 <th onClick={() => handleSort('project')} className="px-2 py-3 text-center border-r border-zinc-800 bg-zinc-900/20 font-medium text-xs uppercase tracking-wider w-[140px] cursor-pointer hover:text-blue-300 select-none">Project<SortIcon col="project" /></th>
                 <th className="px-2 py-3 text-center border-r border-zinc-800 bg-zinc-900/20 font-medium text-xs uppercase tracking-wider w-[210px]">X</th>
                 <th onClick={() => handleSort('community')} className="px-2 py-3 text-center border-r border-zinc-800 bg-zinc-900/20 font-medium text-xs uppercase tracking-wider w-[120px] cursor-pointer hover:text-blue-300 select-none">Community<SortIcon col="community" /></th>
                 <th onClick={() => handleSort('spots')} className="px-2 py-3 text-center border-r border-zinc-800 bg-zinc-900/20 font-medium text-xs uppercase tracking-wider w-[70px] cursor-pointer hover:text-blue-300 select-none">Spots<SortIcon col="spots" /></th>
                 <th onClick={() => handleSort('contact')} className="px-2 py-3 text-center border-r border-zinc-800 bg-zinc-900/20 font-medium text-xs uppercase tracking-wider w-[120px] cursor-pointer hover:text-blue-300 select-none">Contact<SortIcon col="contact" /></th>
                 <th className="px-2 py-3 text-center border-r border-zinc-800 bg-zinc-900/20 font-medium text-xs uppercase tracking-wider w-[90px]">Team Spots</th>
                 <th onClick={() => handleSort('status')} className="px-2 py-3 text-center border-r border-zinc-800 bg-zinc-900/20 font-medium text-xs uppercase tracking-wider w-[110px] cursor-pointer hover:text-blue-300 select-none">Status<SortIcon col="status" /></th>
                 <th onClick={() => handleSort('dueAt')} className="px-2 py-3 text-center border-r border-zinc-800 bg-zinc-900/20 font-medium text-xs uppercase tracking-wider w-[120px] cursor-pointer hover:text-blue-300 select-none">Due Date<SortIcon col="dueAt" /></th>
                 <th className="px-2 py-3 text-center border-r border-zinc-800 bg-zinc-900/20 font-medium text-xs uppercase tracking-wider w-[140px]">Giveaway</th>
                 <th className="px-2 py-3 text-center border-r border-zinc-800 bg-zinc-900/20 font-medium text-xs uppercase tracking-wider w-[110px]">Winners</th>
                 <th className="w-[110px] bg-zinc-900/50 border-zinc-800"></th>
               </tr>
             </thead>
             <tbody>
               {loading ? (
                 <tr><td colSpan={13} className="p-8 text-center text-zinc-500">Loading...</td></tr>
               ) : (
                 <>
                   {filtered.map((r, rowIdx) => (
                     <tr
                       key={r.id}
                       className={`group border-t border-zinc-900 transition-colors relative ${
                         selectedIds.has(r.id) ? 'bg-blue-500/5' : 'hover:bg-zinc-900/30'
                       }`}
                     >
                       {/* Checkbox with drag handle */}
                       <td className="border-r border-zinc-800 border-t border-zinc-900 w-[40px] text-center px-2 flex items-center justify-center gap-1 h-full py-3 cursor-grab active:cursor-grabbing">
                         <input
                           type="checkbox"
                           checked={selectedIds.has(r.id)}
                           onChange={() => setSelectedIds(prev => {
                             const s = new Set(prev);
                             s.has(r.id) ? s.delete(r.id) : s.add(r.id);
                             return s;
                           })}
                           className="accent-blue-500 w-4 h-4 cursor-pointer"
                         />
                       </td>
                        <Td>
                           <input 
                             value={r.project || ""}
                             onChange={(e) => updateRow(r.id, { project: e.target.value })}
                             onPaste={(e) => handlePaste(e, rowIdx, 'project')}
                             data-row-idx={rowIdx}
                             data-col="project"
                             className="w-full bg-transparent border-none focus:outline-none text-[15px] font-medium text-white text-center placeholder-zinc-700" 
                             placeholder="Project Name"
                           />
                        </Td>
                        <Td>
                          <div className="flex items-center gap-1 group/cell">
                            <input 
                              value={r.twitter || ""}
                              onChange={(e) => updateRow(r.id, { twitter: e.target.value })}
                              onPaste={(e) => handlePaste(e, rowIdx, 'twitter')}
                              data-row-idx={rowIdx}
                              data-col="twitter"
                              className="w-full bg-transparent border-none focus:outline-none text-zinc-300 text-center placeholder-zinc-700"
                              placeholder="x.com/..."
                            />
                            {r.twitter && (
                              <a 
                                href={r.twitter.startsWith('http') ? r.twitter : `https://x.com/${r.twitter.replace('x.com/','')}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1 hover:text-blue-400 text-white transition-all flex-shrink-0"
                              >
                                <Link01Icon size={14} />
                              </a>
                            )}
                          </div>
                        </Td>
                        <Td>
                          <DarkDropdown 
                            value={r.community}
                            options={communities}
                            onChange={(val: any) => updateRow(r.id, { community: val })}
                            onAdd={handleAddCommunity}
                            onDelete={handleRemoveCommunity}
                          />
                        </Td>
                        <Td>
                          <input 
                            value={r.spots || ""}
                            onChange={(e) => updateRow(r.id, { spots: e.target.value })}
                            onPaste={(e) => handlePaste(e, rowIdx, 'spots')}
                            data-row-idx={rowIdx}
                            data-col="spots"
                            className="w-full bg-transparent border-none focus:outline-none text-zinc-300 text-center placeholder-zinc-700"
                            placeholder="0"
                          />
                        </Td>
                        <Td>
                          <input 
                            value={r.contact || ""}
                            onChange={(e) => updateRow(r.id, { contact: e.target.value })}
                            onPaste={(e) => handlePaste(e, rowIdx, 'contact')}
                            data-row-idx={rowIdx}
                            data-col="contact"
                            className="w-full bg-transparent border-none focus:outline-none text-zinc-300 text-center placeholder-zinc-700"
                            placeholder="@user"
                          />
                        </Td>
                        <Td>
                          <input 
                            value={r.teamSpots || ""}
                            onChange={(e) => updateRow(r.id, { teamSpots: e.target.value })}
                            onPaste={(e) => handlePaste(e, rowIdx, 'teamSpots')}
                            data-row-idx={rowIdx}
                            data-col="teamSpots"
                            className="w-full bg-transparent border-none focus:outline-none text-zinc-300 text-center placeholder-zinc-700"
                            placeholder="0"
                          />
                        </Td>
                        <Td>
                          <DarkDropdown 
                            value={r.status}
                            options={STATUS_OPTIONS}
                            onChange={(val: any) => updateRow(r.id, { status: val })}
                            renderValue={(val: string) => (
                               <span style={{ color: getStatusColor(val) }} className="font-bold">{val || "Select"}</span>
                            )}
                          />
                        </Td>
                        <Td>
                           <div className="flex justify-center">
                             <DarkDatePicker 
                               value={r.dueAt ? r.dueAt.split("T")[0] : ""}
                               onChange={(val) => handleDateChange(r.id, val)}
                             />
                           </div>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-1 group/cell">
                            <input 
                              value={r.giveawayLink || ""}
                              onChange={(e) => updateRow(r.id, { giveawayLink: e.target.value })}
                              onPaste={(e) => handlePaste(e, rowIdx, 'giveawayLink')}
                              data-row-idx={rowIdx}
                              data-col="giveawayLink"
                              className="w-full bg-transparent border-none focus:outline-none text-zinc-400 text-center placeholder-zinc-700"
                              placeholder="Link"
                            />
                            {r.giveawayLink && (
                              <a 
                                href={r.giveawayLink.startsWith('http') ? r.giveawayLink : `https://${r.giveawayLink}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1 hover:text-blue-400 text-white transition-all flex-shrink-0"
                              >
                                <Link01Icon size={14} />
                              </a>
                            )}
                          </div>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-1 group/cell">
                            <input 
                              value={r.winners || ""}
                              onChange={(e) => updateRow(r.id, { winners: e.target.value })}
                              onPaste={(e) => handlePaste(e, rowIdx, 'winners')}
                              data-row-idx={rowIdx}
                              data-col="winners"
                              className="w-full bg-transparent border-none focus:outline-none text-zinc-400 text-center placeholder-zinc-700"
                              placeholder="Winners"
                            />
                            {r.winners && (
                              <a 
                                href={r.winners.startsWith('http') ? r.winners : `https://${r.winners}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1 hover:text-blue-400 text-white transition-all flex-shrink-0"
                              >
                                <Link01Icon size={14} />
                              </a>
                            )}
                          </div>
                        </Td>
                        <Td className="text-center">
                          <div className="flex items-center justify-center gap-2">
                              <button onClick={() => duplicateRow(r.id)} className="text-zinc-500 hover:text-blue-400 transition-colors" title="Duplicate row"><Copy01Icon size={15} /></button>
                              <button onClick={() => deleteRow(r.id)} className="text-zinc-400 hover:text-red-400 transition-colors" title="Delete"><Delete01Icon size={16} /></button>
                              {tab !== "done" && (
                                <button 
                                  onClick={() => updateRow(r.id, { status: "Submitted" })} 
                                  className="text-zinc-500 hover:text-green-400 transition-colors"
                                  title="Mark as Done"
                                >
                                  <CheckmarkCircle01Icon size={16} />
                                </button>
                              )}
                          </div>
                        </Td>
                     </tr>
                   ))}
                   <tr className="border-t border-zinc-900/50 hover:bg-zinc-900/20 cursor-pointer transition-colors" onClick={createRow}>
                      <td colSpan={12} className="py-3 text-center text-zinc-500 hover:text-zinc-300 text-xs font-medium uppercase tracking-wider">
                         + Add New Collab
                      </td>
                   </tr>
                 </>
               )}
             </tbody>
           </table>
        </div>
      </div>
      <EditProfileModal 
        isOpen={isEditProfileOpen} 
        onClose={() => setIsEditProfileOpen(false)} 
        profile={profile}
        onProfileUpdate={fetchProfile}
      />
    </div>
  );
}

function Td({ children, className="" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-2 py-3 text-center border-r border-zinc-800 last:border-r-0 border-t border-zinc-900 ${className}`}>{children}</td>;
}

function DarkDropdown({ value, options, onChange, renderValue, renderOption, onAdd, onDelete }: any) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [isAdding, setIsAdding] = useState(false);
  const [newOption, setNewOption] = useState("");
  
  const [openUp, setOpenUp] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      if (open && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const shouldOpenUp = spaceBelow < 260 && rect.top > 260;
        setOpenUp(shouldOpenUp);
        setCoords({
          top: shouldOpenUp ? rect.top - 2 : rect.bottom + 2,
          left: rect.left + (rect.width / 2),
          width: rect.width
        });
      }
    };
    
    if (open) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    } else {
      setIsAdding(false);
      setNewOption("");
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOption.trim() && onAdd) {
      onAdd(newOption.trim());
      setNewOption("");
      setIsAdding(false);
    }
  };

  return (
    <>
      <button 
        ref={buttonRef}
        onClick={() => setOpen(!open)} 
        className="w-full flex justify-center outline-none hover:bg-zinc-800/30 rounded py-1 transition-colors"
      >
        {renderValue ? renderValue(value) : (
          <span className="text-zinc-300 font-medium truncate px-1">{value || "Select"}</span>
        )}
      </button>
      
      {open && (
        <div className="fixed inset-0 z-[9999]" onClick={() => setOpen(false)}>
          <div 
            className="absolute bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl py-1 max-h-[260px] flex flex-col overflow-hidden"
            style={{ 
              top: coords.top, 
              left: coords.left, 
              transform: openUp ? 'translateX(-50%) translateY(-100%)' : 'translateX(-50%)',
              minWidth: onAdd ? "160px" : Math.max(coords.width, 100) + "px",
              maxWidth: "240px",
              zIndex: 10000 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-y-auto flex-1 scrollbar-thin">
              {options.map((opt: string) => (
                <div 
                  key={opt} 
                  className="group px-3 py-2 hover:bg-zinc-800 cursor-pointer text-xs text-zinc-300 font-medium transition-colors flex items-center justify-between"
                  onClick={() => { onChange(opt); setOpen(false); }}
                >
                  <span className="truncate flex-1 text-center">{renderOption ? renderOption(opt) : opt}</span>
                  {onDelete && (
                     <button 
                       onClick={(e) => { e.stopPropagation(); onDelete(opt); }}
                       className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-1 ml-2 transition-opacity"
                     >
                       <Delete01Icon size={12} />
                     </button>
                  )}
                </div>
              ))}
            </div>

            {onAdd && (
               <div className="border-t border-zinc-800 p-2 bg-zinc-900/50">
                 {isAdding ? (
                    <form onSubmit={handleAddSubmit} className="flex gap-1">
                       <input 
                         autoFocus
                         value={newOption}
                         onChange={(e) => setNewOption(e.target.value)}
                         className="flex-1 bg-zinc-800 text-white text-xs px-2 py-1 rounded border border-zinc-700 outline-none"
                         placeholder="Name..."
                       />
                       <button type="submit" className="text-blue-400 p-1 hover:text-white"><Add01Icon size={14} /></button>
                    </form>
                 ) : (
                    <button 
                      onClick={() => setIsAdding(true)}
                      className="w-full flex items-center justify-center gap-1 text-xs text-blue-400 hover:text-blue-300 py-1"
                    >
                       <Add01Icon size={12} /> Add Community
                    </button>
                 )}
               </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function DarkDatePicker({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    if (value) setViewDate(new Date(value));
  }, [open, value]);

  useEffect(() => {
    const updatePosition = () => {
      if (open && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setCoords({ top: rect.bottom + 4, left: rect.left });
      }
    };
    if (open) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const startDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  const handleDayClick = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const iso = `${d.getFullYear()}-${m}-${dd}`;
    onChange(iso);
    setOpen(false);
  };

  const changeMonth = (delta: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  };

  return (
    <>
      <button 
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-center gap-2 hover:bg-zinc-800/30 rounded py-1 outline-none text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <span className="text-sm">{value || "Due Date"}</span>
        <Calendar01Icon size={14} className="text-white" />
      </button>

      {open && (
         <div className="fixed inset-0 z-[9999]" onClick={() => setOpen(false)}>
           <div 
             className="absolute bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-4 w-[280px]"
             style={{ top: coords.top, left: coords.left }}
             onClick={(e) => e.stopPropagation()}
           >
             <div className="flex items-center justify-between mb-4">
               <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"><ArrowLeft01Icon size={16} /></button>
               <span className="text-sm font-semibold text-zinc-100">
                 {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
               </span>
               <button onClick={() => changeMonth(1)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"><ArrowRight01Icon size={16} /></button>
             </div>

             <div className="grid grid-cols-7 mb-2">
               {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                 <div key={d} className="text-center text-[10px] uppercase font-bold text-zinc-500">{d}</div>
               ))}
             </div>

             <div className="grid grid-cols-7 gap-1">
               {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
               {Array.from({ length: daysInMonth }).map((_, i) => {
                 const day = i + 1;
                 const currentDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                 const cm = String(currentDate.getMonth() + 1).padStart(2, '0');
                 const cd = String(currentDate.getDate()).padStart(2, '0');
                 const dateStr = `${currentDate.getFullYear()}-${cm}-${cd}`;
                 const isSelected = value === dateStr;
                 
                 const now = new Date();
                 const nm = String(now.getMonth() + 1).padStart(2, '0');
                 const nd = String(now.getDate()).padStart(2, '0');
                 const todayStr = `${now.getFullYear()}-${nm}-${nd}`;
                 const isToday = dateStr === todayStr;

                 return (
                   <button
                     key={day}
                     onClick={() => handleDayClick(day)}
                     className={`
                       h-8 w-8 rounded-lg text-xs font-medium flex items-center justify-center transition-all
                       ${isSelected ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"}
                       ${isToday && !isSelected ? "border border-blue-500/30 text-blue-400" : ""}
                     `}
                   >
                     {day}
                   </button>
                 );
               })}
             </div>
             
             <div className="flex justify-between mt-4 pt-3 border-t border-zinc-800">
                <button onClick={() => { onChange(""); setOpen(false); }} className="text-xs text-zinc-500 hover:text-zinc-300">Clear</button>
                <button onClick={() => { 
                   const now = new Date();
                   const m = String(now.getMonth() + 1).padStart(2, '0');
                   const d = String(now.getDate()).padStart(2, '0');
                   const today = `${now.getFullYear()}-${m}-${d}`;
                   onChange(today); 
                   setOpen(false); 
                 }} className="text-xs text-blue-400 hover:text-blue-300 font-medium">Today</button>
             </div>
           </div>
         </div>
      )}
    </>
  );
}