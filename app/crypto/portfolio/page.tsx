"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  ExternalLink,
  Copy,
  LogOut,
  ChevronDown,
  Filter,
  RefreshCw
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import Link from "next/link";

/* ----------------------- Types ----------------------- */
type WalletType = "metamask" | "rabby" | "phantom" | "magiceden" | null;

type Holding = {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  price: number;
  value: number;
  change24h: number;
  profitLoss: number;
  profitLossPct: number;
  chain: string;
  category: string;
};

type PortfolioData = {
  totalValue: number;
  change24h: number;
  change24hPct: number;
  totalProfitLoss: number;
  holdings: Holding[];
  chartData: { date: string; value: number }[];
};

/* ----------------------- Initial Demo Data ----------------------- */
const DEMO_PORTFOLIO: PortfolioData = {
  totalValue: 12450.75,
  change24h: 342.50,
  change24hPct: 2.83,
  totalProfitLoss: 1250.00,
  holdings: [
    { id: "ethereum", symbol: "ETH", name: "Ethereum", amount: 2.5, price: 3650, value: 9125, change24h: 1.32, profitLoss: 875, profitLossPct: 10.6, chain: "ETH", category: "L1s" },
    { id: "solana", symbol: "SOL", name: "Solana", amount: 10, price: 225, value: 2250, change24h: -0.84, profitLoss: 250, profitLossPct: 12.5, chain: "SOL", category: "L1s" },
    { id: "arbitrum", symbol: "ARB", name: "Arbitrum", amount: 500, price: 1.85, value: 925, change24h: 3.21, profitLoss: 125, profitLossPct: 15.6, chain: "ETH", category: "L2s" },
    { id: "optimism", symbol: "OP", name: "Optimism", amount: 75, price: 2.00, value: 150, change24h: -1.50, profitLoss: -25, profitLossPct: -14.3, chain: "ETH", category: "L2s" },
  ],
  chartData: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: 10000 + Math.random() * 3000 + i * 50
  }))
};

/* ----------------------- Wallet Icons ----------------------- */
const WALLET_OPTIONS = [
  { id: "metamask" as WalletType, name: "MetaMask", icon: "🦊", color: "bg-orange-500/20" },
  { id: "rabby" as WalletType, name: "Rabby", icon: "🐰", color: "bg-blue-500/20" },
  { id: "phantom" as WalletType, name: "Phantom", icon: "👻", color: "bg-purple-500/20" },
  { id: "magiceden" as WalletType, name: "Magic Eden", icon: "✨", color: "bg-pink-500/20" },
];

/* ----------------------- Component ----------------------- */
export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioData>(DEMO_PORTFOLIO);
  const [loading, setLoading] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<WalletType>(null);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [timeframe, setTimeframe] = useState<"24H" | "7D" | "1M" | "3M" | "1Y" | "ALL">("1M");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // Simulate connecting to wallet
  const connectWallet = async (walletType: WalletType) => {
    setLoading(true);
    setShowWalletModal(false);
    
    // Simulate wallet connection
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockAddress = "0x" + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    
    setConnectedWallet(walletType);
    setWalletAddress(mockAddress);
    setLoading(false);
  };

  const disconnectWallet = () => {
    setConnectedWallet(null);
    setWalletAddress("");
    setShowWalletDropdown(false);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    // Could add toast notification here
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Filter holdings by category
  const filteredHoldings = useMemo(() => {
    if (categoryFilter === "All") return portfolio.holdings;
    return portfolio.holdings.filter(h => h.category === categoryFilter);
  }, [portfolio.holdings, categoryFilter]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(portfolio.holdings.map(h => h.category));
    return ["All", ...Array.from(cats)];
  }, [portfolio.holdings]);

  // Best and worst performers
  const bestPerformer = useMemo(() => 
    [...portfolio.holdings].sort((a, b) => b.change24h - a.change24h)[0],
    [portfolio.holdings]
  );
  const worstPerformer = useMemo(() => 
    [...portfolio.holdings].sort((a, b) => a.change24h - b.change24h)[0],
    [portfolio.holdings]
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-tight">Portfolio</h1>
        <div className="flex items-center gap-3">
          {/* Wallet Button */}
          {connectedWallet ? (
            <div className="relative">
              <button 
                onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium text-sm"
              >
                <Wallet size={18} />
                {formatAddress(walletAddress)}
                <ChevronDown size={16} />
              </button>
              
              {showWalletDropdown && (
                <div className="absolute right-0 top-12 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  <button 
                    onClick={() => window.open(`https://etherscan.io/address/${walletAddress}`, "_blank")}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    <ExternalLink size={16} />
                    View on Explorer
                  </button>
                  <button 
                    onClick={copyAddress}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors border-t border-zinc-800"
                  >
                    <Copy size={16} />
                    Copy Address
                  </button>
                  <button 
                    onClick={disconnectWallet}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-rose-400 hover:bg-zinc-800 transition-colors border-t border-zinc-800"
                  >
                    <LogOut size={16} />
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => setShowWalletModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-zinc-100 text-zinc-900 hover:bg-white transition-all hover:scale-105 active:scale-95"
            >
              <Wallet size={18} />
              Connect Wallet
            </button>
          )}
          
          <button className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50 hover:bg-zinc-700/60 transition-colors">
            <RefreshCw size={20} className={`text-zinc-400 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Value */}
        <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/60 p-5 md:col-span-2">
          <div className="text-zinc-400 text-sm mb-1">Net Worth</div>
          <div className="text-3xl font-bold text-white">
            ${portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`flex items-center gap-1 text-sm font-medium ${
              portfolio.change24hPct >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}>
              {portfolio.change24hPct >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {portfolio.change24hPct >= 0 ? "+" : ""}{portfolio.change24hPct.toFixed(2)}%
            </span>
            <span className="text-zinc-500 text-sm">
              ({portfolio.change24h >= 0 ? "+" : ""}${portfolio.change24h.toFixed(2)}) 24h
            </span>
          </div>
        </div>

        {/* Best Performer */}
        {bestPerformer && (
          <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/60 p-5">
            <div className="text-zinc-400 text-sm mb-1">Best Performer</div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                {bestPerformer.symbol.slice(0, 2)}
              </div>
              <div>
                <div className="text-white font-medium">{bestPerformer.symbol}</div>
                <div className="text-emerald-400 text-sm">+{bestPerformer.change24h.toFixed(2)}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Worst Performer */}
        {worstPerformer && (
          <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/60 p-5">
            <div className="text-zinc-400 text-sm mb-1">Worst Performer</div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-xs font-bold text-rose-400">
                {worstPerformer.symbol.slice(0, 2)}
              </div>
              <div>
                <div className="text-white font-medium">{worstPerformer.symbol}</div>
                <div className="text-rose-400 text-sm">{worstPerformer.change24h.toFixed(2)}%</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Portfolio Chart */}
      <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Portfolio Value</h2>
          <div className="flex items-center gap-1 bg-zinc-800/60 rounded-lg p-1">
            {(["24H", "7D", "1M", "3M", "1Y", "ALL"] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  timeframe === tf 
                    ? "bg-zinc-100 text-zinc-900" 
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={portfolio.chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#71717a', fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#71717a', fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                domain={['dataMin - 500', 'dataMax + 500']}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#portfolioGradient)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60">
          <h2 className="text-white font-semibold">My Holdings</h2>
          <div className="flex items-center gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  categoryFilter === cat 
                    ? "bg-zinc-100 text-zinc-900 border border-zinc-300" 
                    : "text-zinc-400 hover:text-white border border-zinc-700/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800/60">
              <th className="text-left px-5 py-3 font-medium text-zinc-400 text-sm">Name</th>
              <th className="text-right px-5 py-3 font-medium text-zinc-400 text-sm">Chain</th>
              <th className="text-right px-5 py-3 font-medium text-zinc-400 text-sm">Amount</th>
              <th className="text-right px-5 py-3 font-medium text-zinc-400 text-sm">Price</th>
              <th className="text-right px-5 py-3 font-medium text-zinc-400 text-sm">Value</th>
              <th className="text-right px-5 py-3 font-medium text-zinc-400 text-sm">Portfolio %</th>
            </tr>
          </thead>
          <tbody>
            {filteredHoldings.map((holding) => {
              const portfolioPct = (holding.value / portfolio.totalValue) * 100;
              return (
                <tr key={holding.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold">
                        {holding.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-white font-medium">{holding.name}</div>
                        <div className="text-zinc-500 text-sm">{holding.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-xs">
                      {holding.chain}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-zinc-300">
                    {holding.amount.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-right text-white font-medium">
                    ${holding.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4 text-right text-white font-medium">
                    ${holding.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-zinc-300">{portfolioPct.toFixed(2)}%</span>
                      <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: `${portfolioPct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredHoldings.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            No holdings found in this category.
          </div>
        )}
      </div>

      {/* Wallet Connection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowWalletModal(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-2">Connect Wallet</h2>
            <p className="text-zinc-400 text-sm mb-6">Choose your wallet to connect and view your portfolio</p>
            
            <div className="space-y-3">
              {WALLET_OPTIONS.map(wallet => (
                <button
                  key={wallet.id}
                  onClick={() => connectWallet(wallet.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/50 hover:border-zinc-500 hover:bg-zinc-800 transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl ${wallet.color} flex items-center justify-center text-2xl`}>
                    {wallet.icon}
                  </div>
                  <div className="text-left">
                    <div className="text-white font-medium">{wallet.name}</div>
                    <div className="text-zinc-500 text-sm">
                      {wallet.id === "phantom" || wallet.id === "magiceden" ? "Solana" : "EVM"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setShowWalletModal(false)}
              className="w-full mt-4 py-3 text-zinc-400 hover:text-white transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
