import Link from "next/link";

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute right-10 top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-[140px]" />
      </div>
      <div className="relative mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-6xl flex-col items-center justify-center gap-12 px-6 py-16 text-center lg:grid lg:grid-cols-[1.1fr,0.9fr] lg:text-left">
        <section className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-300">
            Sua próxima sessão em dupla
          </span>
          <h1 className="font-display text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            Sua lista, seu parceiro, um sorteio perfeito.
          </h1>
          <p className="text-base text-neutral-300 sm:text-lg">
            Monte listas inteligentes, convide amigos e descubra o próximo filme ou série com uma experiência leve, bonita e feita para compartilhar.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
            <Link
              className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-300"
              href="/dashboard"
            >
              Entrar agora
            </Link>
            <Link
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-neutral-100 transition hover:border-white/30"
              href="/register"
            >
              Criar conta
            </Link>
          </div>
        </section>

        <section className="w-full rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-900/70 via-neutral-950/80 to-neutral-900/60 p-6 shadow-2xl shadow-emerald-500/10">
          <div className="grid gap-5 text-left">
            <div className="rounded-2xl border border-white/10 bg-neutral-950/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-400">
                Mix perfeito
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-white">
                Combine listas e sorteie juntos.
              </h2>
              <p className="mt-3 text-sm text-neutral-400">
                Unifique suas escolhas, crie um carrossel com os títulos favoritos e descubra algo novo em poucos cliques.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-neutral-950/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-400">
                  Descoberta
                </p>
                <p className="mt-2 text-sm text-neutral-300">
                  Sugestões inteligentes com base no que você digita.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-neutral-950/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-400">
                  Compartilhe
                </p>
                <p className="mt-2 text-sm text-neutral-300">
                  Conteúdos prontos para enviar para seus amigos.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
