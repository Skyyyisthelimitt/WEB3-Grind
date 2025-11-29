"use client";

import { useEffect, useState } from "react";
import { CryptoCard } from "./CryptoCard";

type Coin = {
  id: string;
  name: string;
  price: number;
  changePct: number;
  series: { time: string; value: number }[];
};

export default function CryptoSection() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function fetchCoins() {
      try {
        // 1. Current prices
        const priceRes = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true"
        );
        const priceData = await priceRes.json();

        // 2. Historical data for charts
        const histRes = await Promise.all(
          ["bitcoin", "ethereum", "solana"].map((id) =>
            fetch(
              `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=1&interval=hourly`
            ).then((r) => r.json())
          )
        );

        const mapped: Coin[] = ["bitcoin", "ethereum", "solana"].map(
          (id, i) => ({
            id,
            name: id.charAt(0).toUpperCase() + id.slice(1),
            price: priceData[id].usd,
            changePct: priceData[id].usd_24h_change,
            series: histRes[i].prices.map(([time, value]: [number, number]) => ({
              time: new Date(time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              value,
            })),
          })
        );

        if (alive) {
          setCoins(mapped);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching crypto data:", err);
      }
    }

    fetchCoins();

    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <p className="text-white">Loading crypto data...</p>;

  return (
    <section className="grid md:grid-cols-3 gap-6">
      {coins.map((coin) => (
        <CryptoCard
          key={coin.id}
          coin={{
            symbol: coin.id.toUpperCase().slice(0, 3),
            name: coin.name,
            price: coin.price,
            changePct: coin.changePct,
            series: coin.series.map(s => s.value)
          }}
        />
      ))}
    </section>
  );
}