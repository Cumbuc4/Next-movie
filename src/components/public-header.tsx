"use client";

export function PublicHeader() {
  return (
    <header className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center px-6 py-4">
        <span className="text-base font-semibold uppercase tracking-wide text-neutral-100">
          Next Movie
        </span>
      </div>
    </header>
  );
}
