import "./globals.css";
import Sidebar from "./components/SideNav";

export const metadata = {
  title: "WEB3 Manager",
  description: "Personal NFT WL & Collab manager",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-br from-zinc-950 to-black text-zinc-100">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
