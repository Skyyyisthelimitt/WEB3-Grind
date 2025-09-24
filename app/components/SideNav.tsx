'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-2 px-3 py-2 rounded-xl border transition-all
        ${active
          ? "bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 text-white border-violet-700/40 shadow-[0_8px_24px_-12px_rgba(168,85,247,.45)]"
          : "bg-zinc-900/60 text-zinc-300 border-zinc-800 hover:bg-zinc-900 hover:translate-x-[1px]"}
      `}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{children}</span>
      <span
        className={`ml-auto h-1.5 w-1.5 rounded-full transition-transform
          ${active ? "bg-violet-400 scale-100" : "bg-zinc-700 scale-0 group-hover:scale-75"}
        `}
      />
    </Link>
  );
}

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-black/50 border-r border-zinc-900 min-h-screen p-4">
      <div className="flex items-center gap-2 px-1">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center text-white font-semibold">
          ◇
        </div>
        <span className="font-semibold tracking-wide">NFT Manager</span>
      </div>

      <hr className="border-zinc-900 my-4" />

      <nav className="space-y-1">
        <NavLink href="/" icon="🏠">Dashboard</NavLink>
        <NavLink href="/whitelists" icon="📋">Whitelists</NavLink>
        <NavLink href="/collabs" icon="🤝">Collabs</NavLink>
      </nav>
    </aside>
  );
}
