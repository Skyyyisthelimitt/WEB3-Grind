"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function SideNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab") || "ongoing";
  const [collapsed, setCollapsed] = useState(false);
  const [collabsOpen, setCollabsOpen] = useState(pathname?.startsWith("/collabs") ?? false);

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/whitelists", label: "Whitelists", icon: ClipboardList },
    { href: "/collabs", label: "Collabs", icon: Users },
  ];

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col transition-all duration-200 border-r border-zinc-900/60 bg-black/40 backdrop-blur-sm
        ${collapsed ? "w-16" : "w-60"}`}
      aria-hidden={false}
    >
      {/* Logo section */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-zinc-900/60">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center rounded-md bg-gradient-to-br from-blue-600/80 to-blue-800/80 text-white
              ${collapsed ? "w-8 h-8 text-sm" : "w-10 h-10 text-lg"}`}>
            W
          </div>
          {!collapsed && <div className="font-semibold text-zinc-200">WL Tracker</div>}
        </div>

        <button
          aria-label="Toggle sidebar"
          onClick={() => setCollapsed((s) => !s)}
          className="p-1 rounded-md hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">
        {links.map(({ href, label, icon: Icon }) => {
          if (label === "Collabs") {
            const activeRoot = pathname?.startsWith("/collabs");
            return (
              <div key="collabs" className="mb-3">
                <button
                  onClick={() => setCollabsOpen((s) => !s)}
                  title="Collabs"
                  className={`w-full flex items-center gap-3 rounded-md px-3 py-2 transition-colors
                    ${activeRoot 
                      ? "bg-blue-600/10 text-blue-500" 
                      : "text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200"}`}
                >
                  <Icon size={18} />
                  {!collapsed && <span className="text-sm">Collabs</span>}
                </button>

                {/* Submenu with separator */}
                {!collapsed && collabsOpen && (
                  <div className="mt-2 ml-3 mr-2">
                    <div className="h-px bg-zinc-800/50 rounded" />
                    <div className="mt-2 flex flex-col gap-1">
                      <Link
                        href="/collabs?tab=ongoing"
                        className={`block rounded-md px-3 py-2 text-sm transition-colors
                          ${activeRoot && tabParam === "ongoing"
                            ? "border-l-2 border-blue-500 bg-blue-500/10 text-blue-400 pl-[10px]"
                            : "text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200"}`}
                      >
                        Ongoing
                      </Link>
                      <Link
                        href="/collabs?tab=done"
                        className={`block rounded-md px-3 py-2 text-sm transition-colors
                          ${activeRoot && tabParam === "done"
                            ? "border-l-2 border-blue-500 bg-blue-500/10 text-blue-400 pl-[10px]"
                            : "text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200"}`}
                      >
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
              className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors
                ${active 
                  ? "bg-blue-600/10 text-blue-500" 
                  : "text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200"}`}
            >
              <Icon size={18} />
              {!collapsed && <span className="text-sm">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-zinc-900/60 text-xs text-zinc-500">
        {!collapsed ? "v1.0.0" : <div className="text-center">v1.0</div>}
      </div>
    </aside>
  );
}
