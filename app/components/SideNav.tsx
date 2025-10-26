"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const [collapsed, setCollapsed] = useState(false);

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/whitelists", label: "Whitelists", icon: ClipboardList },
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
