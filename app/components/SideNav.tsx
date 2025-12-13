"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Home01Icon,
  Task01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Agreement01Icon,
  Loading02Icon,
  CheckmarkCircle01Icon,
  Logout03Icon,
  BitcoinCircleIcon,
  PieChartIcon,
} from "hugeicons-react";
import Image from "next/image";
import logo from "../images/newlogo.png";

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
    { href: "/", label: "Dashboard", icon: Home01Icon },
    { href: "/crypto", label: "Crypto", icon: BitcoinCircleIcon },
    { href: "/crypto/portfolio", label: "Portfolio", icon: PieChartIcon },
    { href: "/whitelists", label: "Whitelists", icon: Task01Icon },
    { href: "/collabs", label: "Collabs", icon: Agreement01Icon },
  ];

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col transition-all duration-300 border-r border-zinc-800/60 bg-black/60 backdrop-blur-xl
        ${collapsed ? "w-20" : "w-[280px]"}`}
    >
      {/* Logo section */}
      <div className="flex items-center justify-between px-5 py-6">
        <div className="flex items-center gap-3">
          <div className={`relative flex items-center justify-center
              ${collapsed ? "w-10 h-10" : "w-10 h-10"}`}>
            <Image 
              src={logo}
              alt="Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          {!collapsed && <div className="font-bold text-lg text-zinc-100/90 whitespace-nowrap tracking-tight">WEB3 Manager</div>}
        </div>

        <button
          aria-label="Toggle sidebar"
          onClick={() => setCollapsed((s) => !s)}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {collapsed ? <ArrowRight01Icon size={20} /> : <ArrowLeft01Icon size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto scrollbar-none">
        {links.map(({ href, label, icon: Icon }) => {
          if (label === "Collabs") {
            const activeRoot = pathname?.startsWith("/collabs");
            return (
              <div key="collabs" className="mb-2">
                <button
                  onClick={() => setCollabsOpen((s) => !s)}
                  title="Collabs"
                  className={`w-full flex items-center ${collapsed ? "justify-center px-2 py-3" : "gap-3.5 px-4 py-3.5"} rounded-xl transition-all duration-200 group
                    ${activeRoot 
                      ? "bg-white text-zinc-950 shadow-lg shadow-white/5" 
                      : "text-zinc-400/80 hover:bg-zinc-800/40 hover:text-zinc-100"}`}
                >
                  <Icon size={collapsed ? 26 : 22} className={`transition-colors ${activeRoot ? "text-zinc-950" : "group-hover:text-zinc-100"}`} />
                  {!collapsed && <span className="font-medium text-[15px]">Collabs</span>}
                </button>

                {/* Submenu */}
                {!collapsed && collabsOpen && (
                  <div className="mt-2 ml-5 pl-4 border-l border-zinc-800 space-y-1">
                    <Link
                      href="/collabs?tab=ongoing"
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-all
                        ${activeRoot && tabParam === "ongoing"
                          ? "text-zinc-100 bg-zinc-800/60 font-medium"
                          : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/30"}`}
                    >
                      <Loading02Icon size={16} className={activeRoot && tabParam === "ongoing" ? "animate-spin text-indigo-400" : ""} />
                      <span>Ongoing</span>
                    </Link>
                    <Link
                      href="/collabs?tab=done"
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-all
                        ${activeRoot && tabParam === "done"
                          ? "text-zinc-100 bg-zinc-800/60 font-medium"
                          : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/30"}`}
                    >
                      <CheckmarkCircle01Icon size={16} className={activeRoot && tabParam === "done" ? "text-emerald-400" : ""} />
                      <span>Done</span>
                    </Link>
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
              className={`flex items-center ${collapsed ? "justify-center px-2 py-3" : "gap-3.5 px-4 py-3.5"} rounded-xl transition-all duration-200 group
                  ${active 
                  ? "bg-white text-zinc-950 shadow-lg shadow-white/5 font-semibold" 
                  : "text-zinc-400/80 hover:bg-zinc-800/40 hover:text-zinc-100 font-medium"}`}
            >
              <Icon size={collapsed ? 26 : 22} className={`transition-colors ${active ? "text-zinc-950" : "group-hover:text-zinc-100"}`} />
              {!collapsed && <span className="text-[15px]">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-6 border-t border-zinc-800/60 bg-black/20">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className={`w-full flex items-center gap-3.5 rounded-xl px-3 py-3 transition-colors text-[15px] font-medium
            ${collapsed ? "justify-center" : ""}
            text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-200 disabled:opacity-50 group`}
          title="Logout"
        >
          <Logout03Icon size={collapsed ? 26 : 22} className="group-hover:text-zinc-200 transition-colors" />
          {!collapsed && <span>{loggingOut ? "Logging out..." : "Logout"}</span>}
        </button>
        <div className={`text-xs text-zinc-600 mt-4 font-mono ${collapsed ? "text-center" : "px-3"}`}>
          {!collapsed ? "v1.0.0" : "v1.0"}
        </div>
      </div>
    </aside>
  );
}
