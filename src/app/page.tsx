import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <span className="rounded-full border border-neutral-700 px-3 py-1 text-sm font-medium uppercase tracking-wide text-neutral-300">
        Sua próxima sessão em dupla
      </span>
      <h1 className="text-4xl font-semibold sm:text-6xl">
        Crie listas, convide amigos e descubra o próximo filme ou série juntos.
      </h1>
      <p className="text-lg text-neutral-400">
        Next Movie combina a sua lista com a de um amigo e sorteia o que assistir agora. Integrado ao TMDB, com autenticação segura e histórico de escolhas.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-emerald-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
          href="/dashboard"
        >
          Entrar agora
        </Link>
        <Link
          className="rounded-lg border border-neutral-700 px-6 py-3 font-semibold text-neutral-100 transition hover:border-neutral-500"
          href="/list"
        >
          Explorar lista
        </Link>
      </div>
    </main>
  );
}
