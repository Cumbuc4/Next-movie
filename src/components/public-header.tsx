"use client";

import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="border-b border-white/10 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.7)]" />
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-100">
            Time2Watch
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full border border-neutral-800 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-300 transition hover:border-neutral-500 hover:text-neutral-100"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-300"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </header>
  );
}

