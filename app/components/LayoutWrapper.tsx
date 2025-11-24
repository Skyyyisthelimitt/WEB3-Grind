"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./SideNav";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}

