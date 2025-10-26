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
  Legend,
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
};

type CollabStatus = "Not Posted" | "Posted" | "Submitted" | "Cancel";

type Collab = {
  id: number;
  project: string;
  status: CollabStatus;
  giveawayLink?: string;
  dueAt?: string;
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
  "SOL",
  "BTC",
  "APE",
  "BASE",
  "ABS",
  "Monad",
  "HYPER",
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
    // map our symbols to Coingecko ids
    const idMap: Record<Coin["symbol"], string> = {
      BTC: "bitcoin",
      ETH: "ethereum",
      SOL: "solana",
    };

    let alive = true;
    async function fetchCoins() {
      try {
        // current prices + 24h change
        const priceUrl =
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true";
        const priceRes = await fetch(priceUrl);
        if (!priceRes.ok) throw new Error(`Price fetch failed: ${priceRes.status}`);
        const priceData = await priceRes.json();

        // historical for charts (1 day, hourly to keep points manageable)
        const histPromises = (["bitcoin", "ethereum", "solana"] as string[]).map((id) =>
          fetch(
            `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=1&interval=hourly`
          )
        );
        const histRes = await Promise.all(histPromises);
        const histJson = await Promise.all(histRes.map((r) => r.json()));

        if (!alive) return;

        const updated: Coin[] = [
          {
            symbol: "BTC",
            name: "Bitcoin",
            price: Number(priceData.bitcoin?.usd ?? initialCoins[0].price),
            changePct: Number(priceData.bitcoin?.usd_24h_change ?? initialCoins[0].changePct),
            series:
              Array.isArray(histJson[0]?.prices) && histJson[0].prices.length
                ? histJson[0].prices.map((p: any) => Number(p[1]))
                : initialCoins[0].series,
          },
          {
            symbol: "ETH",
            name: "Ethereum",
            price: Number(priceData.ethereum?.usd ?? initialCoins[1].price),
            changePct: Number(priceData.ethereum?.usd_24h_change ?? initialCoins[1].changePct),
            series:
              Array.isArray(histJson[1]?.prices) && histJson[1].prices.length
                ? histJson[1].prices.map((p: any) => Number(p[1]))
                : initialCoins[1].series,
          },
          {
            symbol: "SOL",
            name: "Solana",
            price: Number(priceData.solana?.usd ?? initialCoins[2].price),
            changePct: Number(priceData.solana?.usd_24h_change ?? initialCoins[2].changePct),
            series:
              Array.isArray(histJson[2]?.prices) && histJson[2].prices.length
                ? histJson[2].prices.map((p: any) => Number(p[1]))
                : initialCoins[2].series,
          },
        ];

        setCoins(updated);
        setLoadingCoins(false);
      } catch (e) {
        console.error("Failed to fetch coin data", e);
        setLoadingCoins(false);
      }
    }

    fetchCoins();
    const interval = setInterval(fetchCoins, 60_000); // refresh each minute
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  const collabs = seedCollabs;

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

  const pie = useMemo(() => {
    const counts = CHAIN_ORDER.reduce<Record<Chain, number>>((acc, c) => {
      acc[c] = 0;
      return acc;
    }, {} as Record<Chain, number>);
    for (const w of wls) counts[w.chain] = (counts[w.chain] || 0) + 1;
    return CHAIN_ORDER.map((name) => ({ name, value: counts[name] }));
  }, [wls]);

  const recent = useMemo(
    () =>
      wls
        .map((w) => ({
          when: w.createdAt || "",
          text: `Added whitelist for ${w.project}`,
        }))
        .filter((e) => e.when)
        .sort((a, b) => (a.when > b.when ? -1 : 1))
        .slice(0, 3),
    [wls]
  );

  const needsAction = useMemo(() => {
    const now = new Date();
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return collabs
      .filter((c) => {
        const dueSoon = c.dueAt ? new Date(c.dueAt) <= soon : false;
        const missingLink = !c.giveawayLink;
        return (dueSoon || missingLink) && c.status !== "Cancel";
      })
      .slice(0, 3);
  }, [collabs]);

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

  const quote = useMemo(() => {
    const quotes = [
      "Small consistent reps beat random big pushes.",
      "Focus on what compounds.",
      "Ship, learn, iterate.",
      "Protect guaranteed wins first.",
      "Today’s inputs create tomorrow’s outcomes.",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }, []);

  return (
    <div className="max-w-[1500px] mx-auto px-4 space-y-5 pb-10">
      {/* top bar */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            WEB3 Manager{" "}
            <span className="text-zinc-500 text-sm">@0xSkyisthelimit</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 w-full xl:w-auto">
          <div className="relative flex-1 xl:w-[420px]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search whitelists…"
              className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-3 py-2 pr-10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60">
              
            </span>
          </div>
          <Link
            href="/whitelists"
            className="px-3 py-2 rounded-xl text-sm font-medium bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white hover:from-violet-400 hover:to-fuchsia-400"
          >
            + Add Whitelist
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

          <Card title="Summary WL" className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" outerRadius={116}>
                  {pie.map((d, i) => (
                    <Cell key={i} fill={CHAIN_COLORS[d.name as Chain]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Recent Activity" className="h-[360px]">
            <ul className="space-y-2">
              {recent.map((e, i) => (
                <li
                  key={i}
                  className="rounded-lg bg-zinc-900/60 border border-zinc-800 px-3 py-2 flex items-center justify-between"
                >
                  <span>{e.text}</span>
                  <span className="text-xs text-zinc-500">{e.when}</span>
                </li>
              ))}
              {!recent.length && (
                <div className="text-zinc-500">
                  {loadingWL ? "Loading…" : "No recent activity."}
                </div>
              )}
            </ul>
          </Card>

          <Card title="Collabs — Action Required" className="h-[360px]" badgeCount={needsAction.length}>
            <ul className="space-y-2">
              {needsAction.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-lg bg-zinc-900/60 border border-zinc-800 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Pill tone={statusTone(c.status)}>{c.status}</Pill>
                    <span className="text-zinc-200">{c.project}</span>
                  </div>
                  <span className="text-xs text-zinc-500">{c.dueAt || "-"}</span>
                </li>
              ))}
              {!needsAction.length && <div className="text-zinc-500">All set.</div>}
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
            x="0xSkyisthelimit"
            discord="Skyisthelimitt"
            role="Founder & Collab Manager"
          />
          <MiniCalendar wls={filteredWL} />
          <Card title="Motivational" className="h-24">
            <div className="h-full grid place-items-center text-sm text-zinc-200 text-center px-2">
              “{quote}”
            </div>
          </Card>
        </div>
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
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-800/40 text-rose-200 border border-rose-700/50">
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
        <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-xl">
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
          <div className="text-zinc-200 font-semibold text-sm">Onboarding calendar</div>
        </div>
        <div className="text-zinc-500 text-sm">⋯</div>
      </div>

      <div className="grid grid-cols-7 text-[10px] text-zinc-400 mb-1">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
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
                ${isToday ? "ring-1 ring-zinc-500" : ""}
                ${isMint ? "bg-violet-500/20 border border-violet-500/30" : "bg-zinc-900/60 border border-zinc-800"}
              `}
            >
              {c.label}
            </div>
          );
        })}
      </div>

      <div className="mt-2 text-xs text-zinc-400">Upcoming schedule</div>
      <ul className="mt-1 space-y-1">
        {upcoming.map((w) => (
          <li key={w.id} className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800 rounded-md px-2 py-1">
            <span className="text-zinc-200 text-sm">{w.project}</span>
            <span className="text-[11px] text-zinc-500">{w.mintDate}</span>
          </li>
        ))}
        {!upcoming.length && <div className="text-zinc-500 text-xs">No upcoming mints.</div>}
      </ul>
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
