## Web3 Wizard

Manage your WEB3 journey in one place – track whitelists, collabs, and market data with a clean dashboard.

### Features

- **Portfolio Tracking**:
  - **Multi-Chain Support**: View balances and NFTs across Ethereum, Solana, Base, Arbitrum, Optimism, and Polygon.
  - **Real-Time Valuation**: Aggregates token values in your preferred currency.
  - **Activity Feed**: Unified transaction history for both EVM and Solana wallets.
- **Whitelist tracker**: Syncs from a Google Sheet (`WHITELIST` tab) and shows:
  - Project, chain, type (WL/OG/etc.), wallet, mint date/time, timezone, and price.
  - Quick search, inline add/edit/delete, and a mini calendar of upcoming mints.
- **Collab management**: Reads/writes to Google Sheet tabs (`COLLABS_ACTIVE` / `COLLABS_DONE`) with:
  - Project, X/Twitter, community, spots, contacts, deadlines, GA links, winners links, and status.
  - “Ongoing / Done” views and edit/delete controls.
- **Crypto overview**:
  - **Live Markets Table**: Track top 100 coins with real-time prices, 24h changes, market caps, and volume.
  - **Advanced UI**: Sleek dark mode design with gradient sparkline charts for 7-day price trends.
  - **Exchange Integration**: Direct trade links to Binance, Bybit, Coinbase, and CoinGecko with custom listed icons.
  - **Smart Pagination**: Responsive, Shadcn-style pagination for easy navigation.
  - **Currency Selector**: Multi-currency support (USD, EUR, GBP, PHP, JPY, KRW, AUD) with instant conversion.
  - **Favorites**: Persisted favorite coins (localStorage) with detailed trend cards and quick actions.
- **Dashboard**:
  - **Profile Management**: Custom profile picture uploads (stored via Supabase) and editable details.
  - **Enhanced Header**: Unified design with centered search bar and streamlined navigation.
- **Daily inspiration**:
  - Daily Bible verse and motivational quote section.
- **Auth & layout**:
  - **Supabase Auth**: Secure email/password authentication.
  - Login page with hero carousel and per‑slide copy.
  - Protected dashboard behind `/login` (Next.js app router + middleware).

### Tech Stack

- **Frontend**: Next.js App Router, React, TypeScript, Tailwind CSS, Recharts, `hugeicons-react`, `rainbowkit`, `@solana/wallet-adapter`.
- **Backend / APIs**:
  - **Supabase**: Authentication, Database (Profiles), and Storage (Avatars).
  - **Alchemy & Helius**: Blockchain data for EVM and Solana balances/activity.
  - Google Sheets API (via `googleapis`) for legacy whitelists and collab data.
  - CoinMarketCap API for live prices.
  - CryptoCompare API for historical price data.
  - Public APIs for quotes/verses and FX rates.

### Local Development

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with:

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

3. Run the dev server:

```bash
npm run dev
```

4. Open `http://localhost:3000` and log in via `/login`.

### Deploying

- Recommended: deploy on **Vercel**.
- Set the same environment variables in the Vercel project (Production + Preview).
- Push to the tracked branch (e.g. `main`) and Vercel will build & deploy automatically.
