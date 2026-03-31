"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/",         label: "Rankings" },
  { href: "/matches",  label: "Record Match" },
  { href: "/history",  label: "History" },
  { href: "/settings", label: "Players" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-brand-700 shadow-md">
      <div className="container mx-auto max-w-4xl px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg tracking-tight">
          <span className="text-2xl">🏸</span>
          <span className="hidden sm:inline">Badminton Scores</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-white text-brand-700"
                    : "text-brand-100 hover:bg-brand-600 hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
