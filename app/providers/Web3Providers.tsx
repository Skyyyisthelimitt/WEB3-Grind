"use client";

import { ReactNode, useMemo } from "react";

// Solana Wallet Imports
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

// RainbowKit/Wagmi Imports
import "@rainbow-me/rainbowkit/styles.css";
import { connectorsForWallets, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { 
  metaMaskWallet, 
  rabbyWallet,
  rainbowWallet, 
  coinbaseWallet, 
  walletConnectWallet,
  injectedWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http, WagmiProvider } from "wagmi";
import { mainnet, base, arbitrum } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Solana wallet adapter styles
import "@solana/wallet-adapter-react-ui/styles.css";

/* ----------------------- Wagmi/RainbowKit Config ----------------------- */
const connectors = connectorsForWallets(
  [
    {
      groupName: "Popular",
      wallets: [injectedWallet, metaMaskWallet, rabbyWallet, rainbowWallet, coinbaseWallet],
    },
  ],
  {
    appName: "Web3 Wizard Portfolio",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "placeholder",
  }
);

const config = createConfig({
  connectors,
  chains: [mainnet, base, arbitrum],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
  },
  ssr: true,
  multiInjectedProviderDiscovery: false,
});

const queryClient = new QueryClient();

/* ----------------------- Provider Component ----------------------- */
export default function Web3Providers({ children }: { children: ReactNode }) {
  // Solana network endpoint (mainnet)
  const endpoint = useMemo(() => {
    const solKey = process.env.NEXT_PUBLIC_ALCHEMY_SOL_KEY;
    if (solKey) {
      return `https://solana-mainnet.g.alchemy.com/v2/${solKey}`;
    }
    return clusterApiUrl("mainnet-beta");
  }, []);

  // Solana wallets - Using empty array to let Wallet Standard auto-detect (Phantom, etc.)
  const wallets = useMemo(() => [], []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#f97316",
            accentColorForeground: "white",
            borderRadius: "medium",
            fontStack: "system",
            overlayBlur: "small",
          })}
        >
          <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
              <WalletModalProvider>
                {children}
              </WalletModalProvider>
            </WalletProvider>
          </ConnectionProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
