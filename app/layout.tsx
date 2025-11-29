import "./globals.css";
import LayoutWrapper from "./components/LayoutWrapper";
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "WEB3 Manager",
  description: "Personal NFT WL & Collab manager",
  icons: {
    icon: [
      { url: '/logo.png' },
      { url: '/logo.png', sizes: '60x60', type: 'image/png' },
    ],
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-br from-zinc-950 to-black text-zinc-100">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}