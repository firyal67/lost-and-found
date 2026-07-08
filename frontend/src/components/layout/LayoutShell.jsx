"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

export default function LayoutShell({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");

  return (
    <div className="flex flex-col min-h-screen">
      {!isAuthPage && <Header />}
      <main className="flex-1">{children}</main>
      {!isAuthPage && <Footer />}
    </div>
  );
}
