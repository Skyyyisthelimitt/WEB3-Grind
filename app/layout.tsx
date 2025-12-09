import "./globals.css";
import LayoutWrapper from "./components/LayoutWrapper";
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "WEB3 Manager",
  description: "Personal NFT WL & Collab manager",
  icons: {
    icon: '/8wb-logo.png',
    shortcut: '/8wb-logo.png',
    apple: '/8wb-logo.png',
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