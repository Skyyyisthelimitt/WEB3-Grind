"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Star, Search, ChevronDown, Bell, Wallet, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, LineChart, Line } from "recharts";
import Link from "next/link";
import Image from "next/image";

/* ----------------------- Types ----------------------- */
type CoinGeckoCoin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  sparkline_in_7d: { price: number[] };
};

type Currency = "usd" | "eur" | "gbp" | "php" | "jpy" | "krw" | "aud";

const CURRENCIES: Record<Currency, { label: string; symbol: string; countryCode: string }> = {
  usd: { label: "USD", symbol: "$", countryCode: "US" },
  eur: { label: "EUR", symbol: "€", countryCode: "EU" },
  gbp: { label: "GBP", symbol: "£", countryCode: "GB" },
  php: { label: "PHP", symbol: "₱", countryCode: "PH" },
  jpy: { label: "JPY", symbol: "¥", countryCode: "JP" },
  krw: { label: "KRW", symbol: "₩", countryCode: "KR" },
  aud: { label: "AUD", symbol: "A$", countryCode: "AU" },
};

/* ----------------------- Component ----------------------- */
export default function CryptoPricesPage() {
  const [cryptos, setCryptos] = useState<CoinGeckoCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState<Currency>("usd");
  const [page, setPage] = useState(1);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof CoinGeckoCoin | ""; direction: "asc" | "desc" }>({ key: "", direction: "asc" });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCurrencyOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch crypto data from CoinGecko
  useEffect(() => {
    let alive = true;
    setError(""); // Clear previous errors
    if (page === 1) setLoading(true);
    else setLoading(true); 

    const fetchCryptos = async () => {
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=10&page=${page}&sparkline=true`
        );
        if (res.status === 429) throw new Error("Rate limit exceeded. Please wait a moment.");
        if (!res.ok) throw new Error("Failed to fetch data");
        
        const data = await res.json();
        if (alive) {
          setCryptos(data);
        }
      } catch (e: any) {
        console.error("Failed to fetch crypto data:", e);
        if (alive) setError(e.message || "Failed to load prices");
      } finally {
        if (alive) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };
    
    // Debounce to 300ms
    const timer = setTimeout(fetchCryptos, page === 1 && retryTrigger === 0 ? 0 : 300);
    return () => { alive = false; clearTimeout(timer); };
  }, [currency, page, retryTrigger]);

  // Reset pagination when currency changes
  useEffect(() => {
      setPage(1);
      setCryptos([]);
  }, [currency]);

  // Handle Sort
  const handleSort = (key: keyof CoinGeckoCoin) => {
    let direction: "asc" | "desc" = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  // Logic for favorites
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem("crypto-favorites");
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem("crypto-favorites", JSON.stringify(next));
      return next;
    });
  };
   const favoriteCryptos = useMemo(() => 
    favorites.map(id => cryptos.find(c => c.id === id)).filter(Boolean) as CoinGeckoCoin[],
    [favorites, cryptos]
  );

  // Filtered & Sorted cryptos
  const processedCryptos = useMemo(() => {
    let result = [...cryptos];
    // Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.symbol.toLowerCase().includes(q)
      );
    }
    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key as keyof CoinGeckoCoin];
        const bVal = b[sortConfig.key as keyof CoinGeckoCoin];
        
        // Handle undefined
        if (aVal === undefined) return 1;
        if (bVal === undefined) return -1;

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [cryptos, searchQuery, sortConfig]);

  const formatCurrency = (num: number) => {
    const sym = CURRENCIES[currency].symbol;
    if (num >= 1e12) return `${sym}${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${sym}${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${sym}${(num / 1e6).toFixed(2)}M`;
    return `${sym}${num.toLocaleString(undefined, { maximumFractionDigits: num < 1 ? 4 : 2 })}`;
  };
  
  const formatRawPrice = (num: number) => {
     const sym = CURRENCIES[currency].symbol;
     return `${sym}${num.toLocaleString(undefined, { maximumFractionDigits: num < 1 ? 5 : 2 })}`;
  }

  return (
    <div className="flex flex-col min-h-screen pb-10">
      {/* Header - Sticky & Full Width */}
      <div className="h-[88px] border-b border-zinc-900/60 bg-black/40 backdrop-blur-sm sticky top-0 z-30">
        <div className="h-full w-full max-w-[1500px] mx-auto px-4 md:px-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white tracking-tight shrink-0">Crypto Market</h1>
          
          {/* Central Search Bar */}
          <div className="flex-1 max-w-md mx-6 relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search coins..." 
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700/80 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Currency Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                className="flex items-center gap-2 pl-3 pr-2 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all text-sm group"
              >
                <span className="text-zinc-500 font-medium text-xs tracking-wide">{CURRENCIES[currency].countryCode}</span>
                <span className="font-semibold text-zinc-100">{CURRENCIES[currency].label}</span>
                <ChevronDown size={14} className={`text-zinc-500 group-hover:text-zinc-400 transition-transform duration-200 ${isCurrencyOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isCurrencyOpen && (
                <div className="absolute top-full right-0 mt-2 w-32 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden py-1 z-50">
                  {(Object.keys(CURRENCIES) as Currency[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setCurrency(c);
                        setIsCurrencyOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-zinc-800/50 transition-colors ${currency === c ? "bg-zinc-800/80 text-white border-l-2 border-white pl-3.5" : "text-zinc-400"}`}
                    >
                      <span className="text-xs font-medium opacity-70 w-5">{CURRENCIES[c].countryCode}</span>
                      <span className="font-medium">{CURRENCIES[c].label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50">
              <Bell size={20} className="text-zinc-400" />
            </button>

            <Link
              href="/crypto/portfolio"
              className="px-4 py-2 rounded-xl text-sm font-medium bg-zinc-100 text-zinc-900 hover:bg-white transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Wallet size={18} />
              Portfolio
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-[1500px] mx-auto px-4 md:px-6 pt-6 space-y-6">

      {/* Favorite Cards Section */}
      <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100/20 flex items-center justify-center">
              <Star size={20} className="text-zinc-100" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Follow your favorite coins</h2>
            </div>
          </div>
        </div>

        {/* Favorite Crypto Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {favoriteCryptos.map(coin => (
             <FavoriteCryptoCard 
                key={coin.id} 
                coin={coin} 
                currency={currency}
                onUnfavorite={() => toggleFavorite(coin.id)} 
              />
          ))}
          {favoriteCryptos.length === 0 && (
            <div className="col-span-full text-center py-12 text-zinc-500 flex flex-col items-center justify-center gap-2 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
               <Star className="w-8 h-8 text-zinc-700 mb-1" />
               <p>No favorites yet. Star coins to see them here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Crypto Table */}
      <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/60 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800/60 text-zinc-400 text-xs uppercase tracking-wider">
              <th className="px-4 py-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("market_cap_rank")}>#</th>
              <th className="px-5 py-4 text-left cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("name")}>Coin</th>
              <th className="px-5 py-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("current_price")}>Price</th>
              <th className="px-5 py-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("price_change_percentage_24h")}>24h</th>
              <th className="px-5 py-4 text-center hidden sm:table-cell">Last 7 Days</th>
              <th className="px-5 py-4 text-right hidden md:table-cell cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("market_cap")}>Mkt Cap</th>
              <th className="px-5 py-4 text-right hidden lg:table-cell cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("total_volume")}>Volume</th>
              <th className="px-5 py-4 text-center">Trade</th>
              <th className="px-5 py-4 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr className="border-b border-zinc-800/30">
                <td colSpan={9} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <p className="text-rose-400">{error}</p>
                    <button 
                      onClick={() => setRetryTrigger(prev => prev + 1)}
                      className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors border border-zinc-700"
                    >
                      Try Again
                    </button>
                  </div>
                </td>
              </tr>
            ) : loading && page === 1 ? (
               Array.from({ length: 5 }).map((_, i) => (
                 <tr key={i} className="border-b border-zinc-800/30">
                   <td colSpan={9} className="px-5 py-6">
                     <div className="h-4 bg-zinc-800/50 rounded animate-pulse w-full"></div>
                   </td>
                 </tr>
               ))
            ) : (
             processedCryptos.map((coin) => (
              <tr key={coin.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                <td className="px-4 py-4 text-center text-zinc-500 font-medium">
                  {coin.market_cap_rank}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                      <Image 
                         src={coin.image} 
                         alt={coin.name} 
                         fill 
                         className="object-cover" 
                      />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm leading-none flex items-center gap-2">
                        {coin.name}
                        {favoriteCryptos.some(f => f.id === coin.id) && <Star size={12} className="fill-emerald-500 text-emerald-500" />}
                      </div>
                      <div className="text-zinc-500 text-xs font-medium uppercase mt-0.5">{coin.symbol}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <span className="text-white font-medium text-sm">{formatCurrency(coin.current_price)}</span>
                </td>
                <td className={`px-5 py-4 text-right text-sm font-medium ${coin.price_change_percentage_24h >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                   {coin.price_change_percentage_24h > 0 ? "+" : ""}{coin.price_change_percentage_24h.toFixed(2)}%
                </td>
                <td className="px-5 py-4 hidden sm:table-cell">
                   <div className="h-[40px] w-[140px] mx-auto">
                     <MiniSparkline data={coin.sparkline_in_7d.price} positive={coin.price_change_percentage_24h >= 0} />
                   </div>
                </td>
                <td className="px-5 py-4 text-right hidden md:table-cell">
                   <span className="text-zinc-400 text-sm">{formatCurrency(coin.market_cap)}</span>
                </td>
                <td className="px-5 py-4 text-right hidden lg:table-cell">
                   <span className="text-zinc-400 text-sm">{formatCurrency(coin.total_volume)}</span>
                </td>
                <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                        {/* CoinGecko */}
                        <a href={`https://www.coingecko.com/en/coins/${coin.id}`} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" title="View on CoinGecko">
                           <img 
                             src="/coingecko.png"
                             width={24} height={24} alt="CG" className="rounded-full bg-white object-cover" 
                           />
                        </a>
                         {/* Binance (Local) */}
                        <a href={`https://www.binance.com/en/trade/${coin.symbol.toUpperCase()}_USDT`} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" title="Trade on Binance">
                             <img 
                               src="/binance.png" 
                               width={24} height={24} alt="Binance" className="rounded-full object-cover" 
                             />
                        </a>
                         {/* Bybit */}
                        <a href={`https://www.bybit.com/en-US/trade/spot/${coin.symbol.toUpperCase()}/USDT`} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" title="Trade on Bybit">
                              <img 
                               src="/bybit.png" 
                               width={24} height={24} alt="Bybit" className="rounded-full object-cover" 
                             />
                        </a>
                          {/* Coinbase */}
                         <a href={`https://www.coinbase.com/price/${coin.id}`} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" title="Trade on Coinbase">
                              <img 
                               src="/coinbase.png" 
                               width={24} height={24} alt="Coinbase" className="rounded-full object-cover" 
                             />
                        </a>
                    </div>
                </td>
                <td className="px-5 py-4 text-center">
                    <button onClick={() => toggleFavorite(coin.id)} className="hover:scale-110 transition-transform">
                        <Star size={18} className={`${favoriteCryptos.some(f => f.id === coin.id) ? "fill-amber-400 text-amber-400" : "text-zinc-600 hover:text-zinc-400"}`} />
                    </button>
                </td>
              </tr>
             ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center mt-6">
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setPage(p => Math.max(1, p - 1))}
             disabled={page === 1 || loading}
             className="inline-flex items-center justify-center gap-1 pl-2.5 pr-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>
            <div className="flex items-center gap-1">
                 <button className="h-9 w-9 flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700 transition-colors">
                    {page}
                 </button>
            </div>
             <button 
               onClick={() => setPage(p => p + 1)}
               disabled={loadingMore || loading}
               className="inline-flex items-center justify-center gap-1 pl-4 pr-2.5 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
        </div>
      </div>
    </div>
    </div>
  );
}

/* ----------------------- Favorite Card Component ----------------------- */
function FavoriteCryptoCard({ coin, currency, onUnfavorite }: { coin: CoinGeckoCoin; currency: Currency; onUnfavorite: () => void }) {
  const positive = coin.price_change_percentage_24h >= 0;
  // Colors based on trend: Green (emerald-500) or Red (rose-500)
  const color = positive ? "#10b981" : "#f43f5e"; 
  const data = (coin.sparkline_in_7d?.price || []).map((v, i) => ({ x: i, y: v }));
  
  const formatRawPrice = (num: number) => {
     const sym = CURRENCIES[currency].symbol;
     return `${sym}${num.toLocaleString(undefined, { maximumFractionDigits: num < 1 ? 5 : 2 })}`;
  };

  return (
    <div className="relative flex flex-col justify-between h-[220px] rounded-3xl bg-[#0f0f11] border border-zinc-800 p-6 overflow-hidden group hover:border-zinc-600 transition-all shadow-xl shadow-black/20 text-left">
      
      {/* Header */}
      <div className="flex items-start justify-between z-10 w-full">
        <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800/50 p-1">
                <Image src={coin.image} width={40} height={40} alt="icon" className="rounded-full object-cover w-full h-full" />
            </div>
            <div className="text-left">
                 <div className="text-white font-bold text-sm leading-none mb-1 flex items-center gap-1">
                    {coin.name}
                    <span className="text-zinc-500 font-medium">({coin.symbol.toUpperCase()})</span>
                 </div>
                 <div className="text-zinc-500 text-xs font-medium">Live Chart</div>
            </div>
        </div>
        <button 
           onClick={onUnfavorite}
           className="w-8 h-8 rounded-full bg-zinc-800/50 flex items-center justify-center group/btn hover:bg-zinc-700 transition-colors"
           title="Unfavorite"
        >
            <Star size={16} className="fill-amber-400 text-amber-400 group-hover/btn:opacity-80 transition-opacity" />
        </button>
      </div>

      {/* Main Value */}
      <div className="z-10 mt-auto mb-4 flex flex-col items-start">
        <div className="text-zinc-500 text-xs font-medium mb-1">Current Price</div>
        <div className="text-3xl font-bold text-white tracking-tight mb-1">
          {formatRawPrice(coin.current_price)}
        </div>
        <div className={`text-sm font-bold flex items-center justify-start gap-1.5 ${positive ? "text-emerald-400" : "text-rose-400"}`}>
             {positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
             <span>{Math.abs(coin.price_change_percentage_24h).toFixed(2)}%</span>
        </div>
      </div>

      {/* Chart Background */}
      <div className="absolute inset-x-0 bottom-0 h-[100px] opacity-20 pointer-events-none mix-blend-screen">
         <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`fav-grad-${coin.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={1} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="y"
              stroke={color}
              strokeWidth={3}
              fill={`url(#fav-grad-${coin.id})`}
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
  const color = positive ? "#10b981" : "#ef4444"; // emerald-500 : red-500
  const gradientId = `spark-grad-${positive ? "pos" : "neg"}`;
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 2, bottom: 2 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="90%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="y"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
