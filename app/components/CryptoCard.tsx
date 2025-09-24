"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

type Coin = {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  series: number[];
};

export function CryptoCard({ coin }: { coin: Coin }) {
  return (
    <div className="p-4 rounded-2xl bg-zinc-900 shadow-md border border-zinc-800">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-white">{coin.name}</h2>
        <span className="text-zinc-400">{coin.symbol}</span>
      </div>

      <div className="text-2xl font-bold text-white">
        ${coin.price.toLocaleString()}
      </div>

      <div
        className={`text-sm mt-1 ${
          coin.changePct >= 0 ? "text-green-400" : "text-red-400"
        }`}
      >
        {coin.changePct.toFixed(2)}%
      </div>

      <div className="mt-3 h-16">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={coin.series.map((p, i) => ({ i, p }))}>
            <Line
              type="monotone"
              dataKey="p"
              stroke={coin.changePct >= 0 ? "#22c55e" : "#ef4444"}
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
