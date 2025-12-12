"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Handshake,
  Loader2,
  Check,
  LogOut,
  Coins,
  PieChart,
} from "lucide-react";
import Image from "next/image";
import logo from "../images/8wb-logo.png"; // Import the 8wb logo

export default function SideNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams?.get("tab") || "ongoing";
  const [collapsed, setCollapsed] = useState(false);
  const [collabsOpen, setCollabsOpen] = useState(pathname?.startsWith("/collabs") ?? false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  };

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/crypto", label: "Crypto", icon: Coins },
    { href: "/crypto/portfolio", label: "Portfolio", icon: PieChart },
    { href: "/whitelists", label: "Whitelists", icon: ClipboardList },
    { href: "/collabs", label: "Collabs", icon: Handshake },
  ];

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col transition-all duration-200 border-r border-zinc-900/60 bg-black/40 backdrop-blur-sm
        ${collapsed ? "w-20" : "w-64"}`} // Changed from w-72 to w-64
    >
      {/* Logo section */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900/60"> {/* Reduced py-5 to py-3 */}
        <div className="flex items-center gap-0">
          <div className={`relative flex items-center justify-center rounded-lg
              ${collapsed ? "w-11 h-11" : "w-16 h-16"}`}>
            <Image 
              src={logo}
              alt="Logo"
              fill
              className="object-contain" // object-contain centers the image within the container
              priority
            />
          </div>
          {!collapsed && <div className="font-bold text-lg text-zinc-100 whitespace-nowrap leading-none mb-1">WEB3 Manager</div>}
        </div>

        <button
          aria-label="Toggle sidebar"
          onClick={() => setCollapsed((s) => !s)}
          className="p-1.5 rounded-md hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation - slightly reduced padding */}
      <nav className="flex-1 px-3 py-2 space-y-2 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">
        {links.map(({ href, label, icon: Icon }) => {
          if (label === "Collabs") {
            const activeRoot = pathname?.startsWith("/collabs");
            return (
              <div key="collabs" className="mb-3"> {/* Reduced mb-4 to mb-3 */}
                <button
                  onClick={() => setCollabsOpen((s) => !s)}
                  title="Collabs"
                  className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors text-base
                    ${activeRoot 
                      ? "bg-zinc-800 text-white font-medium" 
                      : "text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200"}`}
                >
                  <Icon size={20} className={activeRoot ? "text-white" : ""} />
                  {!collapsed && <span>Collabs</span>}
                </button>

                {/* Submenu with separator */}
                {!collapsed && collabsOpen && (
                  <div className="mt-3 ml-4 mr-2">
                    <div className="h-px bg-zinc-800/50 rounded" />
                    <div className="mt-3 flex flex-col gap-1.5">
                      <Link
                        href="/collabs?tab=ongoing"
                        className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-[15px] transition-colors
                          ${activeRoot && tabParam === "ongoing"
                            ? "border-l-2 border-white bg-zinc-800 text-white pl-[14px]"
                            : "text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200"}`}
                      >
                        <Loader2 size={16} className={activeRoot && tabParam === "ongoing" ? "animate-spin" : ""} />
                        Ongoing
                      </Link>
                      <Link
                        href="/collabs?tab=done"
                        className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-[15px] transition-colors
                          ${activeRoot && tabParam === "done"
                            ? "border-l-2 border-white bg-zinc-800 text-white pl-[14px]"
                            : "text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200"}`}
                      >
                        <Check size={16} />
                        Done
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`flex items-center gap-4 rounded-md px-4 py-3 transition-colors text-base
                  ${active 
                  ? "bg-zinc-800 text-white font-medium" 
                  : "text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200"}`}
            >
              <Icon size={20} className={active ? "text-white" : ""} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer - adjusted padding */}
      <div className="px-4 py-4 border-t border-zinc-900/60">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors text-base
            ${collapsed ? "justify-center" : ""}
            text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200 disabled:opacity-50`}
          title="Logout"
        >
          <LogOut size={20} />
          {!collapsed && <span>{loggingOut ? "Logging out..." : "Logout"}</span>}
        </button>
        <div className={`text-sm text-zinc-500 mt-2 ${collapsed ? "text-center" : ""}`}>
          {!collapsed ? "v1.0.0" : <div className="text-center">v1.0</div>}
        </div>
      </div>
    </aside>
  );
}
