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
  Link01Icon,
  Add01Icon,
  CheckmarkCircle01Icon,
  UserMultiple02Icon
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

  // Update Row — per-row debounce to prevent cancelling saves from other rows
  const updateRow = async (id: number, updates: Partial<Collab>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));

    if (debounceTimers.current[id]) clearTimeout(debounceTimers.current[id]);
    debounceTimers.current[id] = setTimeout(async () => {
      try {
        await fetch(`/api/collabs?id=${id}`, {
          method: "PUT",
          body: JSON.stringify(updates),
        });
      } catch (e) {
        console.error("Failed to save", e);
      }
      delete debounceTimers.current[id];
    }, 500);
  };

  // Delete Row
  const deleteRow = async (id: number) => {
    if(!confirm("Delete this collab?")) return;
    setRows(prev => prev.filter(r => r.id !== id));
    await fetch(`/api/collabs?id=${id}`, { method: "DELETE" });
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r => 
      [r.project, r.twitter, r.community, r.status, r.contact].map(v => (v||"").toString().toLowerCase()).join(" ").includes(s)
    );
  }, [rows, q]);

  const handleDateChange = (id: number, isoDate: string) => {
    updateRow(id, { dueAt: isoDate });
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
        </div>

        <div className="rounded-xl border border-zinc-800 overflow-x-auto bg-black/40">
           <table className="w-full text-sm" style={{ tableLayout: "fixed", minWidth: "1200px" }}>
             <thead className="bg-zinc-900/50 text-white">
               <tr>
                 <th className="px-2 py-3 text-center border-r border-zinc-800 bg-zinc-900/20 font-medium text-xs uppercase tracking-wider w-[150px]">Project</th>
                 <th className="px-2 py-3 text-center border-r border-zinc-800 bg-zinc-900/20 font-medium text-xs uppercase tracking-wider w-[220px]">X</th>
                 <th className="px-2 py-3 text-center border-r border-zinc-800 bg-zinc-900/20 font-medium text-xs uppercase tracking-wider w-[120px]">Community</th>
                 <th className="px-2 py-3 text-center border-r border-zinc-800 bg-zinc-900/20 font-medium text-xs uppercase tracking-wider w-[80px]">Spots</th>
                 <th className="px-2 py-3 text-center border-r border-zinc-800 bg-zinc-900/20 font-medium text-xs uppercase tracking-wider w-[130px]">Contact</th>
                 <th className="px-2 py-3 text-center border-r border-zinc-800 bg-zinc-900/20 font-medium text-xs uppercase tracking-wider w-[100px]">Team Spots</th>
                 <th className="px-2 py-3 text-center border-r border-zinc-800 bg-zinc-900/20 font-medium text-xs uppercase tracking-wider w-[110px]">Status</th>
                 <th className="px-2 py-3 text-center border-r border-zinc-800 bg-zinc-900/20 font-medium text-xs uppercase tracking-wider w-[130px]">Due Date</th>
                 <th className="px-2 py-3 text-center border-r border-zinc-800 bg-zinc-900/20 font-medium text-xs uppercase tracking-wider w-[150px]">Giveaway</th>
                 <th className="px-2 py-3 text-center border-r border-zinc-800 bg-zinc-900/20 font-medium text-xs uppercase tracking-wider w-[120px]">Winners</th>
                 <th className="w-[90px] bg-zinc-900/50 border-zinc-800"></th>
               </tr>
             </thead>
             <tbody>
               {loading ? (
                 <tr><td colSpan={11} className="p-8 text-center text-zinc-500">Loading...</td></tr>
               ) : (
                 <>
                   {filtered.map((r) => (
                     <tr key={r.id} className="group border-t border-zinc-900 hover:bg-zinc-900/30 transition-colors relative">
                        <Td>
                           <input 
                             value={r.project || ""}
                             onChange={(e) => updateRow(r.id, { project: e.target.value })}
                             className="w-full bg-transparent border-none focus:outline-none text-[15px] font-medium text-white text-center placeholder-zinc-700" 
                             placeholder="Project Name"
                           />
                        </Td>
                        <Td>
                          <div className="flex items-center gap-1 group/cell">
                            <input 
                              value={r.twitter || ""}
                              onChange={(e) => updateRow(r.id, { twitter: e.target.value })}
                              className="w-full bg-transparent border-none focus:outline-none text-zinc-300 text-center placeholder-zinc-700"
                              placeholder="x.com/..."
                            />
                            {r.twitter && (
                              <a 
                                href={r.twitter.startsWith('http') ? r.twitter : `https://x.com/${r.twitter.replace('x.com/','')}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1 hover:text-blue-400 text-white transition-all"
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
                            className="w-full bg-transparent border-none focus:outline-none text-zinc-300 text-center placeholder-zinc-700"
                            placeholder="0"
                          />
                        </Td>
                        <Td>
                          <input 
                            value={r.contact || ""}
                            onChange={(e) => updateRow(r.id, { contact: e.target.value })}
                            className="w-full bg-transparent border-none focus:outline-none text-zinc-300 text-center placeholder-zinc-700"
                            placeholder="@user"
                          />
                        </Td>
                        <Td>
                          <input 
                            value={r.teamSpots || ""}
                            onChange={(e) => updateRow(r.id, { teamSpots: e.target.value })}
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
                              className="w-full bg-transparent border-none focus:outline-none text-zinc-400 text-center placeholder-zinc-700"
                              placeholder="Link"
                            />
                            {r.giveawayLink && (
                              <a 
                                href={r.giveawayLink.startsWith('http') ? r.giveawayLink : `https://${r.giveawayLink}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1 hover:text-blue-400 text-white transition-all"
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
                              className="w-full bg-transparent border-none focus:outline-none text-zinc-400 text-center placeholder-zinc-700"
                              placeholder="Winners"
                            />
                            {r.winners && (
                              <a 
                                href={r.winners.startsWith('http') ? r.winners : `https://${r.winners}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1 hover:text-blue-400 text-white transition-all"
                              >
                                <Link01Icon size={14} />
                              </a>
                            )}
                          </div>
                        </Td>
                        <Td className="text-center">
                          <div className="flex items-center justify-center gap-3">
                              <button onClick={() => deleteRow(r.id)} className="text-zinc-400 hover:text-red-400 transition-colors"><Delete01Icon size={18} /></button>
                              {tab !== "done" && (
                                <button 
                                  onClick={() => updateRow(r.id, { status: "Submitted" })} 
                                  className="text-zinc-500 hover:text-green-400 transition-colors"
                                  title="Mark as Done"
                                >
                                  <CheckmarkCircle01Icon size={18} />
                                </button>
                              )}
                          </div>
                        </Td>
                     </tr>
                   ))}
                   <tr className="border-t border-zinc-900/50 hover:bg-zinc-900/20 cursor-pointer transition-colors" onClick={createRow}>
                      <td colSpan={11} className="py-3 text-center text-zinc-500 hover:text-zinc-300 text-xs font-medium uppercase tracking-wider">
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