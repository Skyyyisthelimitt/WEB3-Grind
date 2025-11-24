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

// Local images (PNGs)
import pfp from "./images/khun.jpg";
import btcIcon from "./images/btc.png";
import ethIcon from "./images/eth.png";
import solIcon from "./images/sol.png";

/* ----------------------- Types ----------------------- */
type Chain =
  | "ETH"
  | "SOL"
  | "BTC"
  | "APE"
  | "BASE"
  | "ABS"
  | "Monad"
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

type Coin = {
  symbol: "BTC" | "ETH" | "SOL";
  name: string;
  price: number;
  changePct: number;
  series: number[];
};

/* --- Chain color map --- */
const CHAIN_COLORS: Record<Chain, string> = {
  ETH: "#9ca3af",
  SOL: "#8b5cf6",
  BTC: "#f59e0b",
  APE: "#1e3a8a",
  BASE: "#38bdf8",
  ABS: "#86efac",
  Monad: "#c084fc",
  HYPER: "#14532d",
};

const CHAIN_ORDER: Chain[] = [
  "ETH",
  "BTC",
  "SOL",
  "Monad",
  "BASE",
  "HYPER",
  "ABS",
  "APE",
];

/* --- Demo seed collabs --- */
const seedCollabs: Collab[] = [
  { id: 1, project: "Melio", status: "Not Posted", dueAt: "2025-08-28" },
  { id: 2, project: "Mempoolio", status: "Posted", dueAt: "2025-08-30" },
];

/* --- Initial coin seed (visible while first fetch resolves) --- */
const initialCoins: Coin[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: 67250,
    changePct: 2.15,
    series: [62, 64, 61, 63, 66, 65, 67, 66, 68, 69, 67, 68],
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    price: 3450,
    changePct: 1.32,
    series: [32, 33, 31, 32, 33, 34, 33, 35, 36, 35, 36, 37],
  },
  {
    symbol: "SOL",
    name: "Solana",
    price: 158.2,
    changePct: -0.84,
    series: [14, 15, 15, 16, 15, 16, 17, 16, 16, 15, 16, 15],
  },
];

/* --------------------------- Page --------------------------- */
export default function DashboardPage() {
  const [q, setQ] = useState("");

  // whitelists
  const [wls, setWls] = useState<WL[]>([]);
  const [loadingWL, setLoadingWL] = useState(true);

  // live coins
  const [coins, setCoins] = useState<Coin[]>(initialCoins);
  const [loadingCoins, setLoadingCoins] = useState(true);
const [hoveredChain, setHoveredChain] = useState<Chain | null>(null);

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

  /* ------------------ coin fetching (CoinGecko) ------------------ */
  useEffect(() => {
    let alive = true;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 10_000; // 10 seconds
    async function fetchCoinsWithRetry() {
      try {
        const priceRes = await fetch('/api/crypto-prices');
        if (!priceRes.ok) throw new Error(`Price fetch failed: ${priceRes.status}`);
        const priceObj = await priceRes.json();
        const data = priceObj.data || {};
        // Map: { BTC: { quote: { USD: { price, percent_change_24h } } }, ... }
        const nowPrice = (symbol: 'BTC'|'ETH'|'SOL') => Number(data[symbol]?.quote?.USD?.price ?? initialCoins.find(c => c.symbol === symbol)?.price);
        const change24h = (symbol: 'BTC'|'ETH'|'SOL') => Number(data[symbol]?.quote?.USD?.percent_change_24h ?? initialCoins.find(c => c.symbol === symbol)?.changePct);
        const updated: Coin[] = [
          {
            symbol: "BTC" as const,
            name: "Bitcoin",
            price: nowPrice('BTC'),
            changePct: change24h('BTC'),
            series: initialCoins[0].series,
          },
          {
            symbol: "ETH" as const,
            name: "Ethereum",
            price: nowPrice('ETH'),
            changePct: change24h('ETH'),
            series: initialCoins[1].series,
          },
          {
            symbol: "SOL" as const,
            name: "Solana",
            price: nowPrice('SOL'),
            changePct: change24h('SOL'),
            series: initialCoins[2].series,
          },
        ];
        setCoins(updated);
        setLoadingCoins(false);
        retryCount = 0;
      } catch (e) {
        console.error("Failed to fetch coin data", e);
        setLoadingCoins(false);
        if (alive && retryCount < maxRetries) {
          retryCount++;
          setTimeout(fetchCoinsWithRetry, retryDelay);
        } else if (!alive) {
          return;
        }
      }
    }
    fetchCoinsWithRetry();
    const interval = setInterval(fetchCoinsWithRetry, 60_000); // refresh each minute
    return () => {
      alive = false;
      clearInterval(interval);
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

  const upcoming7 = useMemo(() => {
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return wls.filter(
      (w) =>
        w.mintDate &&
        new Date(w.mintDate) >= now &&
        new Date(w.mintDate) <= in7 &&
        w.status !== "Minted"
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
      const bucket = buckets[wl.chain];
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
  // Returns { date: string, time: string } with proper date adjustment
  const convertToPHDateTime = (date: string, time: string, timezone: string): { date: string; time: string } => {
    if (!date || !time || !timezone) return { date: date || "", time: "" };
    
    // Timezone offsets in hours from UTC
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
    
    const sourceOffset = timezoneOffsets[timezone] ?? 0;
    const phOffset = 8; // PH is UTC+8
    
    try {
      // Parse the date (YYYY-MM-DD format)
      const [year, month, day] = date.split("-").map(Number);
      if (isNaN(year) || isNaN(month) || isNaN(day)) return { date, time: "" };
      
      // Parse time (HH:MM format)
      const [hours, minutes] = time.split(":").map(Number);
      if (isNaN(hours) || isNaN(minutes)) return { date, time: "" };
      
      // Create a date string in ISO format, treating the input as if it's in the source timezone
      // We'll create a UTC date by subtracting the source offset
      const sourceDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
      // Convert source time to UTC by subtracting the source offset
      const utcTime = sourceDate.getTime() - (sourceOffset * 60 * 60 * 1000);
      // Convert UTC to PH time by adding PH offset
      const phTime = utcTime + (phOffset * 60 * 60 * 1000);
      const phDate = new Date(phTime);
      
      // Extract PH date and time
      const phYear = phDate.getUTCFullYear();
      const phMonth = String(phDate.getUTCMonth() + 1).padStart(2, "0");
      const phDay = String(phDate.getUTCDate()).padStart(2, "0");
      const phHours = phDate.getUTCHours();
      const phMins = phDate.getUTCMinutes();
      
      const convertedDate = `${phYear}-${phMonth}-${phDay}`;
      
      // Format as 12-hour time with AM/PM
      const period = phHours >= 12 ? "PM" : "AM";
      const displayHours = phHours % 12 || 12;
      const convertedTime = `${displayHours}:${String(phMins).padStart(2, "0")} ${period}`;
      
      return { date: convertedDate, time: convertedTime };
    } catch (error) {
      console.error("Error converting date/time:", error);
      return { date, time: "" };
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
        const mintDate = new Date(w.mintDate);
        return mintDate >= now;
      })
      .map((w) => {
        let phDate = w.mintDate;
        let phTime = "";
        
        if (w.mintTime && w.mintTimezone && w.mintDate) {
          const converted = convertToPHDateTime(w.mintDate, w.mintTime, w.mintTimezone);
          phDate = converted.date;
          phTime = converted.time;
        }
        
        return {
          id: w.id,
          project: w.project,
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
    return collabs.filter((c) => normalize(c.status as any) === "notposted");
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

  const filteredWL = useMemo(() => {
    if (!q.trim()) return wls;
    const s = q.toLowerCase();
    return wls.filter((w) =>
      [w.project ?? "", w.category ?? "", w.wallets ?? "", w.notes ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [wls, q]);

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
    <div className="max-w-[1500px] mx-auto px-4 space-y-5 pb-10">
      {/* top bar */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        {/* Left: Title */}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            WEB3 Manager{" "}
            <span className="text-zinc-500 text-sm">@0xSkyisthelimit</span>
          </h1>
        </div>
        {/* Right: Search + Actions */}
        <div className="flex items-center gap-2 w-full xl:flex-1 justify-end">
          <div className="relative flex-1">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search whitelists or collabs…"
              className="w-full rounded-xl bg-zinc-900/70 border border-blue-500/20 ring-1 ring-blue-500/30 shadow shadow-blue-500/20 px-3 py-2 pr-10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60"></span>
          </div>
          <Link
            href="/whitelists"
            className="px-3 py-2 rounded-xl text-sm font-medium bg-blue-600/10 text-white border border-blue-500/20 ring-1 ring-blue-500/30 shadow shadow-blue-500/20 hover:bg-blue-600/20 hover:text-white transition-transform active:scale-95 whitespace-nowrap shrink-0"
          >
            + Add Whitelist
          </Link>
          <Link
            href="/collabs"
            className="px-3 py-2 rounded-xl text-sm font-medium bg-blue-600/10 text-white border border-blue-500/20 ring-1 ring-blue-500/30 shadow shadow-blue-500/20 hover:bg-blue-600/20 hover:text-white transition-transform active:scale-95 whitespace-nowrap shrink-0"
          >
            + Add Collab
          </Link>
        </div>
      </div>

      {/* main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* LEFT */}
        <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-5">
          <KPICard
            title="Total Whitelists"
            value={totals.totalWL}
            icon="📈"
            tone="violet"
            className="h-28"
          />
          <KPICard
            title="Total Collabs"
            value={totals.totalCollabs}
            icon="🤝"
            tone="indigo"
            className="h-28"
          />
          <KPICard
            title="Upcoming (7d)"
            value={upcoming7}
            icon="🗓️"
            tone="emerald"
            className="h-28"
          />

          <Card title="WL Summary" className="h-[420px]">
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
                      wrapperStyle={{ outline: "none" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] uppercase tracking-[0.35em] text-zinc-500">
                    WL Total
                  </span>
                  <span className="mt-1 text-3xl font-semibold text-white">
                    {wls.length || 0}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3">
                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-zinc-400">
                  {CHAIN_ORDER.map((chain) => (
                    <div key={chain} className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: CHAIN_COLORS[chain] }}
                      />
                      <span className="font-medium text-white">{chain}</span>
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

          <Card title="Collabs — Action Required" className="h-[420px]" badgeCount={needsAction.length}>
            <div className="flex flex-col h-full">
              <ul className={`space-y-2 flex-1 ${showCollabPagination ? "overflow-y-auto pr-1" : ""}`}>
                {collabPageItems.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded-lg bg-zinc-900/60 border border-zinc-800 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Pill tone={statusTone(c.status)}>{c.status}</Pill>
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
                    <span className="text-xs text-zinc-500">{c.dueAt || "-"}</span>
                  </li>
                ))}
                {!needsAction.length && <div className="text-zinc-500">All set.</div>}
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

          <Card title="Upcoming Mints" className="h-[420px]">
            <ul className="space-y-1.5">
              {upcomingSchedules.length > 0 ? (
                upcomingSchedules.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-lg bg-zinc-900/60 border border-zinc-800 px-3 py-2 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-zinc-200 font-medium truncate">{s.project}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{s.phase}</div>
                    </div>
                    <div className="text-right ml-2">
                      {s.phTime && (
                        <div className="text-xs text-blue-400 font-medium">{s.phTime}</div>
                      )}
                      <div className="text-xs text-zinc-500">{s.formattedDate}</div>
                    </div>
                  </li>
                ))
              ) : (
                <div className="text-zinc-500 text-xs py-2">
                  {loadingWL ? "Loading…" : "No upcoming mints."}
                </div>
              )}
            </ul>
          </Card>

          {/* Crypto cards (dynamic) */}
          {coins.length > 0 ? (
            <>
              <div className="md:row-start-3"><CryptoCard coin={coins[0]} /></div>
              <div className="md:row-start-3"><CryptoCard coin={coins[1]} /></div>
              <div className="md:row-start-3"><CryptoCard coin={coins[2]} /></div>
            </>
          ) : (
            <div className="col-span-3 text-center text-zinc-500">Loading prices…</div>
          )}
        </div>

        {/* RIGHT */}
        <div className="xl:col-span-1 space-y-5">
          <ProfileCard
            imageSrc={pfp}
            name="Skyyy"
            x="0xSkyisthelimitt"
            discord="Skyisthelimitt"
            role="Founder & Collab Manager"
          />
          <DailyBibleVerseCard />
          <Card title="Motivational" className="h-28">
            <div className="h-full flex flex-col items-center justify-center text-center px-3">
              {quoteLoading ? (
                <div className="text-zinc-400 text-sm">Loading quote…</div>
              ) : dailyQuote ? (
                <>
                  <div className="text-zinc-100 italic text-[15px] leading-snug">
                    "{dailyQuote.text}"
                  </div>
                  {dailyQuote.author ? (
                    <div className="mt-1 text-xs text-zinc-400">— {dailyQuote.author}</div>
                  ) : null}
                </>
              ) : (
                <div className="text-zinc-100 italic text-[15px] leading-snug">
                  "Ship, learn, iterate."
                </div>
              )}
            </div>
          </Card>
          <MiniCalendar wls={filteredWL} />
        </div>
      </div>
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
  const color = payload[0]?.color ?? "#a855f7";
  if (!datum) return null;

  const visibleProjects = datum.projects.slice(0, 6);
  const hiddenCount = Math.max(datum.projects.length - visibleProjects.length, 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/90 px-4 py-3 text-sm text-zinc-200 shadow-2xl backdrop-blur max-w-[18rem]">
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
  className = "",
}: {
  title: string;
  children: ReactNode;
  badgeCount?: number;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-gradient-to-b from-zinc-950/60 to-zinc-900/60 border border-zinc-800 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.6)] p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-zinc-200 font-semibold text-sm">{title}</h3>
        {typeof badgeCount === "number" && (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-600/20 text-white border border-blue-500/30 ring-1 ring-blue-500/30">
            {badgeCount}
          </span>
        )}
      </div>
      <div className="h-[calc(100%-32px)]">{children}</div>
    </div>
  );
}

function KPICard({
  title,
  value,
  icon,
  tone = "violet",
  className = "",
}: {
  title: string;
  value: number | string;
  icon?: ReactNode;
  tone?: "violet" | "emerald" | "indigo" | "sky";
  className?: string;
}) {
  const TONES = {
    violet: { border: "from-violet-500/40 via-fuchsia-500/20 to-transparent", icon: "from-violet-500 to-fuchsia-500", dot: "bg-violet-400" },
    emerald: { border: "from-emerald-500/40 via-teal-500/20 to-transparent", icon: "from-emerald-500 to-teal-500", dot: "bg-emerald-400" },
    indigo: { border: "from-indigo-500/40 via-purple-500/20 to-transparent", icon: "from-indigo-500 to-purple-500", dot: "bg-indigo-400" },
    sky:     { border: "from-sky-500/40 via-cyan-500/20 to-transparent", icon: "from-sky-500 to-cyan-500", dot: "bg-sky-400" },
  }[tone];

  return (
    <div className={`relative rounded-2xl p-[1px] bg-gradient-to-br ${TONES.border} ${className}`}>
      <div className="relative h-full rounded-2xl bg-zinc-900/70 border border-white/5 p-4 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.6)]">
        <div className="pointer-events-none absolute inset-0 rounded-2xl [mask-image:linear-gradient(to_bottom,white,transparent)] bg-gradient-to-b from-white/10 to-transparent" />
        <div className="relative flex items-center gap-3 h-full">
          <div className={`shrink-0 w-11 h-11 rounded-xl grid place-items-center text-white/90 ring-1 ring-black/20 shadow-lg bg-gradient-to-br ${TONES.icon}`}>
            <span className="text-lg">{icon}</span>
          </div>
          <div className="flex-1">
            <div className="text-[11px] md:text-xs tracking-widest leading-none uppercase text-zinc-400">
              {title}
            </div>
            <div className="text-2xl md:text-3xl font-semibold mt-1 leading-tight">
              {value}
            </div>
          </div>
          <span className={`hidden sm:block w-2 h-2 rounded-full ${TONES.dot}`} />
        </div>
      </div>
    </div>
  );
}

function Pill({ children, tone = "slate" }:{ children: ReactNode; tone?: "slate"|"violet"|"emerald"|"amber"|"rose" }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-800/40 text-slate-200 border border-slate-700/50",
    violet: "bg-violet-800/40 text-violet-200 border border-violet-700/50",
    emerald: "bg-emerald-800/40 text-emerald-200 border border-emerald-700/50",
    amber: "bg-amber-800/40 text-amber-200 border border-amber-700/50",
    rose: "bg-rose-800/40 text-rose-200 border border-rose-700/50",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${tones[tone]}`}>{children}</span>;
}

function statusTone(s: CollabStatus): "slate" | "violet" | "emerald" | "amber" | "rose" {
  switch (s) {
    case "Submitted": return "emerald";
    case "Posted": return "violet";
    case "Not Posted": return "amber";
    case "Cancel": return "rose";
    default: return "slate";
  }
}

/* Profile card */
function ProfileCard({
  imageSrc = pfp,
  name = "Skyyy",
  x = "0xSkyisthelimit",
  discord = "Skyisthelimitt",
  role = "Founder & Collab Manager",
  className = "",
}: {
  imageSrc?: string | StaticImageData;
  name?: string;
  x?: string;
  discord?: string;
  role?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-zinc-900/70 border border-zinc-800 p-5 ${className}`}>
      <div className="flex items-center gap-5">
        <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-blue-500/50 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/30">
          <Image src={imageSrc} alt={name} fill className="object-cover" />
        </div>
        <div className="min-w-0">
          <div className="text-zinc-100 text-2xl md:text-[26px] font-semibold leading-tight tracking-tight">
            {name}
          </div>
          <div className="mt-1 text-sm md:text-[15px]">
            <span className="font-semibold text-zinc-300">X:</span>{" "}
            <span className="text-zinc-400">{x}</span>
          </div>
          <div className="text-sm md:text-[15px]">
            <span className="font-semibold text-zinc-300">Discord:</span>{" "}
            <span className="text-zinc-400">{discord}</span>
          </div>
          <div className="mt-1 text-sm md:text-[15px] font-semibold text-zinc-200">
            {role}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Calendar */
function MiniCalendar({ wls }: { wls: WL[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthLabel = new Date(year, month, 1).toLocaleString("en-US", { month: "long", year: "numeric" });

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const mintDays = new Set(
    wls
      .filter((w) => w.mintDate && new Date(w.mintDate).getMonth() === month)
      .map((w) => w.mintDate!)
  );

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

  const upcoming = [...wls]
    .filter((w) => w.mintDate && new Date(w.mintDate) >= new Date())
    .sort((a, b) => (a.mintDate! > b.mintDate! ? 1 : -1))
    .slice(0, 3);

  return (
    <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-zinc-200 font-semibold text-sm">Whitelist Calendar</div>
          <div className="text-zinc-400 text-xs leading-none mt-0.5">{monthLabel}</div>
        </div>
        <div className="text-zinc-500 text-sm">⋯</div>
      </div>

      <div className="grid grid-cols-7 text-[10px] text-zinc-400 mb-1">
        {["Sun","Mon","Tue","Wed","Thu","Fri","S                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          at"].map((d) => (
          <div key={d} className="text-center py-0.5">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          const isMint = c.dateStr ? mintDays.has(c.dateStr) : false;
          const isToday =
            c.dateStr &&
            c.dateStr ===
              `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
          return (
            <div                                                                                                                                                                                                                                                                                                                                                                                
              key={i}
              className={`h-7 rounded-md grid place-items-center text-[11px]
                ${c.muted ? "text-zinc-600" : "text-zinc-200"}
                ${isToday ? "text-blue-500" : ""}
                ${isToday
                  ? "bg-blue-600/10 ring-1 ring-blue-500/30 border border-blue-500/20"
                  : (isMint ? "bg-violet-500/20 border border-violet-500/30" : "bg-zinc-900/60 border border-zinc-800")}
              `}
            >
              {c.label}
            </div>
          );
        })}
      </div>

    </div>
  );
}

/* --- Crypto card --- */
function CryptoCard({ coin }: { coin: Coin }) {
  const up = coin.changePct >= 0;
  const color = up ? "#22c55e" : "#ef4444";
  const data = coin.series.map((v, i) => ({ x: i, y: v }));

  const ICONS: Record<Coin["symbol"], StaticImageData> = {
    BTC: btcIcon,
    ETH: ethIcon,
    SOL: solIcon,
  };

  const style = {
    BTC: {
      chipBg: "bg-amber-500/25",
      ring: "ring-amber-400/30",
      corner: "from-amber-500/15 via-transparent to-transparent",
      accent: "#f59e0b",
    },
    ETH: {
      chipBg: "bg-emerald-500/25",
      ring: "ring-emerald-400/30",
      corner: "from-emerald-500/15 via-transparent to-transparent",
      accent: "#10b981",
    },
    SOL: {
      chipBg: "bg-fuchsia-500/25",
      ring: "ring-fuchsia-400/30",
      corner: "from-fuchsia-500/15 via-transparent to-transparent",
      accent: "#a78bfa",
    },
  }[coin.symbol];

  return (
    <div className="rounded-2xl p-[1px] bg-gradient-to-br from-white/10 to-white/0">
      <div className="h-48 rounded-2xl bg-zinc-900/80 border border-white/5 p-4 relative overflow-hidden shadow-[0_20px_60px_-25px_rgba(0,0,0,0.55)]">
        <div className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${style.corner}`} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl grid place-items-center overflow-hidden ring-1 ${style.ring} ${style.chipBg}`}>
              <Image src={ICONS[coin.symbol]} alt={`${coin.symbol} icon`} width={24} height={24} className="w-6 h-6 object-contain" priority />
            </div>
            <div className="text-[15px] font-semibold">
              {coin.name} ({coin.symbol})
            </div>
          </div>
          <div className="text-zinc-500">⋯</div>
        </div>

        <div className="mt-3">
          <div className="text-[22px] font-bold leading-tight">
            {coin.price.toLocaleString(undefined, {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: coin.price < 1 ? 4 : 2,
            })}
          </div>
          <div className="mt-1 text-sm">
            <span className={`${up ? "text-emerald-300" : "text-rose-300"} font-semibold`}>
              {up ? "+" : ""}{coin.changePct.toFixed(2)}%
            </span>{" "}
            <span className="text-zinc-400">This week</span>
          </div>
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-80 pointer-events-none">
          <svg width="64" height="24" viewBox="0 0 72 28" fill="none">
            <path d="M2 14c6-14 12 14 18 0s12 14 18 0 12 14 18 0 12 14 16 0" stroke={style.accent} strokeWidth="3" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        <div className="absolute left-0 right-0 bottom-0 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 6, right: 12, top: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${coin.symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="y" stroke={color} strokeWidth={1.6} fillOpacity={1} fill={`url(#grad-${coin.symbol})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
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
    <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 px-5 py-4 mb-4">
      <div className="font-bold text-zinc-200 mb-1 text-[15px]">Daily Bible Verse</div>
      {loading ? (
        <div className="text-zinc-400 text-sm">Loading…</div>
      ) : verse ? (
        <>
          <div className="text-zinc-100 italic text-[14px] mb-1 leading-snug">“{verse.text}”</div>
          <div className="text-zinc-400 text-[11px] text-right">{verse.reference}</div>
        </>
      ) : (
        <div className="text-zinc-400 text-sm">No verse for today.</div>
      )}
    </div>
  );
}
