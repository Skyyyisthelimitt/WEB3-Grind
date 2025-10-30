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

const SideNav = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab") || "ongoing";
  const [collapsed, setCollapsed] = useState(false);

  // submenu state for Collabs
  const [collabsOpen, setCollabsOpen] = useState(pathname?.startsWith("/collabs") ?? false);

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/whitelists", label: "Whitelists", icon: ClipboardList },
    // keep a placeholder entry for Collabs, submenu will be rendered below
    { href: "/collabs", label: "Collabs", icon: Users },
  ];

  return (
    <aside
      className={`h-screen bg-gray-900 text-gray-100 flex flex-col transition-all duration-300 border-r border-gray-800
        ${collapsed ? "w-20" : "w-60"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
        {!collapsed && <h1 className="text-xl font-bold">WL Tracker</h1>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded hover:bg-gray-800 transition"
          aria-label="Toggle Sidebar"
        >
          {collapsed ? (
            <ChevronRight size={20} />
          ) : (
            <ChevronLeft size={20} />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          // Render Collabs as a submenu
          if (label === "Collabs") {
            const activeRoot = pathname?.startsWith("/collabs");
            return (
              <div key="collabs">
                <button
                  onClick={() => setCollabsOpen((s) => !s)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 
                    ${activeRoot ? "bg-blue-600 text-white" : "hover:bg-gray-800 text-gray-300 hover:text-white"}`}
                >
                  <Icon size={20} />
                  {!collapsed && <span className="text-sm">Collabs</span>}
                </button>

                {/* submenu (hidden when collapsed) */}
                {!collapsed && collabsOpen && (
                  <div className="mt-1 ml-8 flex flex-col gap-1">
                    <Link
                      href="/collabs?tab=ongoing"
                      className={`rounded px-2 py-1 text-sm transition ${
                        activeRoot && tabParam === "ongoing"
                          ? "bg-blue-600 text-white"
                          : "text-gray-300 hover:bg-gray-800"
                      }`}
                    >
                      Ongoing
                    </Link>
                    <Link
                      href="/collabs?tab=done"
                      className={`rounded px-2 py-1 text-sm transition ${
                        activeRoot && tabParam === "done"
                          ? "bg-blue-600 text-white"
                          : "text-gray-300 hover:bg-gray-800"
                      }`}
                    >
                      Done
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
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 
                ${
                  active
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-800 text-gray-300 hover:text-white"
                }`}
            >
              <Icon size={20} />
              {!collapsed && <span className="text-sm">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-800 px-4 py-3 text-xs text-gray-400">
        {!collapsed && <p>v1.0.0</p>}
      </div>
    </aside>
  );
};

export default SideNav;
