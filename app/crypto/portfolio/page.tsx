"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ExternalLink,
  Copy,
  RefreshCw,
  Search,
  Check,
  LogOut,
  ChevronDown,
  Link2,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// RainbowKit/Wagmi imports
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect } from "wagmi";

// Solana wallet imports
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

/* ----------------------- Types ----------------------- */
type Currency = "USD" | "EUR" | "PHP";

type TokenHolding = {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  price: number;
  value: number;
  change24h: number;
  chain: string;
  chainColor: string;
  logo?: string;
  contractAddress?: string;
};

type ChainBalance = {
  chain: string;
  chainName: string;
  color: string;
  native: { symbol: string; name: string; balance: string };
  tokens: {
    contractAddress: string;
    tokenBalance: string;
    symbol?: string;
    name?: string;
    decimals?: number;
    logo?: string;
  }[];
};

/* ----------------------- Currency Config ----------------------- */
const CURRENCY_CONFIG: Record<Currency, { symbol: string; locale: string }> = {
  USD: { symbol: "$", locale: "en-US" },
  EUR: { symbol: "€", locale: "de-DE" },
  PHP: { symbol: "₱", locale: "en-PH" },
};

/* ----------------------- Chain Colors ----------------------- */
const CHAIN_COLORS: Record<string, string> = {
  ethereum: "#627EEA",
  base: "#0052FF",
  arbitrum: "#28A0F0",
  solana: "#9945FF",
};

/* ----------------------- Demo Data for Initial State ----------------------- */
const DEMO_HOLDINGS: TokenHolding[] = [
  { id: "eth-1", symbol: "ETH", name: "Ethereum", balance: 2.5, price: 3650, value: 9125, change24h: 1.32, chain: "ethereum", chainColor: "#627EEA" },
  { id: "sol-1", symbol: "SOL", name: "Solana", balance: 15, price: 225, value: 3375, change24h: -0.84, chain: "solana", chainColor: "#9945FF" },
  { id: "arb-1", symbol: "ARB", name: "Arbitrum", balance: 500, price: 1.85, value: 925, change24h: 3.21, chain: "arbitrum", chainColor: "#28A0F0" },
  { id: "usdc-1", symbol: "USDC", name: "USD Coin", balance: 1500, price: 1.00, value: 1500, change24h: 0.01, chain: "base", chainColor: "#0052FF" },
];

/* ----------------------- Wallet Button Component ----------------------- */
function WalletButton({
  type,
  address,
  isConnected,
  onDisconnect,
  onCopy,
  copied,
}: {
  type: "evm" | "solana";
  address?: string;
  isConnected: boolean;
  onDisconnect: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { setVisible } = useWalletModal();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const config = type === "evm" 
    ? { 
        icon: "🦊", 
        label: "EVM", 
        // Solid gradient for better readability
        gradient: "linear-gradient(135deg, #c2410c 0%, #ea580c 50%, #f97316 100%)",
        gradientHover: "linear-gradient(135deg, #9a3412 0%, #c2410c 50%, #ea580c 100%)",
        shadowColor: "#ea580c40",
        glowColor: "#ea580c",
        explorerUrl: `https://etherscan.io/address/${address}` 
      }
    : { 
        icon: "👻", 
        label: "Solana", 
        // Solid gradient for better readability
        gradient: "linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #8b5cf6 100%)",
        gradientHover: "linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #7c3aed 100%)",
        shadowColor: "#7c3aed40",
        glowColor: "#7c3aed",
        explorerUrl: `https://solscan.io/account/${address}` 
      };

  // Compact button style - fixed size for consistency
  const ButtonContent = ({ text, onClick }: { text: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="group relative flex items-center gap-1.5 h-9 px-3 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
      style={{
        background: config.gradient,
        boxShadow: `0 2px 10px ${config.shadowColor}`,
      }}
    >
      {/* Animated gradient overlay on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: config.gradientHover }}
      />
      
      {/* Icon */}
      <span className="relative z-10 text-base">{config.icon}</span>
      
      {/* Text */}
      <span className="relative z-10 text-white font-medium text-xs">
        {text}
      </span>
    </button>
  );

  if (!isConnected) {
    if (type === "evm") {
      return (
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <ButtonContent 
              text="Connect EVM" 
              onClick={openConnectModal} 
            />
          )}
        </ConnectButton.Custom>
      );
    }
    
    // Custom Solana connect button - Using simple ButtonContent + modal trigger
    return (
      <ButtonContent 
        text="Connect Solana" 
        onClick={() => setVisible(true)} 
      />
    );
  }

  // Connected state with dropdown (compact, no white box)
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="group relative flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden"
        style={{
          background: config.gradient,
          boxShadow: `0 2px 10px ${config.shadowColor}`,
        }}
      >
        {/* Animated gradient overlay on hover */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: config.gradientHover }}
        />
        
        {/* Icon - no white box */}
        <span className="relative z-10 text-base">{config.icon}</span>
        
        {/* Address + Dropdown Arrow */}
        <span className="relative z-10 text-white font-mono font-medium text-xs">
          {formatAddress(address || "")}
        </span>
        <ChevronDown 
          size={12} 
          className={`relative z-10 text-white/80 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 top-11 w-52 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 rounded-xl shadow-2xl z-50 overflow-hidden"
          style={{
            animation: "slideDown 0.2s ease-out",
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-800/60"
            style={{
              background: `${config.glowColor}15`,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center">
                <span className="text-3xl drop-shadow-md">{config.icon}</span>
              </div>
              <div>
                <div className="text-white font-semibold text-sm">{config.label} Wallet</div>
                <div className="text-zinc-400 text-xs font-mono mt-0.5">{formatAddress(address || "")}</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="py-2">
            <button
              onClick={() => {
                onCopy();
                setTimeout(() => setShowDropdown(false), 1200);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-all duration-150"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center">
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </div>
              {copied ? "Copied!" : "Copy Address"}
            </button>
            
            <button
              onClick={() => {
                window.open(config.explorerUrl, "_blank");
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-all duration-150"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center">
                <ExternalLink size={16} />
              </div>
              View on Explorer
            </button>
            
            <div className="h-px bg-zinc-800/60 mx-4 my-2" />
            
            <button
              onClick={() => {
                onDisconnect();
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-all duration-150"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                <LogOut size={16} />
              </div>
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------- Main Component ----------------------- */
export default function PortfolioPage() {
  // Wallet states
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { disconnect: disconnectEvm } = useDisconnect();
  const { publicKey: solanaPublicKey, disconnect: disconnectAdapter, connected: isSolanaConnected, select } = useWallet();
  const solanaAddress = solanaPublicKey?.toBase58();

  // Custom disconnect handler that also resets selection
  const disconnectSolana = useCallback(async () => {
    await disconnectAdapter();
    select(null); // Reset selected wallet so next connection attempt works fresh
  }, [disconnectAdapter, select]);

  // Portfolio state
  const [holdings, setHoldings] = useState<TokenHolding[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // UI state
  const [currency, setCurrency] = useState<Currency>("USD");
  const [searchQuery, setSearchQuery] = useState("");
  const [chainFilter, setChainFilter] = useState<string>("all");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [copiedEvm, setCopiedEvm] = useState(false);
  const [copiedSolana, setCopiedSolana] = useState(false);

  // LocalStorage persistence
  useEffect(() => {
    if (isEvmConnected || isSolanaConnected) {
      localStorage.setItem("portfolio_connections", JSON.stringify({
        evm: evmAddress || null,
        solana: solanaAddress || null,
      }));
    }
  }, [isEvmConnected, isSolanaConnected, evmAddress, solanaAddress]);

  // Fetch balances from API
  const fetchBalances = useCallback(async () => {
    if (!evmAddress && !solanaAddress) {
      setHoldings([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (evmAddress) params.set("evmAddress", evmAddress);
      if (solanaAddress) params.set("solanaAddress", solanaAddress);

      const balancesRes = await fetch(`/api/portfolio/balances?${params.toString()}`);
      const balancesData = await balancesRes.json();

      if (!balancesData.balances) {
        setLoading(false);
        return;
      }

      // Collect all symbols for price fetching
      const allSymbols: string[] = [];
      const chainBalances: ChainBalance[] = balancesData.balances;

      for (const chainData of chainBalances) {
        allSymbols.push(chainData.native.symbol);
        for (const token of chainData.tokens) {
          if (token.symbol) allSymbols.push(token.symbol);
        }
      }

      // Fetch prices
      const pricesRes = await fetch(`/api/portfolio/prices?symbols=${allSymbols.join(",")}`);
      const pricesData = await pricesRes.json();
      const prices = pricesData.prices || {};

      // Build holdings array
      const newHoldings: TokenHolding[] = [];

      for (const chainData of chainBalances) {
        const nativeBalance = parseFloat(chainData.native.balance);
        if (nativeBalance > 0.0001) {
          const priceInfo = prices[chainData.native.symbol];
          const price = priceInfo?.price || 0;
          const change24h = priceInfo?.change24h || 0;

          newHoldings.push({
            id: `${chainData.chain}-native`,
            symbol: chainData.native.symbol,
            name: chainData.native.name,
            balance: nativeBalance,
            price,
            value: nativeBalance * price,
            change24h,
            chain: chainData.chain,
            chainColor: chainData.color,
          });
        }

        for (const token of chainData.tokens) {
          const tokenBalance = parseFloat(token.tokenBalance);
          if (tokenBalance > 0.0001 && token.symbol) {
            const priceInfo = prices[token.symbol.toUpperCase()];
            const price = priceInfo?.price || 0;
            const change24h = priceInfo?.change24h || 0;

            newHoldings.push({
              id: `${chainData.chain}-${token.contractAddress}`,
              symbol: token.symbol,
              name: token.name || token.symbol,
              balance: tokenBalance,
              price,
              value: tokenBalance * price,
              change24h,
              chain: chainData.chain,
              chainColor: chainData.color,
              logo: token.logo,
              contractAddress: token.contractAddress,
            });
          }
        }
      }

      // Sort by value descending
      newHoldings.sort((a, b) => b.value - a.value);
      setHoldings(newHoldings);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching portfolio:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [evmAddress, solanaAddress]);

  // Auto-fetch when wallets connect
  useEffect(() => {
    if (isEvmConnected || isSolanaConnected) {
      fetchBalances();
    } else {
      setHoldings([]);
    }
  }, [isEvmConnected, isSolanaConnected, fetchBalances]);

  // Refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    fetchBalances();
  };

  // Copy handlers
  const handleCopyEvm = () => {
    if (evmAddress) {
      navigator.clipboard.writeText(evmAddress);
      setCopiedEvm(true);
      setTimeout(() => setCopiedEvm(false), 2000);
    }
  };

  const handleCopySolana = () => {
    if (solanaAddress) {
      navigator.clipboard.writeText(solanaAddress);
      setCopiedSolana(true);
      setTimeout(() => setCopiedSolana(false), 2000);
    }
  };

  // Calculate totals
  const totalValue = useMemo(() =>
    holdings.reduce((sum, h) => sum + h.value, 0),
    [holdings]
  );

  const totalChange24h = useMemo(() => {
    if (holdings.length === 0 || totalValue === 0) return 0;
    const weightedChange = holdings.reduce((sum, h) => {
      const weight = h.value / totalValue;
      return sum + (h.change24h * weight);
    }, 0);
    return weightedChange;
  }, [holdings, totalValue]);

  // Chain distribution for pie chart
  const chainDistribution = useMemo(() => {
    const distribution: Record<string, { value: number; color: string; name: string }> = {};
    for (const h of holdings) {
      if (!distribution[h.chain]) {
        distribution[h.chain] = {
          value: 0,
          color: h.chainColor,
          name: h.chain.charAt(0).toUpperCase() + h.chain.slice(1),
        };
      }
      distribution[h.chain].value += h.value;
    }
    return Object.entries(distribution).map(([chain, data]) => ({
      chain,
      ...data,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
    }));
  }, [holdings, totalValue]);

  // Filter and sort holdings
  const filteredHoldings = useMemo(() => {
    let result = [...holdings];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(h =>
        h.symbol.toLowerCase().includes(query) ||
        h.name.toLowerCase().includes(query) ||
        h.chain.toLowerCase().includes(query)
      );
    }

    // Chain filter
    if (chainFilter !== "all") {
      result = result.filter(h => h.chain === chainFilter);
    }

    // Value filter - hide tokens with 0 value
    result = result.filter(h => h.value > 0.01);

    return result;
  }, [holdings, searchQuery, chainFilter]);

  // Dynamic chain filter list - shows only chains with holdings, or defaults when no wallet
  const availableChains = useMemo(() => {
    const isWalletConnected = isEvmConnected || isSolanaConnected;
    
    if (!isWalletConnected || holdings.length === 0) {
      // Default chains when no wallet connected
      return ["ethereum", "solana"];
    }
    
    // Get unique chains from actual holdings
    const chainsWithHoldings = [...new Set(holdings.map(h => h.chain))];
    return chainsWithHoldings;
  }, [holdings, isEvmConnected, isSolanaConnected]);

  // Format helpers
  const formatValue = (value: number) => {
    const config = CURRENCY_CONFIG[currency];
    return `${config.symbol}${value.toLocaleString(config.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatBalance = (balance: number, symbol: string) => {
    if (balance >= 1000000) return `${(balance / 1000000).toFixed(2)}M ${symbol}`;
    if (balance >= 1000) return `${(balance / 1000).toFixed(2)}K ${symbol}`;
    if (balance >= 1) return `${balance.toFixed(4)} ${symbol}`;
    return `${balance.toFixed(8)} ${symbol}`;
  };

  // Determine if we're showing demo or real data
  const isDemo = !isEvmConnected && !isSolanaConnected;
  const displayHoldings = isDemo ? DEMO_HOLDINGS : filteredHoldings;
  const displayTotalValue = isDemo ? DEMO_HOLDINGS.reduce((sum, h) => sum + h.value, 0) : totalValue;

  return (
    <div className="flex flex-col min-h-screen pb-10">
      {/* Top Header - Sticky & Full Width (matching Dashboard) */}
      <div className="h-[88px] border-b border-zinc-900/60 bg-black/40 backdrop-blur-sm sticky top-0 z-30">
        <div className="h-full w-full max-w-[1500px] mx-auto px-4 md:px-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white tracking-tight shrink-0">Portfolio</h1>
          
          {/* Right side: Wallet buttons + Currency + Refresh */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            {/* EVM Wallet Button */}
            <WalletButton
              type="evm"
              address={evmAddress}
              isConnected={isEvmConnected}
              onDisconnect={() => disconnectEvm()}
              onCopy={handleCopyEvm}
              copied={copiedEvm}
            />

            {/* Solana Wallet Button */}
            <WalletButton
              type="solana"
              address={solanaAddress}
              isConnected={isSolanaConnected}
              onDisconnect={disconnectSolana}
              onCopy={handleCopySolana}
              copied={copiedSolana}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-[1500px] mx-auto px-4 md:px-6 pt-6 space-y-6">
        {/* Subtitle */}
        {isDemo && (
          <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 inline-block">
            <p className="text-amber-400 text-sm">Connect your wallet to view real holdings</p>
          </div>
        )}
        {!isDemo && (
          <p className="text-zinc-500 text-sm">{holdings.length} assets across {chainDistribution.length} chains</p>
        )}

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Value */}
        <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/60 p-5 md:col-span-2">
          <div className="text-zinc-400 text-sm mb-1">Net Worth</div>
          <div className="text-3xl font-bold text-white">
            {formatValue(displayTotalValue)}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`flex items-center gap-1 text-sm font-medium ${
                totalChange24h >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {totalChange24h >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {totalChange24h >= 0 ? "+" : ""}{totalChange24h.toFixed(2)}%
            </span>
            <span className="text-zinc-500 text-sm">24h</span>
          </div>
          {isDemo && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-400 text-xs">Demo data shown. Connect wallet for real balances.</p>
            </div>
          )}
        </div>

        {/* Chain Distribution Mini Chart */}
        <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/60 p-5 md:col-span-2">
          <div className="text-zinc-400 text-sm mb-3">Chain Distribution</div>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={isDemo 
                      ? [
                          { chain: "ethereum", value: 60, color: "#627EEA" },
                          { chain: "solana", value: 25, color: "#9945FF" },
                          { chain: "arbitrum", value: 10, color: "#28A0F0" },
                          { chain: "base", value: 5, color: "#0052FF" },
                        ]
                      : chainDistribution
                    }
                    dataKey="value"
                    nameKey="chain"
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={4}
                    stroke="transparent"
                  >
                    {(isDemo
                      ? [
                          { chain: "ethereum", color: "#627EEA" },
                          { chain: "solana", color: "#9945FF" },
                          { chain: "arbitrum", color: "#28A0F0" },
                          { chain: "base", color: "#0052FF" },
                        ]
                      : chainDistribution
                    ).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {(isDemo
                ? [
                    { chain: "ethereum", name: "Ethereum", percentage: 60, color: "#627EEA" },
                    { chain: "solana", name: "Solana", percentage: 25, color: "#9945FF" },
                    { chain: "arbitrum", name: "Arbitrum", percentage: 10, color: "#28A0F0" },
                    { chain: "base", name: "Base", percentage: 5, color: "#0052FF" },
                  ]
                : chainDistribution
              ).slice(0, 4).map((chain) => (
                <div key={chain.chain} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: chain.color }} />
                    <span className="text-zinc-300 text-sm">{chain.name}</span>
                  </div>
                  <span className="text-zinc-400 text-sm">{chain.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tokens..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700/80 transition-all"
          />
        </div>

        {/* Chain Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {["all", ...availableChains].map((chain) => (
            <button
              key={chain}
              onClick={() => setChainFilter(chain)}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                chainFilter === chain
                  ? "bg-zinc-100 text-zinc-900"
                  : "bg-zinc-800/60 text-zinc-400 hover:text-white border border-zinc-700/50"
              }`}
              style={
                chainFilter === chain && chain !== "all"
                  ? { backgroundColor: CHAIN_COLORS[chain], color: "white" }
                  : undefined
              }
            >
              {chain === "all" ? "All Chains" : chain.charAt(0).toUpperCase() + chain.slice(1)}
            </button>
          ))}
        </div>

        {/* Currency Selector - right aligned */}
        <div className="relative ml-auto">
          <button
            onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800/60 border border-zinc-700/50 text-sm font-medium text-zinc-300 hover:bg-zinc-700/60 transition-colors"
          >
            {CURRENCY_CONFIG[currency].symbol} {currency}
            <ChevronDown size={14} />
          </button>
          {showCurrencyDropdown && (
            <div className="absolute right-0 top-11 w-28 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
              {(["USD", "EUR", "PHP"] as Currency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCurrency(c);
                    setShowCurrencyDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                    currency === c
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white"
                  }`}
                >
                  {CURRENCY_CONFIG[c].symbol} {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60">
          <h2 className="text-white font-semibold">Token Holdings</h2>
          {lastUpdated && (
            <span className="text-zinc-500 text-xs">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800/60">
                <th className="text-left px-5 py-3 font-medium text-zinc-400 text-sm">Token</th>
                <th className="text-right px-5 py-3 font-medium text-zinc-400 text-sm">Chain</th>
                <th className="text-right px-5 py-3 font-medium text-zinc-400 text-sm">Balance</th>
                <th className="text-right px-5 py-3 font-medium text-zinc-400 text-sm">Price</th>
                <th className="text-right px-5 py-3 font-medium text-zinc-400 text-sm">24h %</th>
                <th className="text-right px-5 py-3 font-medium text-zinc-400 text-sm">Value</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw size={24} className="text-zinc-500 animate-spin" />
                      <span className="text-zinc-400 text-sm">Loading portfolio...</span>
                    </div>
                  </td>
                </tr>
              ) : displayHoldings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Wallet size={32} className="text-zinc-600" />
                      <span className="text-zinc-400 text-sm">No tokens found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                displayHoldings.map((holding) => (
                  <tr
                    key={holding.id}
                    className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{
                            backgroundColor: `${holding.chainColor}20`,
                            color: holding.chainColor,
                          }}
                        >
                          {holding.logo ? (
                            <img src={holding.logo} alt={holding.symbol} className="w-6 h-6 rounded-full" />
                          ) : (
                            holding.symbol.slice(0, 2)
                          )}
                        </div>
                        <div>
                          <div className="text-white font-medium">{holding.name}</div>
                          <div className="text-zinc-500 text-sm">{holding.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className="px-2 py-1 rounded-lg text-xs font-medium"
                        style={{
                          backgroundColor: `${holding.chainColor}20`,
                          color: holding.chainColor,
                        }}
                      >
                        {holding.chain.charAt(0).toUpperCase() + holding.chain.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-zinc-300">
                      {formatBalance(holding.balance, holding.symbol)}
                    </td>
                    <td className="px-5 py-4 text-right text-white font-medium">
                      {formatValue(holding.price)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className={`flex items-center justify-end gap-1 text-sm font-medium ${
                          holding.change24h >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {holding.change24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {holding.change24h >= 0 ? "+" : ""}{holding.change24h.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-white font-semibold">
                      {formatValue(holding.value)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div>
  );
}

