"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search01Icon, Notification03Icon, Add01Icon, Delete01Icon, ArrowDown01Icon, Calendar01Icon, ArrowLeft01Icon, ArrowRight01Icon } from "hugeicons-react";
import pfp from "../images/khun.jpg";

type Chain = "ETH" | "SOL" | "BTC" | "APE" | "BASE" | "ABS" | "MONAD" | "HYPER";
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

const CHAIN_COLORS: Record<string, string> = {
  ETH: "#9ca3af",
  SOL: "#8b5cf6",
  BTC: "#f59e0b",
  APE: "#1e3a8a",
  BASE: "#38bdf8",
  ABS: "#86efac",
  MONAD: "#c084fc",
  HYPER: "#14532d",
};

const WALLET_OPTIONS = ["Main", "2nd Wallet", "Alphabot Wallet", "HOC"];
const TIMEZONES = ["UTC", "EST", "PST", "CST", "JST", "SGT", "PH"];

const getChainColor = (chain: string) => {
  const norm = chain.toUpperCase();
  return CHAIN_COLORS[norm] || "#8b5cf6";
};

export default function WhitelistsPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<WL[]>([]);
  const [loading, setLoading] = useState(true);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Column Widths State
  const [colWidths, setColWidths] = useState({
    project: 200,
    x: 150,
    type: 100,
    chain: 100,
    wallets: 150,
    mintDate: 150,
    time: 160,
    price: 100,
  });

  const handleResize = (col: keyof typeof colWidths, newWidth: number) => {
    setColWidths(prev => ({ ...prev, [col]: newWidth }));
  };

  // Load initial data
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/wl", { cache: "no-store" });
        const json = await res.json();
        if (alive) {
          setRows(json.wls ?? []);
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const createRow = async () => {
    const newRow = {
      project: "New Whitelist",
      chain: "ETH" as Chain,
      type: "WL" as WLType,
      wallets: "",
      mintDate: "",
      price: "", 
    };

    const tempId = Date.now();
    const optimisticRow = { ...newRow, id: tempId, pId: tempId };
    setRows(prev => [...prev, optimisticRow as any]);

    try {
      const res = await fetch("/api/wl", {
        method: "POST",
        body: JSON.stringify(newRow),
      });
      if (res.ok) {
        // ideally we get the real ID back
        // For now, refreshing is acceptable or we use the data from response
        const json = await res.json();
        if (json.whitelist) {
            setRows(prev => prev.map(r => r.id === tempId ? json.whitelist : r));
        } else {
             // Fallback refresh
             const refresh = await fetch("/api/wl", { cache: "no-store" });
             const refreshJson = await refresh.json();
             setRows(refreshJson.wls ?? []);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateRow = async (id: number, updates: Partial<WL>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        await fetch("/api/wl", {
          method: "PUT",
          body: JSON.stringify({ id, ...updates }),
        });
      } catch (e) {
        console.error("Failed to save", e);
      }
    }, 500);
  };

  const deleteRow = async (id: number) => {
    if(!confirm("Delete this whitelist?")) return;
    setRows(prev => prev.filter(r => r.id !== id));
    await fetch("/api/wl", { method: "DELETE", body: JSON.stringify({ id }) });
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r => {
      const text = [
        r.project, 
        r.x, 
        r.chain, 
        r.type, 
        r.wallets,
        r.mintDate,
        r.price?.toString(),
        r.notes
      ].map(v => (v || "").toString().toLowerCase()).join(" ");
      return text.includes(s);
    });
  }, [rows, q]);

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
              placeholder="Search whitelists..."
              className="w-full pl-10 pr-12 py-2 rounded-xl bg-zinc-900/60 border border-white/30 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none opacity-50">
              <span className="text-[10px] font-medium text-zinc-400 bg-zinc-800/50 px-1.5 py-0.5 rounded border border-zinc-700/50">⌘ F</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-xl bg-zinc-900/70 border border-white/30 hover:bg-zinc-800 transition-colors">
              <Notification03Icon size={18} className="text-white" />
            </button>
            <button className="w-10 h-10 rounded-full overflow-hidden border-2 border-zinc-700 hover:border-zinc-500 transition-colors">
              <Image 
                src={pfp} 
                alt="Profile" 
                width={40} 
                height={40} 
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto w-full px-4 md:px-6 pt-6 flex-1">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">Whitelists</h1>
            <p className="text-sm text-zinc-400 mt-1">Manage and track your whitelist opportunities.</p>
          </div>
        </div>

      <div className="rounded-xl border border-zinc-800 overflow-x-auto bg-black/40">
        <table className="w-full text-sm" style={{ tableLayout: "fixed", minWidth: "1000px" }}>
          <thead className="bg-zinc-900/50 text-white">
            <tr>
              <ResizableTh width={colWidths.project} onResize={(w) => handleResize("project", w)}>Project</ResizableTh>
              <ResizableTh width={colWidths.x} onResize={(w) => handleResize("x", w)}>X</ResizableTh>
              <ResizableTh width={colWidths.type} onResize={(w) => handleResize("type", w)}>Type</ResizableTh>
              <ResizableTh width={colWidths.chain} onResize={(w) => handleResize("chain", w)}>Chain</ResizableTh>
              <ResizableTh width={colWidths.wallets} onResize={(w) => handleResize("wallets", w)}>Wallet</ResizableTh>
              <ResizableTh width={colWidths.mintDate} onResize={(w) => handleResize("mintDate", w)}>Mint Date</ResizableTh>
              <ResizableTh width={colWidths.time} onResize={(w) => handleResize("time", w)}>Time</ResizableTh>
              <ResizableTh width={colWidths.price} onResize={(w) => handleResize("price", w)}>Price</ResizableTh>
              <th className="w-[60px] bg-zinc-900/50 border-zinc-800"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-8 text-center text-zinc-500">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-zinc-500">No whitelists found.</td></tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="group border-t border-zinc-900 hover:bg-zinc-900/30 transition-colors relative">
                  <Td>
                    <input 
                      value={r.project} 
                      onChange={(e) => updateRow(r.id, { project: e.target.value })}
                      placeholder="Project Name"
                      className="w-full bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-zinc-200 font-medium placeholder-zinc-700 text-center text-sm"
                    />
                  </Td>
                  <Td>
                    <input 
                       value={r.x || ""} 
                       onChange={(e) => updateRow(r.id, { x: e.target.value })}
                       placeholder="https://x.com/..."
                       className="w-full bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-zinc-400 text-sm text-center placeholder-zinc-800"
                    />
                  </Td>
                  <Td>
                     <DarkDropdown 
                       value={r.type}
                       options={["WL", "OG", "GTD", "FCFS"]}
                       onChange={(val: any) => updateRow(r.id, { type: val })}
                     />
                  </Td>
                  <Td>
                     <DarkDropdown 
                       value={r.chain}
                       options={Object.keys(CHAIN_COLORS)}
                       onChange={(val: any) => updateRow(r.id, { chain: val })}
                       renderValue={(val: string) => (
                         <span 
                           className="px-2 py-0.5 rounded text-xs font-bold border tracking-wide inline-block min-w-[50px]"
                           style={{ 
                             borderColor: `${getChainColor(val)}40`, 
                             backgroundColor: `${getChainColor(val)}15`, 
                             color: getChainColor(val)
                           }}
                         >
                           {val ? val.toUpperCase() : "ETH"}
                         </span>
                       )}
                       renderOption={(val: string) => (
                         <span style={{ color: getChainColor(val) }} className="font-bold text-sm">{val}</span>
                       )}
                     />
                  </Td>
                  <Td>
                     <DarkDropdown 
                       value={r.wallets || "Main"}
                       options={WALLET_OPTIONS}
                       onChange={(val: any) => updateRow(r.id, { wallets: val })}
                     />
                  </Td>
                  <Td>
                     <DarkDatePicker 
                       value={r.mintDate || ""} 
                       onChange={(val: string) => updateRow(r.id, { mintDate: val })}
                     />
                  </Td>
                  <Td>
                    <TimeCell 
                      value={r.mintTime} 
                      timezone={r.mintTimezone}
                      onTimeChange={(val: string) => updateRow(r.id, { mintTime: val })}
                      onZoneChange={(val: string) => updateRow(r.id, { mintTimezone: val })}
                    />
                  </Td>
                  <Td className="group-hover:pr-8 relative">
                     <input 
                       value={r.price || ""} 
                       onChange={(e) => updateRow(r.id, { price: e.target.value })}
                       placeholder="Price"
                       className="w-full bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-zinc-400 text-center text-sm placeholder-zinc-800"
                    />
                  </Td>
                   <td className="border-t border-zinc-900 border-l border-zinc-800 text-center px-1">
                    <button 
                      onClick={() => deleteRow(r.id)}
                      className="p-1 text-white hover:text-red-500 transition-colors mx-auto"
                      title="Delete"
                    >
                      <Delete01Icon size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <button 
          onClick={createRow}
          className="w-full py-3 px-4 flex items-center gap-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30 transition-colors border-t border-zinc-800 text-sm font-medium"
        >
          <Add01Icon size={16} />
          <span>New Whitelist</span>
        </button>
      </div>
      </div>
    </div>
  );
}

// --- Components ---

function ResizableTh({ width, onResize, children }: { width: number, onResize: (w: number) => void, children: React.ReactNode }) {
  const startX = useRef(0);
  const startW = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startX.current = e.clientX;
    startW.current = width;
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX.current;
      onResize(Math.max(50, startW.current + diff));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  return (
    <th 
      className="text-center px-2 py-3 font-medium text-white text-xs uppercase tracking-wider border-r border-zinc-800 bg-zinc-900/20 relative"
      style={{ width }}
    >
      <div className="w-full truncate px-1">{children}</div>
      {/* Drag Handle */}
      <div 
        onMouseDown={onMouseDown} 
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/50 z-10 transition-colors"
      />
    </th>
  );
}

function Td({ children, className="" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-2 py-3 text-center border-r border-zinc-800 last:border-r-0 border-t border-zinc-900 ${className} overflow-hidden`}>{children}</td>;
}

function DarkDropdown({ value, options, onChange, renderValue, renderOption }: any) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  // Update coords when opening or scrolling
  useEffect(() => {
    const updatePosition = () => {
      if (open && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + 2, // slight gap
          left: rect.left,
          width: rect.width
        });
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
            className="absolute bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl py-1 overflow-y-auto max-h-[300px]"
            style={{ 
              top: coords.top, 
              left: coords.left, 
              width: Math.max(coords.width, 120), // Min width
              zIndex: 10000 
            }}
            onClick={(e) => e.stopPropagation()} // Prevent backdrop click
          >
            {options.map((opt: string) => (
              <div 
                key={opt} 
                onClick={() => { onChange(opt); setOpen(false); }} 
                className="px-3 py-2 hover:bg-zinc-800 cursor-pointer text-xs text-zinc-300 font-medium transition-colors text-center"
              >
                {renderOption ? renderOption(opt) : opt}
              </div>
            ))}
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
  }, [open]); // Reset view on open/change

  useEffect(() => {
    const updatePosition = () => {
      if (open && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        // Keep inside viewport ideally, but basic positioning:
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
  const startDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay(); // 0 = Sun

  const handleDayClick = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    // Format YYYY-MM-DD using local time to avoid timezone shifts
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
        <span className="text-sm">{value || "DD/MM/YYYY"}</span>
        <Calendar01Icon size={14} className="text-white" />
      </button>

      {open && (
         <div className="fixed inset-0 z-[9999]" onClick={() => setOpen(false)}>
           <div 
             className="absolute bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-4 w-[280px]"
             style={{ top: coords.top, left: coords.left }}
             onClick={(e) => e.stopPropagation()}
           >
             {/* Header */}
             <div className="flex items-center justify-between mb-4">
               <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"><ArrowLeft01Icon size={16} /></button>
               <span className="text-sm font-semibold text-zinc-100">
                 {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
               </span>
               <button onClick={() => changeMonth(1)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"><ArrowRight01Icon size={16} /></button>
             </div>

             {/* Days Header */}
             <div className="grid grid-cols-7 mb-2">
               {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                 <div key={d} className="text-center text-[10px] uppercase font-bold text-zinc-500">{d}</div>
               ))}
             </div>

             {/* Days Grid */}
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
             
             {/* Footer Actions */}
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

function TimeCell({ value, timezone, onTimeChange, onZoneChange }: any) {
  // Parsing 24h to 12h
  const { text, period } = useMemo(() => {
    if (!value) return { text: "", period: "AM" };
    const [h, m] = value.split(":");
    let H = parseInt(h);
    if (isNaN(H)) return { text: "", period: "AM" };
    const p = H >= 12 ? "PM" : "AM";
    if (H > 12) H -= 12;
    if (H === 0) H = 12;
    return { text: `${H}:${m}`, period: p };
  }, [value]);

  const [localText, setLocalText] = useState(text);
  
  useEffect(() => { setLocalText(text); }, [text]);

  const commit = (txt: string, p: string) => {
     if(!txt) { onTimeChange(""); return; }
     const [h, m] = txt.split(":");
     let H = parseInt(h);
     if (isNaN(H)) return; // invalid
     let M = m || "00";
     if (M.length === 1) M = "0" + M;
     
     if (p === "PM" && H < 12) H += 12;
     if (p === "AM" && H === 12) H = 0;
     const time24 = `${H.toString().padStart(2, '0')}:${M}`;
     onTimeChange(time24);
  };

  return (
    <div className="flex items-center gap-0.5 justify-center">
       <input 
         type="text"
         value={localText}
         onChange={(e) => setLocalText(e.target.value)}
         onBlur={() => commit(localText, period)}
         placeholder="00:00"
         className="bg-transparent border-none focus:outline-none text-zinc-300 text-sm text-center w-[45px] placeholder-zinc-800"
       />
       <div className="w-[45px]">
         <DarkDropdown 
            value={period}
            options={["AM", "PM"]}
            onChange={(val: string) => commit(localText, val)}
         />
       </div>
       <div className="w-[60px]">
         <DarkDropdown 
           value={timezone || "UTC"}
           options={TIMEZONES}
           onChange={onZoneChange}
         />
       </div>
    </div>
  );
}
