"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/list", label: "Minha lista" },
];

const HISTORY_KEY = "site-nav-history";

export function SiteNav() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.sessionStorage.getItem(HISTORY_KEY);
    const history = stored ? (JSON.parse(stored) as string[]) : [];
    if (history[history.length - 1] !== pathname) {
      const nextHistory = [...history, pathname].slice(-20);
      window.sessionStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
    }
  }, [pathname]);

  const handleBack = () => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.sessionStorage.getItem(HISTORY_KEY);
    const history = stored ? (JSON.parse(stored) as string[]) : [];
    if (history.length === 0) {
      router.push("/dashboard");
      return;
    }

    const current = history.pop();
    void current;
    let target = history.pop() ?? "/dashboard";

    if (target === "/" || target === "/login") {
      target = "/dashboard";
    }

    window.sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    router.push(target);
  };

  return (
    <nav className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-4">
        <div className="flex justify-start">
          <button
            type="button"
            onClick={handleBack}
            className="rounded-md border border-neutral-700 px-3 py-1 text-sm font-medium text-neutral-300 transition hover:border-neutral-500 hover:bg-neutral-900 hover:text-neutral-50"
          >
            Voltar
          </button>
        </div>
        <div className="flex justify-center">
          <span className="text-base font-semibold uppercase tracking-wide text-neutral-100">
            Next Movie
          </span>
        </div>
        <div className="flex justify-end gap-2">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(`${link.href}/`));

            const baseClasses =
              "rounded-md px-3 py-1 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950";
            const activeClasses =
              "bg-emerald-500 text-emerald-950 shadow shadow-emerald-500/40";
            const inactiveClasses =
              "text-neutral-300 hover:bg-neutral-900 hover:text-neutral-50";

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${baseClasses} ${
                  isActive ? activeClasses : inactiveClasses
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
