"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSport, getTournament } from "@/lib/storage";

const NAV_LINKS = [
  { href: "/",          label: "Rankings" },
  { href: "/schedule",  label: "Schedule" },
  { href: "/tournament",label: "Tournament" },
  { href: "/history",   label: "History" },
  { href: "/settings",  label: "Players" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [sport, setSport] = useState("Scores");
  const [hasTournament, setHasTournament] = useState(false);

  useEffect(() => {
    const s = getSport();
    if (s) setSport(s);
    const t = getTournament();
    setHasTournament(!!t);
  }, [pathname]); // re-check on route change

  return (
    <nav className="bg-brand-700 shadow-md">
      <div className="container mx-auto max-w-5xl px-4 flex items-center justify-between h-14 gap-2">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-white font-bold text-lg tracking-tight flex-shrink-0"
        >
          <span className="text-2xl">🏆</span>
          <span className="hidden sm:inline truncate max-w-[160px]">{sport}</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href;
            const isTournament = href === "/tournament";
            return (
              <Link
                key={href}
                href={href}
                className={`relative px-2.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? "bg-white text-brand-700"
                    : "text-brand-100 hover:bg-brand-600 hover:text-white"
                }`}
              >
                {label}
                {isTournament && hasTournament && !active && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
