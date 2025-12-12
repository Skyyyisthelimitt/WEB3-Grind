import { create } from "zustand";
import { persist } from "zustand/middleware";

type WalletType = "metamask" | "rabby" | "phantom" | "magiceden" | null;

type WalletState = {
  connectedWallet: WalletType;
  walletAddress: string;
  chainId: number | null;
  isConnecting: boolean;
  favorites: string[]; // Favorite crypto IDs
  
  // Actions
  setWallet: (wallet: WalletType, address: string) => void;
  disconnect: () => void;
  setConnecting: (connecting: boolean) => void;
  toggleFavorite: (cryptoId: string) => void;
  setChainId: (chainId: number) => void;
};

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      connectedWallet: null,
      walletAddress: "",
      chainId: null,
      isConnecting: false,
      favorites: ["bitcoin", "ethereum", "solana"],

      setWallet: (wallet, address) => set({ 
        connectedWallet: wallet, 
        walletAddress: address,
        isConnecting: false 
      }),

      disconnect: () => set({ 
        connectedWallet: null, 
        walletAddress: "",
        chainId: null 
      }),

      setConnecting: (connecting) => set({ isConnecting: connecting }),

      toggleFavorite: (cryptoId) => {
        const { favorites } = get();
        if (favorites.includes(cryptoId)) {
          set({ favorites: favorites.filter(id => id !== cryptoId) });
        } else {
          // Max 3 favorites
          if (favorites.length >= 3) {
            set({ favorites: [...favorites.slice(1), cryptoId] });
          } else {
            set({ favorites: [...favorites, cryptoId] });
          }
        }
      },

      setChainId: (chainId) => set({ chainId }),
    }),
    {
      name: "wallet-storage",
      partialize: (state) => ({ 
        favorites: state.favorites,
        // Don't persist wallet connection for security
      }),
    }
  )
);

// Wallet connection helpers
export async function connectMetaMask(): Promise<{ address: string; chainId: number } | null> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    alert("MetaMask is not installed. Please install it to continue.");
    return null;
  }

  try {
    const ethereum = (window as any).ethereum;
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    const chainId = await ethereum.request({ method: "eth_chainId" });
    
    if (accounts.length > 0) {
      return { 
        address: accounts[0], 
        chainId: parseInt(chainId, 16) 
      };
    }
    return null;
  } catch (error) {
    console.error("MetaMask connection error:", error);
    return null;
  }
}

export async function connectRabby(): Promise<{ address: string; chainId: number } | null> {
  // Rabby injects as ethereum provider, similar to MetaMask
  return connectMetaMask();
}

export async function connectPhantom(): Promise<{ address: string } | null> {
  if (typeof window === "undefined" || !(window as any).solana?.isPhantom) {
    alert("Phantom wallet is not installed. Please install it to continue.");
    return null;
  }

  try {
    const solana = (window as any).solana;
    const response = await solana.connect();
    return { address: response.publicKey.toString() };
  } catch (error) {
    console.error("Phantom connection error:", error);
    return null;
  }
}

export async function connectMagicEden(): Promise<{ address: string } | null> {
  // Magic Eden uses similar interface to Phantom
  if (typeof window === "undefined") return null;
  
  const magicEden = (window as any).magicEden?.solana;
  if (!magicEden) {
    // Try Phantom as fallback
    return connectPhantom();
  }

  try {
    const response = await magicEden.connect();
    return { address: response.publicKey.toString() };
  } catch (error) {
    console.error("Magic Eden connection error:", error);
    return null;
  }
}
