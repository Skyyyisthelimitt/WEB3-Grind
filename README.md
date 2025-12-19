# Web3 Wizard

### The Ultimate Operating System for Web3 Natives.

**Web3 Wizard** unifies your crypto portfolio, whitelist grinding, and collab management into a sleek, high-performance interface. Designed for degens, traders, and collectors who need clarity in the chaos.

---

## 🔥 Key Features

### 📊 **Unified Portfolio Tracking**

- **Multi-Chain Dominance:** Seamlessly track assets across **Ethereum, Solana, Base, Optimism, Arbitrum, and Polygon**.
- **Real-Time Net Worth:** Live aggregation of all your token holdings in your preferred currency (USD, EUR, JPY, and more).
- **Activity Feed:** A consolidated view of your transaction history across both EVM and Solana chains.

### 📝 **Smart Whitelist & Collab Manager**

- **Never Miss a Mint:** Syncs directly with Google Sheets (`WHITELIST` tab) to track WL/OG spots, mint dates, prices, and timezones.
- **Collab Mastery:** Manage giveaways and collaborations (`COLLABS_ACTIVE` / `COLLABS_DONE`) with status tracking, contacts, and winner links.
- **Calendar View:** Visual timeline of your upcoming mints.

### 📈 **Advanced Market Intelligence**

- **Live Crypto Dashboard:** Real-time data for top 100 coins with sparkline trends, volume, and market cap.
- **Charts & Trends:** Beautiful, interactive charts providing deep insights.
- **Instant Exchange Access:** Direct links to trade on Binance, Bybit, Coinbase, and more.
- **Watchlist:** Pin your favorite gems for quick access (persisted locally).

### 🛡️ **Secure & Seamless Experience**

- **Enterprise-Grade Auth:** Secure Sign-Up and Login powered by **Supabase**.
- **Web3 Connect:** Integrated with **RainbowKit** and **Solana Wallet Adapter** for effortless wallet connections.
- **Premium UI/UX:** A fully responsive, dark-mode-first aesthetic with smooth GSAP animations and glassmorphism details.

### ✨ **Daily Alpha**

- **Motivation:** Daily doses of inspiration and verses to keep you grounded while you grind.

---

## 🛠 Tech Stack

Built with the cutting-edge Modern Web3 Stack:

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn Concepts
- **Blockchain:** Wagmi, Viem, Solana Web3.js, RainbowKit
- **Backend:** Supabase (Auth, DB), Google Sheets API
- **Data:** Alchemy, Helius, CoinMarketCap, CryptoCompare

---

## 💻 Running Locally

<details>
<summary><b>Click to expand setup instructions</b></summary>

1. **Clone & Install**

   ```bash
   git clone https://github.com/StartDusty/WEB3-Grind.git
   cd WEB3-Grind
   npm install
   ```

2. **Environment Setup**
   Create a `.env.local` file with the following credentials:

   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...

   # Blockchain Providers
   NEXT_PUBLIC_ALCHEMY_API_KEY=...
   NEXT_PUBLIC_ALCHEMY_SOL_KEY=...
   HELIUS_API_KEY=...
   ALCHEMY_API_KEY=...

   # Google Sheets (Whitelists/Collabs)
   GOOGLE_CLIENT_EMAIL=...
   GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
   GOOGLE_SHEET_ID=...

   # Market Data
   COINMARKETCAP_API_KEY=...
   CRYPTOCOMPARE_API_KEY=...
   ```

3. **Start the Engine**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` to start grinding.
   </details>
