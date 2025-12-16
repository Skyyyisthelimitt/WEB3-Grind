"use client";

import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import { 
  Search01Icon, 
  Notification03Icon, 
  ChartAverageIcon, 
  UserMultiple02Icon, 
  Calendar03Icon,
  QuoteDownIcon,
  Book01Icon,
  Agreement01Icon,
  PieChartIcon,
  AlarmClockIcon,
  Calendar04Icon
} from "hugeicons-react";



// Local images (PNGs)
import pfp from "./images/khun.jpg";
import btcIcon from "./images/btc.png";
import ethIcon from "./images/eth.png";
import solIcon from "./images/sol.png";
import EditProfileModal from "./components/EditProfileModal";

/* ----------------------- Types ----------------------- */
type Chain =
  | "ETH"
  | "SOL"
  | "BTC"
  | "APE"
  | "BASE"
  | "ABS"
  | "MONAD"
  | "HYPER";

type WLType = "GTD" | "FCFS" | "OG" | "WL";
type Priority = "High" | "Potential" | "Early";

type WL = {
  id: number;
  project: string;
  category?: string;
  chain: Chain;
  type: WLType;
  mintDate?: string;
  price?: string;
  supply?: number;
  wallets?: string;
  notes?: string;
  priority?: Priority;
  createdAt?: string;
  status?: "Not Minted" | "Minted";
  mintTime?: string;
  mintTimezone?: string;
};

type ChainPieDatum = {
  name: Chain;
  value: number;
  projects: { label: string; count: number }[];
  percentage: number;
};

type CollabStatus = "Not Posted" | "Posted" | "Submitted" | "Cancel";

type Collab = {
  id: number;
  project: string;
  status: CollabStatus;
  giveawayLink?: string;
  dueAt?: string;
  community?: string;
};



/* --- Chain color map --- */
const CHAIN_COLORS: Record<Chain, string> = {
  ETH: "#9ca3af",
  SOL: "#8b5cf6",
  BTC: "#f59e0b",
  APE: "#1e3a8a",
  BASE: "#38bdf8",
  ABS: "#86efac",
  MONAD: "#c084fc",
  HYPER: "#14532d",
};

const CHAIN_ORDER: Chain[] = [
  "ETH",
  "BTC",
  "SOL",
  "MONAD",
  "BASE",
  "HYPER",
  "ABS",
  "APE",
];

// Helper to get chain color with case-insensitive fallback (for old "Monad" data)
const getChainColor = (chain: string): string => {
  const normalized = chain.toUpperCase() as Chain;
  return CHAIN_COLORS[normalized] || CHAIN_COLORS[chain as Chain] || "#8b5cf6";
};

/* --- Demo seed collabs --- */
const seedCollabs: Collab[] = [
  { id: 1, project: "Melio", status: "Not Posted", dueAt: "2025-08-28" },
  { id: 2, project: "Mempoolio", status: "Posted", dueAt: "2025-08-30" },
];



/* --------------------------- Page --------------------------- */
export default function DashboardPage() {


  // whitelists
  const [wls, setWls] = useState<WL[]>([]);
  const [loadingWL, setLoadingWL] = useState(true);

  const [hoveredChain, setHoveredChain] = useState<Chain | null>(null);

  // user profile
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setProfile(json.profile);
      }
    } catch (e) {
      console.error("Profile fetch error", e);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/wl", { cache: "no-store" });
        const json = await res.json();
        if (!alive) return;
        setWls(json?.wls ?? []);
      } catch (e) {
        console.error("WL fetch failed", e);
        if (!alive) return;
        setWls([]);
      } finally {
        if (alive) setLoadingWL(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);



// at top of DashboardPage (client component)
const [collabs, setCollabs] = useState<Collab[]>([]);

useEffect(() => {
  let alive = true;
  (async () => {
    try {
      const res = await fetch("/api/collabs", { cache: "no-store" });
      const json = await res.json();
      if (!alive) return;
      setCollabs(json.collabs ?? []);
    } catch (e) {
      console.error(e);
      if (!alive) return;
      setCollabs([]);
    }
  })();
  return () => { alive = false; };
}, []);


  const totals = useMemo(
    () => ({ totalWL: wls.length, totalCollabs: collabs.length }),
    [wls, collabs]
  );

  // Helper function to get the actual mint datetime (in UTC) for comparison
  const getMintDateTime = (mintDate: string, mintTime?: string, mintTimezone?: string): Date => {
    if (!mintDate) return new Date(0);
    
    const timezoneOffsets: Record<string, number> = {
      UTC: 0,
      GMT: 0,
      EST: -5,
      PST: -8,
      CST: -6,
      JST: 9,
      SGT: 8,
      PH: 8,
    };
    
    try {
      const [year, month, day] = mintDate.split("-").map(Number);
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        // Fallback: treat as end of day
        return new Date(Date.UTC(year || 2000, (month || 1) - 1, day || 1, 23, 59, 59));
      }
      
      if (mintTime) {
        const tz = mintTimezone || "UTC";
        // Parse time (HH:MM format)
        const [hours, minutes] = mintTime.split(":").map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          const sourceOffset = timezoneOffsets[tz] ?? 0;
          // Create UTC date: treat the input as if it's in the source timezone, then convert to UTC
          const sourceDateTime = new Date(Date.UTC(year, month - 1, day, hours, minutes));
          const utcDateTime = new Date(sourceDateTime.getTime() - (sourceOffset * 60 * 60 * 1000));
          return utcDateTime;
        }
      }
      
      // If no time specified, treat as end of day (23:59:59) in UTC
      return new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
    } catch (error) {
      console.error("Error parsing mint datetime:", error);
      // Fallback: treat as end of day
      const [year, month, day] = mintDate.split("-").map(Number);
      return new Date(Date.UTC(year || 2000, (month || 1) - 1, day || 1, 23, 59, 59));
    }
  };

  const upcoming7 = useMemo(() => {
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return wls.filter(
      (w) => {
        if (!w.mintDate || w.status === "Minted") return false;
        const mintDateTime = getMintDateTime(w.mintDate, w.mintTime, w.mintTimezone);
        return mintDateTime > now && mintDateTime <= in7;
      }
    ).length;
  }, [wls]);

  const pieData = useMemo<ChainPieDatum[]>(() => {
    const buckets = CHAIN_ORDER.reduce<
      Record<
        Chain,
        {
          count: number;
          projectMap: Map<string, { label: string; count: number }>;
        }
      >
    >((acc, chain) => {
      acc[chain] = { count: 0, projectMap: new Map() };
      return acc;
    }, {} as Record<
      Chain,
      { count: number; projectMap: Map<string, { label: string; count: number }> }
    >);

    for (const wl of wls) {
      // Normalize chain name to uppercase (handles old "Monad" data)
      const normalizedChain = wl.chain.toUpperCase() as Chain;
      const bucket = buckets[normalizedChain];
      if (!bucket) continue; // Skip if chain not in CHAIN_ORDER
      bucket.count += 1;
      const label = `${wl.project}${wl.type ? ` (${wl.type})` : ""}`;
      const current = bucket.projectMap.get(label) ?? { label, count: 0 };
      current.count += 1;
      bucket.projectMap.set(label, current);
    }

    const total = wls.length || 0;

    return CHAIN_ORDER.map((chain) => {
      const bucket = buckets[chain];
      const projects = Array.from(bucket.projectMap.values()).sort(
        (a, b) => b.count - a.count
      );
      return {
        name: chain,
        value: bucket.count,
        projects,
        percentage: total ? (bucket.count / total) * 100 : 0,
      };
    });
  }, [wls]);
  const pieSlices = pieData.filter((slice) => slice.value > 0);
  const pieChartData = pieSlices.length ? pieSlices : pieData;

  // Convert date and time from any timezone to PH time (UTC+8)
  // Convert date/time from source timezone to Local Browser Time
  const convertToLocalDateTime = (dateStr: string, timeStr: string, timezone: string) => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      const [hours, minutes] = timeStr.split(":").map(Number);
      
      const offsets: Record<string, number> = {
        UTC: 0, GMT: 0, EST: -5, PST: -8, CST: -6, JST: 9, SGT: 8, PH: 8
      };
      const sourceOffset = offsets[timezone] ?? 0;
      
      // Calculate UTC timestamp from source input
      const sourceDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
      const utcTime = sourceDate.getTime() - (sourceOffset * 60 * 60 * 1000);

      // Create Date object which automatically uses browser's local timezone
      const localDate = new Date(utcTime);
      
      const lYear = localDate.getFullYear();
      const lMonth = String(localDate.getMonth() + 1).padStart(2, "0");
      const lDay = String(localDate.getDate()).padStart(2, "0");
      const lHours = localDate.getHours();
      const lMins = localDate.getMinutes();
      
      const convertedDate = `${lYear}-${lMonth}-${lDay}`;
      
      const period = lHours >= 12 ? "PM" : "AM";
      const displayHours = lHours % 12 || 12;
      const convertedTime = `${displayHours}:${String(lMins).padStart(2, "0")} ${period}`;
      
      return { date: convertedDate, time: convertedTime };
    } catch (error) {
      console.error("Error converting date/time:", error);
      return { date: dateStr, time: "" };
    }
  };


  // Format date from YYYY-MM-DD to "Month-DD-YYYY"
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr + "T00:00:00"); // Add time to avoid timezone issues
      const month = date.toLocaleString("en-US", { month: "long" });
      const day = date.getDate();
      const year = date.getFullYear();
      return `${month}-${day}-${year}`;
    } catch (error) {
      return dateStr; // Return original if parsing fails
    }
  };

  // Upcoming schedules with converted PH time and date
  const upcomingSchedules = useMemo(() => {
    const now = new Date();
    return wls
      .filter((w) => {
        if (!w.mintDate || w.status === "Minted") return false;
        // Compare actual mint datetime (including time) with current time
        const mintDateTime = getMintDateTime(w.mintDate, w.mintTime, w.mintTimezone);
        // Keep if mint time hasn't passed yet (mintDateTime > now)
        return mintDateTime > now;
      })
      .map((w) => {
        let phDate = w.mintDate;
        let phTime = "";
        
        if (w.mintTime && w.mintDate) {
          const tz = w.mintTimezone || "UTC";
          const converted = convertToLocalDateTime(w.mintDate, w.mintTime, tz);
          phDate = converted.date;
          phTime = converted.time;
        }
        
        return {
          id: w.id,
          project: w.project,
          chain: w.chain,
          phase: w.type,
          mintDate: phDate,
          formattedDate: phDate ? formatDate(phDate) : "",
          phTime,
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.mintDate || "");
        const dateB = new Date(b.mintDate || "");
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 5); // Show top 5 upcoming
  }, [wls]);

  const needsAction = useMemo(() => {
    const normalize = (s: string = "") => s.toLowerCase().replace(/\s+/g, "").trim();
    const now = new Date();
    // Set 72 hours threshold (3 days)
    const threshold = new Date(now.getTime() + 72 * 60 * 60 * 1000); 

    return collabs.filter((c) => {
      const s = normalize(c.status as any);
      // Case 1: Not Posted
      if (s === "notposted") return true;
      // Case 2: Posted but deadline is soon (or passed)
      if (s === "posted" && c.dueAt) {
         const dueDate = new Date(c.dueAt);
         // Check if date is valid and within range
         return !isNaN(dueDate.getTime()) && dueDate <= threshold;
      }
      return false; 
    }).sort((a, b) => {
       const dateA = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
       const dateB = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
       return dateA - dateB;
    });
  }, [collabs]);

  // pagination for Collabs — Action Required
  const [collabPage, setCollabPage] = useState(0);
  const collabPageSize = 6;
  const showCollabPagination = needsAction.length > 7;
  const collabTotalPages = useMemo(() => showCollabPagination ? Math.max(1, Math.ceil(needsAction.length / collabPageSize)) : 1, [needsAction.length, showCollabPagination]);
  useEffect(() => {
    // clamp current page if data size changes
    if (collabPage > collabTotalPages - 1) setCollabPage(collabTotalPages - 1);
  }, [collabPage, collabTotalPages]);
  const collabPageItems = useMemo(() => {
    if (!showCollabPagination) return needsAction; // show all when <= 8
    const start = collabPage * collabPageSize;
    return needsAction.slice(start, start + collabPageSize);
  }, [needsAction, collabPage, showCollabPagination]);



  const [dailyQuote, setDailyQuote] = useState<{ text: string; author?: string } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  
  useEffect(() => {
    let alive = true;
    const fetchQuote = async () => {
      try {
        const res = await fetch('/api/daily-quote', { cache: 'no-store' });
        if (!alive) return;
        if (res.ok) {
          const data = await res.json();
          setDailyQuote(data);
        } else {
          setDailyQuote({ text: "Ship, learn, iterate.", author: "" });
        }
      } catch (error) {
        if (!alive) return;
        console.error("Failed to fetch quote:", error);
        setDailyQuote({ text: "Ship, learn, iterate.", author: "" });
      } finally {
        if (alive) setQuoteLoading(false);
      }
    };
    fetchQuote();
    return () => { alive = false; };
  }, []);

  return (
    <div className="flex flex-col min-h-screen pb-10">
      {/* Top Header - Sticky & Full Width */}
      <div className="h-[88px] border-b border-zinc-900/60 bg-black/40 backdrop-blur-sm sticky top-0 z-30">
        <div className="h-full w-full max-w-[1500px] mx-auto px-4 md:px-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white tracking-tight shrink-0">Dashboard</h1>
          
          {/* Central Search Bar Removed */}

          {/* Right: Actions + Bell + Profile */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/whitelists"
              className="px-4 py-2 rounded-xl text-sm font-medium bg-zinc-100 text-zinc-900 hover:bg-white transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              Add Whitelist
            </Link>
            <Link
              href="/collabs"
              className="px-4 py-2 rounded-xl text-sm font-medium bg-zinc-100 text-zinc-900 hover:bg-white transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              Add Collab
            </Link>

            <button 
              onClick={() => setIsEditProfileOpen(true)}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-zinc-700 hover:border-zinc-500 transition-colors flex items-center justify-center bg-zinc-800"
            >
              {profile?.avatar || profile?.avatar_url ? (
                <Image 
                  src={profile?.avatar || profile?.avatar_url} 
                  alt="Profile" 
                  width={40} 
                  height={40} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserMultiple02Icon size={20} className="text-zinc-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-[1500px] mx-auto px-4 md:px-6 pt-6 space-y-6">
        {/* Greeting Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
               {greeting}, <span className="text-white">{profile?.full_name || profile?.username || "Guest"}</span>
            </h1>
            <div className="text-zinc-500 text-sm">Welcome back to your dashboard.</div>
          </div>
        </div>

        {/* main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* LEFT */}
          <div className="xl:col-span-3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KPICard
              title="Total Collabs"
              value={totals.totalCollabs}
              icon={<UserMultiple02Icon size={24} />}
              tone="indigo"
              className="h-28"
            />
            <KPICard
              title="Total Whitelists"
              value={totals.totalWL}
              icon={<ChartAverageIcon size={24} />}
              tone="violet"
              className="h-28"
            />
          <KPICard
            title="Upcoming mints (7d)"
            value={upcoming7}
            icon={<Calendar03Icon size={24} />}
            tone="emerald"
            className="h-28"
          />
            </div>



          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card 
              title="Collabs — Action Required" 
              className="h-[530px]" 
              badgeCount={needsAction.length}
              icon={<Agreement01Icon size={16} />}
              tone="indigo"
            >
              <div className="flex flex-col h-full">
                <ul className={`space-y-2 flex-1 ${showCollabPagination ? "overflow-y-auto pr-1" : ""}`}>
                  {collabPageItems.map((c) => {
                    const isPosted = c.status === "Posted";
                    let pillText: string = c.status;
                    let pillTone = statusTone(c.status);
                    let dateColor = "text-zinc-500";

                    if (c.status === "Not Posted") {
                      dateColor = "text-blue-400 font-medium";
                    }

                    if (isPosted && c.dueAt) {
                      const due = new Date(c.dueAt);
                      const now = new Date();
                      // Check if overdue (deadline passed)
                      if (due < now) {
                        pillText = "Overdue";
                        pillTone = "rose";
                        dateColor = "text-rose-400 font-bold";
                      } else {
                        pillText = "Winners Due";
                        pillTone = "amber";
                        dateColor = "text-amber-400 font-medium";
                      }
                    }

                    return (
                    <li key={c.id} className="flex items-center justify-between rounded-lg bg-zinc-900/60 border border-zinc-800 px-3 py-2">
                      <div className="flex items-center gap-2">
                         <Pill tone={pillTone as any}>{pillText}</Pill>
                        <span className="text-zinc-200">
                          {c.project}
                          {c.community ? (
                            <span className="text-xs text-zinc-400 ml-2">
                              (
                              {/^https?:\/\//i.test(c.community)
                                ? (() => { try { const u = new URL(c.community); return (u.hostname || "").replace(/^www\./, ""); } catch { return "link"; } })()
                                : c.community}
                              )
                            </span>
                          ) : null}
                        </span>
                      </div>
                      <span className={`text-xs ${dateColor}`}>
                         {c.dueAt || "-"}
                      </span>
                    </li>
                    );
                  })}
                  {!needsAction.length && <div className="text-zinc-500 text-sm mt-4 text-center">All set. No pending actions.</div>}
                </ul>
                <div className="mt-3 h-8 flex items-center justify-between text-xs text-zinc-400">
                  {showCollabPagination && needsAction.length > collabPageSize ? (
                    <>
                      <button
                        onClick={() => setCollabPage((p) => Math.max(0, p - 1))}
                        disabled={collabPage === 0}
                        className={`px-2 py-1 rounded-md border border-zinc-800 ${collabPage === 0 ? "opacity-40 cursor-not-allowed" : "hover:bg-zinc-800/40"}`}
                      >
                        Prev
                      </button>
                      <div>
                        Page {collabPage + 1} / {collabTotalPages}
                      </div>
                      <button
                        onClick={() => setCollabPage((p) => Math.min(collabTotalPages - 1, p + 1))}
                        disabled={collabPage >= collabTotalPages - 1}
                        className={`px-2 py-1 rounded-md border border-zinc-800 ${collabPage >= collabTotalPages - 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-zinc-800/40"}`}
                      >
                        Next
                      </button>
                    </>
                  ) : (
                    <span />
                  )}
                </div>
              </div>
            </Card>

            <Card 
              title="WL Summary" 
              className="h-[530px]"
              icon={<PieChartIcon size={16} />}
              tone="violet"
            >
              <div className="flex h-full flex-col">
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-x-6 inset-y-4 rounded-[32px] bg-gradient-to-b from-indigo-500/10 via-blue-500/5 to-transparent blur-3xl" />
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={70}
                        outerRadius={120}
                        paddingAngle={4}
                        cornerRadius={12}
                        stroke="#030712"
                        strokeWidth={2}
                        onMouseEnter={(_, index) =>
                          setHoveredChain(pieChartData[index]?.name ?? null)
                        }
                        onMouseLeave={() => setHoveredChain(null)}
                      >
                        {pieChartData.map((slice) => (
                          <Cell
                            key={slice.name}
                            fill={CHAIN_COLORS[slice.name]}
                            opacity={
                              hoveredChain && hoveredChain !== slice.name ? 0.45 : 1
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        cursor={{ fill: "transparent" }}
                        content={<ChainTooltip />}
                        wrapperStyle={{ outline: "none", zIndex: 1000 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center z-0">
                    <span className="text-[11px] uppercase tracking-[0.35em] text-zinc-500">
                      WL Total
                    </span>
                    <span className="mt-1 text-3xl font-semibold text-white">
                      {wls.length || 0}
                    </span>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-5 py-3">
                  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-white/80">
                    {CHAIN_ORDER.map((chain) => (
                      <div key={chain} className="flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: CHAIN_COLORS[chain] }}
                        />
                        <span className="font-semibold tracking-wide">{chain}</span>
                      </div>
                    ))}
                  </div>
                  {!pieSlices.length && (
                    <p className="mt-3 text-center text-[11px] text-zinc-500">
                      Add a whitelist entry to start populating the donut.
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card 
              title="Upcoming Mints" 
              className="h-[530px]"
              icon={<AlarmClockIcon size={16} />}
              tone="emerald"
            >
              <ul className="space-y-1.5">
                {upcomingSchedules.length > 0 ? (
                  upcomingSchedules.map((s) => (
                    <li
                      key={s.id}
                      className="rounded-lg bg-zinc-900/60 border border-zinc-800 px-3 py-2 flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-medium truncate" style={{ color: CHAIN_COLORS[s.chain as Chain] || "#e4e4e7" }}>{s.project}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">{s.phase}</div>
                      </div>
                      <div className="text-right ml-2">
                        {s.phTime && (
                          <div className="text-xs text-white font-medium">{s.phTime}</div>
                        )}
                        <div className="text-xs text-zinc-500">{s.formattedDate}</div>
                      </div>
                    </li>
                  ))
                ) : (
                  <div className="text-zinc-500 text-sm py-4 text-center">
                    {loadingWL ? "Loading…" : "No upcoming mints."}
                  </div>
                )}
              </ul>
            </Card>
          </div>

        </div>


        {/* RIGHT */}
        <div className="xl:col-span-1 space-y-6">
          <DailyBibleVerseCard />
          <Card 
            title="Quotes" 
            className="h-33"
            icon={<QuoteDownIcon size={18} />}
            tone="sky"
          >
            <div className="h-full flex flex-col items-center justify-center text-center px-3">
              {quoteLoading ? (
                <div className="text-zinc-400 text-sm">Loading quote…</div>
              ) : dailyQuote ? (
                <>
                  <div className="text-zinc-100 italic text-sm leading-relaxed">
                    "{dailyQuote.text}"
                  </div>
                  {dailyQuote.author ? (
                    <div className="mt-2 text-xs text-zinc-400 font-medium">— {dailyQuote.author}</div>
                  ) : null}
                </>
              ) : (
                <div className="text-zinc-100 italic text-sm leading-relaxed">
                  "Ship, learn, iterate."
                </div>
              )}
            </div>
          </Card>
          <MiniCalendar wls={wls} />
        </div>
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

/* ----------------------- Chart Helpers ----------------------- */

function ChainTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: ChainPieDatum; color?: string }[];
}) {
  if (!active || !payload?.length) return null;
  const datum = payload[0]?.payload as ChainPieDatum | undefined;
  const color = datum ? CHAIN_COLORS[datum.name] : "#a855f7";
  if (!datum) return null;

  const visibleProjects = datum.projects.slice(0, 6);
  const hiddenCount = Math.max(datum.projects.length - visibleProjects.length, 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 shadow-2xl max-w-[18rem]">
      <div className="flex items-center gap-2 font-semibold text-white">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        {datum.name}
      </div>
      <div className="mt-1 text-2xl font-semibold text-white">{datum.value} WL</div>
      <div className="mt-2 max-h-40 space-y-1 overflow-y-auto pr-1 text-xs">
        {visibleProjects.length ? (
          visibleProjects.map((project) => (
            <div
              key={project.label}
              className="flex items-center justify-between gap-3 text-zinc-200"
            >
              <span className="truncate">{project.label}</span>
              <span className="font-semibold text-white">{project.count}</span>
            </div>
          ))
        ) : (
          <div className="text-zinc-400">No whitelists yet.</div>
        )}
        {hiddenCount > 0 && (
          <div className="text-[11px] text-zinc-500">
            +{hiddenCount} more project{hiddenCount > 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------------- UI Helpers ----------------------- */

function Card({
  title,
  children,
  badgeCount,
  icon,
  tone = "indigo",
  className = "",
}: {
  title: string;
  children: ReactNode;
  badgeCount?: number;
  icon?: ReactNode;
  tone?: "violet" | "emerald" | "indigo" | "sky" | "amber" | "rose";
  className?: string;
}) {
  const ICON_STYLES = {
    violet: "bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20 border border-white/10",
    emerald: "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 border border-white/10",
    indigo: "bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 border border-white/10",
    sky: "bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/20 border border-white/10",
    amber: "bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20 border border-white/10",
    rose: "bg-gradient-to-br from-pink-600 to-rose-600 shadow-lg shadow-pink-500/20 border border-white/10",
  }[tone] || "bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-500/20";

  const BADGE_STYLES = {
    violet: "bg-violet-600/20 text-violet-100 border border-violet-500/30 ring-1 ring-violet-500/30",
    emerald: "bg-emerald-600/20 text-emerald-100 border border-emerald-500/30 ring-1 ring-emerald-500/30",
    indigo: "bg-indigo-600/20 text-indigo-100 border border-indigo-500/30 ring-1 ring-indigo-500/30",
    sky: "bg-sky-600/20 text-sky-100 border border-sky-500/30 ring-1 ring-sky-500/30",
    amber: "bg-amber-600/20 text-amber-100 border border-amber-500/30 ring-1 ring-amber-500/30",
    rose: "bg-rose-600/20 text-rose-100 border border-rose-500/30 ring-1 ring-rose-500/30",
  }[tone] || "bg-indigo-600/20 text-indigo-100 border border-indigo-500/30 ring-1 ring-indigo-500/30";

  return (
    <div className={`rounded-2xl bg-gradient-to-b from-zinc-950/60 to-zinc-900/60 border border-zinc-800 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.6)] p-4 flex flex-col overflow-hidden ${className}`}>
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`shrink-0 w-7 h-7 rounded-lg grid place-items-center text-white shadow-lg ${ICON_STYLES}`}>
              <span className="flex items-center justify-center">{icon}</span>
            </div>
          )}
          <h3 className="text-zinc-200 font-semibold text-base">{title}</h3>
        </div>
        {typeof badgeCount === "number" && (
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${BADGE_STYLES}`}>
            {badgeCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-h-0 relative">
        {children}
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  icon,
  className = "",
  tone = "indigo",
}: {
  title: string;
  value: number | string;
  icon?: ReactNode;
  className?: string;
  tone?: "violet" | "emerald" | "indigo" | "sky";
}) {
  const ICON_STYLES = {
    violet: "bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20 border border-white/10",
    emerald: "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 border border-white/10",
    indigo: "bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 border border-white/10",
    sky: "bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/20 border border-white/10",
  }[tone] || "bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-500/20";

  return (
    <div className={`relative rounded-2xl border border-zinc-800 bg-zinc-900/40 ${className}`}>
      <div className="relative h-full rounded-2xl p-4 flex items-center gap-4">
        <div className={`shrink-0 w-12 h-12 rounded-xl grid place-items-center text-white shadow-lg ${ICON_STYLES}`}>
          <span className="text-xl">{icon}</span>
        </div>
        <div>
          <div className="text-xs md:text-sm tracking-wider uppercase text-zinc-500 font-semibold">
            {title}
          </div>
          <div className="text-2xl md:text-3xl font-bold text-zinc-100 mt-0.5">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ children, tone = "slate" }:{ children: ReactNode; tone?: "slate"|"violet"|"emerald"|"amber"|"rose"|"blue" }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-800/40 text-slate-200 border border-slate-700/50",
    violet: "bg-violet-800/40 text-violet-200 border border-violet-700/50",
    emerald: "bg-emerald-800/40 text-emerald-200 border border-emerald-700/50",
    amber: "bg-amber-800/40 text-amber-200 border border-amber-700/50",
    rose: "bg-rose-800/40 text-rose-200 border border-rose-700/50",
    blue: "bg-blue-600/40 text-blue-100 border border-blue-500/50",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${tones[tone]}`}>{children}</span>;
}

function statusTone(s: CollabStatus): "slate" | "violet" | "emerald" | "amber" | "rose" | "blue" {
  switch (s) {
    case "Submitted": return "emerald";
    case "Posted": return "violet";
    case "Not Posted": return "blue";
    case "Cancel": return "rose";
    default: return "slate";
  }
}

/* Profile card */
function ProfileCard({
  profile,
  loading,
  onEdit,
  className = "",
}: {
  profile: any;
  loading: boolean;
  onEdit: () => void;
  className?: string;
}) {
  if (loading) {
     return <div className={`rounded-2xl bg-zinc-900/70 border border-zinc-800 p-5 h-[200px] animate-pulse ${className}`} />;
  }

  const { full_name, x_handle, discord_handle, role, avatar_url, username } = profile || {};
  const displayName = full_name || username || "Guest";
  const displayRole = role || "Member";

  return (
    <div className={`rounded-2xl bg-zinc-900/70 border border-zinc-800 p-4 relative group ${className}`}>
      <button 
        onClick={onEdit}
        className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white transition opacity-0 group-hover:opacity-100"
        title="Edit Profile"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
      </button>

      <div className="flex items-center gap-5">
        <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-white/10 ring-2 ring-white/5 shadow-lg shadow-black/20 shrink-0 bg-zinc-800">
          <Image 
             src={avatar_url || pfp} 
             alt={displayName} 
             fill 
             className="object-cover" 
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-zinc-100 text-2xl md:text-[26px] font-semibold leading-tight tracking-tight truncate">
            {displayName}
          </div>
          <div className="grid gap-1 mt-2">
            {x_handle && (
                <div className="text-sm md:text-[15px] flex items-center gap-1.5 truncate">
                    <span className="font-semibold text-zinc-300">X:</span>
                    <span className="text-zinc-400 truncate">{x_handle}</span>
                </div>
            )}
            {discord_handle && (
                <div className="text-sm md:text-[15px] flex items-center gap-1.5 truncate">
                    <span className="font-semibold text-zinc-300">Discord:</span>
                    <span className="text-zinc-400 truncate">{discord_handle}</span>
                </div>
            )}
            <div className="mt-1 text-sm md:text-[15px] font-semibold text-zinc-200 truncate">
                {displayRole}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Calendar */
function MiniCalendar({ wls, className = "" }: { wls: WL[], className?: string }) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthLabel = new Date(year, month, 1).toLocaleString("en-US", { month: "long", year: "numeric" });

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  // Build a map of dateStr -> array of { project, chain }
  const mintsByDate = useMemo(() => {
    const map: Record<string, { project: string; chain: Chain }[]> = {};
    wls
      .filter((w) => w.mintDate && new Date(w.mintDate).getMonth() === month)
      .forEach((w) => {
        const dateStr = w.mintDate!;
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push({ project: w.project, chain: w.chain });
      });
    return map;
  }, [wls, month]);

  const cells: Array<{ label: number | ""; dateStr?: string; muted?: boolean }> = [];
  const prevMonthDays = new Date(year, month, 0).getDate();

  for (let i = 0; i < startWeekday; i++) {
    const d = prevMonthDays - (startWeekday - 1 - i);
    cells.push({ label: d, muted: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ label: d, dateStr });
  }
  while (cells.length < 42) cells.push({ label: cells.length - (startWeekday + daysInMonth) + 1, muted: true });

  return (
    <Card 
      title="Whitelist Calendar" 
      icon={<Calendar04Icon size={18} />}
      tone="rose"
      className={className}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="text-zinc-400 text-xs font-medium">{monthLabel}</div>
        <div className="text-zinc-500 text-sm cursor-pointer hover:text-zinc-300">⋯</div>
      </div>

      <div className="grid grid-cols-7 text-[11px] text-zinc-500 mb-2">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="text-center font-medium">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          const mints = c.dateStr ? mintsByDate[c.dateStr] : undefined;
          const hasMint = mints && mints.length > 0;
          const isToday =
            c.dateStr &&
            c.dateStr ===
              `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
          
          // Get the primary chain color (first mint's chain)
          const primaryChain = hasMint ? mints[0].chain : null;
          const chainColor = primaryChain ? getChainColor(primaryChain) : null;
          
          return (
            <div
              key={i}
              className={`relative h-7 rounded-md grid place-items-center text-[11px] font-medium transition-all cursor-default
                ${c.muted ? "text-zinc-700" : "text-zinc-300"}
                ${isToday ? "text-white bg-zinc-800 ring-1 ring-white/20 shadow-lg shadow-black/50 z-10 scale-105" : ""}
                ${!isToday && !hasMint && !c.muted ? "hover:bg-zinc-800/50" : ""}
              `}
              style={
                !isToday && hasMint && chainColor
                  ? { 
                      backgroundColor: `${chainColor}30`, 
                      borderWidth: 1, 
                      borderColor: `${chainColor}50`,
                      color: chainColor 
                    }
                  : undefined
              }
              onMouseEnter={() => hasMint && c.dateStr && setHoveredDate(c.dateStr)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              {c.label}
              {/* Tooltip */}
              {hoveredDate === c.dateStr && hasMint && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                  <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl min-w-[120px] max-w-[200px]">
                    <div className="text-[10px] text-zinc-500 mb-1 font-medium">Scheduled Mints</div>
                    <div className="space-y-1">
                      {mints.map((m, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <span 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ backgroundColor: getChainColor(m.chain) }}
                          />
                          <span className="text-zinc-200 truncate">{m.project}</span>
                          <span className="text-zinc-500 text-[10px]">{m.chain.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-zinc-700" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function DailyBibleVerseCard() {
  const [verse, setVerse] = useState<{ text: string, reference: string } | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('https://beta.ourmanna.com/api/v1/get/?format=json&order=daily')
      .then(res => res.json())
      .then(data => {
        setVerse({
          text: data.verse.details.text,
          reference: data.verse.details.reference
        });
        setLoading(false);
      });
  }, []);
  return (
    <Card 
      title="Daily Bible Verse" 
      icon={<Book01Icon size={18} />} 
      tone="amber"
    >
      <div className="flex flex-col justify-center h-full">
        {loading ? (
          <div className="text-zinc-400 text-sm">Loading…</div>
        ) : verse ? (
          <>
            <div className="text-zinc-100 italic text-sm mb-2 leading-relaxed">“{verse.text}”</div>
            <div className="text-zinc-400 text-xs text-right font-medium">{verse.reference}</div>
          </>
        ) : (
          <div className="text-zinc-400 text-sm">No verse for today.</div>
        )}
      </div>
    </Card>
  );
}
