## Web3 Wizard

Manage your WEB3 journey in one place – track whitelists, collabs, and market data with a clean dashboard.

### Features

- **Whitelist tracker**: Syncs from a Google Sheet (`WHITELIST` tab) and shows:
  - Project, chain, type (WL/OG/etc.), wallet, mint date/time, timezone, and price.
  - Quick search, inline add/edit/delete, and a mini calendar of upcoming mints.
- **Collab management**: Reads/writes to Google Sheet tabs (`COLLABS_ACTIVE` / `COLLABS_DONE`) with:
  - Project, X/Twitter, community, spots, contacts, deadlines, GA links, winners links, and status.
  - “Ongoing / Done” views and edit/delete controls.
- **Crypto overview**:
  - **Live Markets Table**: Track top 100 coins with real-time prices, 24h changes, market caps, and volume.
  - **Advanced UI**: Sleek dark mode design with gradient sparkline charts for 7-day trends.
  - **Exchange Integration**: Direct trade links to Binance, Bybit, Coinbase, and CoinGecko with custom listed icons.
  - **Smart Pagination**: Responsive, Shadcn-style pagination for easy navigation.
  - **Currency Selector**: Multi-currency support (USD, EUR, GBP, PHP, JPY, KRW, AUD) with instant conversion.
  - **Favorites**: Star your top coins for quick access in the dedicated "Favorites" section.
- **Daily inspiration**:
  - Daily Bible verse and motivational quote section.
- **Auth & layout**:
  - Login page with hero carousel and per‑slide copy.
  - Protected dashboard behind `/login` (Next.js app router + middleware).

### Tech Stack

- **Frontend**: Next.js App Router, React, TypeScript, Tailwind CSS, Recharts, `next/image`.
- **Backend / APIs**:
  - Google Sheets API (via `googleapis`) for whitelists and collabs.
  - CoinMarketCap API for live prices.
  - CryptoCompare API for historical price data.
  - Public APIs for quotes/verses and FX rates.

### Local Development

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with at least:

```bash
GOOGLE_CLIENT_EMAIL=...
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
COINMARKETCAP_API_KEY=...
CRYPTOCOMPARE_API_KEY=...
# any login secrets you use for /api/auth/login
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
