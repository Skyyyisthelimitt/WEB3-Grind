"use client";

import { useState, useEffect, useMemo } from "react";
import { Star, Search, ChevronDown, Bell, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, LineChart, Line } from "recharts";
import Link from "next/link";
import Image from "next/image";

/* ----------------------- Types ----------------------- */
type CryptoCoin = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  circulatingSupply: number;
  change24h: number;
  sparkline: number[];
  icon?: string;
};

/* ----------------------- Initial Data ----------------------- */
const INITIAL_CRYPTOS: CryptoCoin[] = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", price: 97500, marketCap: 1920000000000, circulatingSupply: 19700000, change24h: 2.15, sparkline: [95000, 96000, 95500, 97000, 96500, 97500] },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", price: 3650, marketCap: 439000000000, circulatingSupply: 120200000, change24h: 1.32, sparkline: [3500, 3550, 3600, 3580, 3620, 3650] },
  { id: "solana", symbol: "SOL", name: "Solana", price: 225, marketCap: 107000000000, circulatingSupply: 475000000, change24h: -0.84, sparkline: [230, 228, 225, 227, 224, 225] },
  { id: "bnb", symbol: "BNB", name: "BNB", price: 715, marketCap: 103000000000, circulatingSupply: 144000000, change24h: 0.45, sparkline: [710, 712, 715, 713, 716, 715] },
  { id: "xrp", symbol: "XRP", name: "XRP", price: 2.35, marketCap: 135000000000, circulatingSupply: 57400000000, change24h: -1.23, sparkline: [2.40, 2.38, 2.35, 2.37, 2.34, 2.35] },
  { id: "cardano", symbol: "ADA", name: "Cardano", price: 1.05, marketCap: 37000000000, circulatingSupply: 35200000000, change24h: 3.21, sparkline: [1.00, 1.02, 1.03, 1.04, 1.06, 1.05] },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", price: 0.42, marketCap: 62000000000, circulatingSupply: 147000000000, change24h: 5.67, sparkline: [0.38, 0.40, 0.41, 0.40, 0.43, 0.42] },
  { id: "avalanche", symbol: "AVAX", name: "Avalanche", price: 48.50, marketCap: 20000000000, circulatingSupply: 412000000, change24h: -2.15, sparkline: [50, 49, 48, 49, 47, 48.5] },
  { id: "polkadot", symbol: "DOT", name: "Polkadot", price: 8.75, marketCap: 13500000000, circulatingSupply: 1540000000, change24h: 1.89, sparkline: [8.50, 8.60, 8.70, 8.65, 8.80, 8.75] },
  { id: "chainlink", symbol: "LINK", name: "Chainlink", price: 25.80, marketCap: 16200000000, circulatingSupply: 628000000, change24h: 4.32, sparkline: [24, 24.5, 25, 25.2, 25.6, 25.8] },
];

/* ----------------------- Component ----------------------- */
export default function CryptoPricesPage() {
  const [cryptos, setCryptos] = useState<CryptoCoin[]>(INITIAL_CRYPTOS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(["bitcoin", "ethereum", "solana"]);
  const [activeTab, setActiveTab] = useState<"watchlist" | "portfolio">("watchlist");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch crypto data
  useEffect(() => {
    let alive = true;
    const fetchCryptos = async () => {
      try {
        const res = await fetch("/api/crypto-list");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (alive && data.cryptos) {
          setCryptos(data.cryptos);
        }
      } catch (e) {
        console.error("Failed to fetch crypto data:", e);
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchCryptos();
    const interval = setInterval(fetchCryptos, 60000);
    return () => { alive = false; clearInterval(interval); };
  }, []);

  // Toggle favorite
  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      if (prev.includes(id)) {
        return prev.filter(f => f !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  // Filtered cryptos
  const filteredCryptos = useMemo(() => {
    if (!searchQuery.trim()) return cryptos;
    const q = searchQuery.toLowerCase();
    return cryptos.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.symbol.toLowerCase().includes(q)
    );
  }, [cryptos, searchQuery]);

  // Favorite cryptos for cards
  const favoriteCryptos = useMemo(() => 
    favorites.map(id => cryptos.find(c => c.id === id)).filter(Boolean) as CryptoCoin[],
    [favorites, cryptos]
  );

  // Pagination
  const totalPages = Math.ceil(filteredCryptos.length / itemsPerPage);
  const paginatedCryptos = filteredCryptos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const formatSupply = (num: number, symbol: string) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B ${symbol}`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M ${symbol}`;
    return `${num.toLocaleString()} ${symbol}`;
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Prices</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-sm">
            <span className="text-lg">🇺🇸</span>
            <span>USD</span>
            <ChevronDown size={16} className="text-zinc-400" />
          </button>
          <Link
            href="/crypto/portfolio"
            className="px-4 py-2 rounded-xl text-sm font-medium bg-zinc-100 text-zinc-900 hover:bg-white transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <Wallet size={18} />
            Portfolio
          </Link>
          <button className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50">
            <Bell size={20} className="text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Favorite Cards Section */}
      <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100/20 flex items-center justify-center">
              <Star size={20} className="text-zinc-100" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Follow your favorite coins</h2>
              <p className="text-zinc-500 text-sm">Tap the ☆ at the right of any coin</p>
            </div>
          </div>
          <Link 
            href="/crypto/market"
            className="px-4 py-2 rounded-xl text-sm font-medium bg-zinc-100 text-zinc-900 hover:bg-white transition-all hover:scale-105 active:scale-95"
          >
            View the market
          </Link>
        </div>

        {/* Favorite Crypto Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {favoriteCryptos.map(coin => (
            <FavoriteCryptoCard 
              key={coin.id} 
              coin={coin} 
              onUnfavorite={() => toggleFavorite(coin.id)} 
            />
          ))}
          {favoriteCryptos.length === 0 && (
            <div className="col-span-3 text-center py-8 text-zinc-500">
              No favorites yet. Click the star icon to add coins.
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search crypto"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
        </div>
        <button 
          onClick={() => setActiveTab("watchlist")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
            activeTab === "watchlist" 
              ? "border-zinc-300 text-zinc-900 bg-zinc-100" 
              : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
          }`}
        >
          <Star size={16} />
          Watchlist
        </button>
        <Link
          href="/crypto/portfolio"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
            activeTab === "portfolio" 
              ? "border-zinc-300 text-zinc-900 bg-zinc-100" 
              : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
          }`}
        >
          <TrendingUp size={16} />
          Portfolio
        </Link>
      </div>

      {/* Crypto Table */}
      <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/60 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800/60">
              <th className="text-left px-5 py-4 font-medium text-zinc-400 text-sm">Name</th>
              <th className="text-right px-5 py-4 font-medium text-zinc-400 text-sm">Price</th>
              <th className="text-right px-5 py-4 font-medium text-zinc-400 text-sm hidden md:table-cell">Market Cap</th>
              <th className="text-right px-5 py-4 font-medium text-zinc-400 text-sm hidden lg:table-cell">Circulating Supply</th>
              <th className="text-right px-5 py-4 font-medium text-zinc-400 text-sm">Change %</th>
              <th className="text-center px-5 py-4 font-medium text-zinc-400 text-sm hidden sm:table-cell">Last 24H</th>
              <th className="text-center px-3 py-4 font-medium text-zinc-400 text-sm w-12"></th>
            </tr>
          </thead>
          <tbody>
            {paginatedCryptos.map((coin) => (
              <tr key={coin.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold">
                      {coin.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-white font-medium">{coin.name}</div>
                      <div className="text-zinc-500 text-sm">{coin.symbol}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-right text-white font-medium">
                  ${coin.price.toLocaleString(undefined, { maximumFractionDigits: coin.price < 1 ? 4 : 2 })}
                </td>
                <td className="px-5 py-4 text-right text-zinc-300 hidden md:table-cell">
                  {formatNumber(coin.marketCap)}
                </td>
                <td className="px-5 py-4 text-right text-zinc-300 hidden lg:table-cell">
                  {formatSupply(coin.circulatingSupply, coin.symbol)}
                </td>
                <td className="px-5 py-4 text-right">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
                    coin.change24h >= 0 
                      ? "text-emerald-400 bg-emerald-400/10" 
                      : "text-rose-400 bg-rose-400/10"
                  }`}>
                    {coin.change24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%
                  </span>
                </td>
                <td className="px-3 py-4 hidden sm:table-cell">
                  <div className="w-20 h-8 mx-auto">
                    <MiniSparkline data={coin.sparkline} positive={coin.change24h >= 0} />
                  </div>
                </td>
                <td className="px-3 py-4 text-center">
                  <button 
                    onClick={() => toggleFavorite(coin.id)}
                    className="p-1.5 rounded-lg hover:bg-zinc-700/50 transition-colors"
                  >
                    <Star 
                      size={18} 
                      className={favorites.includes(coin.id) ? "text-zinc-100 fill-zinc-100" : "text-zinc-500"} 
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-800/60">
          <div className="text-sm text-zinc-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCryptos.length)} of {filteredCryptos.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page 
                    ? "bg-zinc-100 text-zinc-900" 
                    : "text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------- Favorite Card Component ----------------------- */
function FavoriteCryptoCard({ coin, onUnfavorite }: { coin: CryptoCoin; onUnfavorite: () => void }) {
  const positive = coin.change24h >= 0;
  const chartColor = positive ? "#22c55e" : "#ef4444";
  const data = coin.sparkline.map((v, i) => ({ x: i, y: v }));

  return (
    <div className="relative rounded-xl bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-700/50 p-4 overflow-hidden">
      {/* Background gradient */}
      <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${positive ? "from-emerald-500/20" : "from-rose-500/20"} to-transparent`} />
      
      {/* Header */}
      <div className="relative flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-xs text-zinc-500 uppercase tracking-wider">{coin.symbol}USDT</div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onUnfavorite}
            className="p-1 rounded hover:bg-zinc-700/50 transition-colors"
          >
            <Star size={14} className="text-zinc-100 fill-zinc-100" />
          </button>
          <button className="text-zinc-500 hover:text-zinc-300">⋮</button>
        </div>
      </div>

      {/* Coin Info */}
      <div className="relative">
        <div className="text-lg font-bold text-white mb-1">{coin.name}</div>
        <div className="text-2xl font-bold text-white">
          ${coin.price.toLocaleString(undefined, { maximumFractionDigits: coin.price < 1 ? 4 : 2 })}
        </div>
        <div className={`text-sm font-medium mt-1 ${positive ? "text-emerald-400" : "text-rose-400"}`}>
          {positive ? "+" : ""}{coin.change24h.toFixed(2)}%
        </div>
      </div>

      {/* Chart */}
      <div className="absolute right-0 bottom-0 w-32 h-16 opacity-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`fav-grad-${coin.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.4} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="y"
              stroke={chartColor}
              strokeWidth={2}
              fill={`url(#fav-grad-${coin.id})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ----------------------- Mini Sparkline Component ----------------------- */
function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const chartData = data.map((v, i) => ({ x: i, y: v }));
  const color = positive ? "#22c55e" : "#ef4444";
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ left: 0, right: 0, top: 2, bottom: 2 }}>
        <Line
          type="monotone"
          dataKey="y"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
