"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/search", label: "Buscar" },
  { href: "/list", label: "Minha lista" },
  { href: "/friends", label: "Amigos" },
  { href: "/profile", label: "Perfil" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-white/10 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="hidden lg:flex items-center justify-between gap-4 py-4">
          <Link
            href="/dashboard"
            className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-100"
          >
            Time2Watch
          </Link>
          <div className="flex justify-end gap-2">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(`${link.href}/`));

              const baseClasses =
                "whitespace-nowrap rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950";
              const activeClasses =
                "bg-emerald-400 text-emerald-950 shadow shadow-emerald-500/40";
              const inactiveClasses =
                "text-neutral-300 hover:bg-neutral-900 hover:text-neutral-50";

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 py-3 lg:hidden">
          <Link
            href="/dashboard"
            className="text-left text-xs font-semibold uppercase tracking-[0.3em] text-neutral-100"
          >
            Time2Watch
          </Link>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(`${link.href}/`));

              const baseClasses =
                "whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950";
              const activeClasses =
                "bg-emerald-400 text-emerald-950 shadow shadow-emerald-500/40";
              const inactiveClasses =
                "text-neutral-300 hover:bg-neutral-900 hover:text-neutral-50";

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

