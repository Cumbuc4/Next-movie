import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ListSearch } from "./search-client";

export default async function ListPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      items: { orderBy: { addedAt: "desc" } },
      pickHistory: { orderBy: { pickedAt: "desc" }, take: 5, include: { item: true } },
      sharedPickHistory: {
        orderBy: { pickedAt: "desc" },
        take: 5,
        include: { item: true, partner: true },
      },
    },
  });

  if (!user) {
    redirect("/api/auth/signout?callbackUrl=/login?error=session");
  }

  const activeItems = user.items.filter((item) => !item.archived);
  const listItems = activeItems.filter((item) => !item.watched);
  const movieCount = listItems.filter((item) => item.type === "MOVIE").length;
  const tvCount = listItems.filter((item) => item.type === "TV").length;
  const watchedCount = activeItems.filter((item) => item.watched).length;

  const items = user.items.map((item) => ({
    id: item.id,
    tmdbId: item.tmdbId,
    title: item.title,
    overview: item.overview,
    type: item.type,
    posterPath: item.posterPath,
    backdropPath: item.backdropPath,
    releaseDate: item.releaseDate?.toISOString() ?? null,
    watched: item.watched,
    archived: item.archived,
  }));

  const summary = [
    { label: "Títulos", value: listItems.length },
    { label: "Filmes", value: movieCount },
    { label: "Séries", value: tvCount },
    { label: "Assistidos", value: watchedCount },
  ];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <header className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr] lg:items-end">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
            Biblioteca pessoal
          </p>
          <h1 className="text-3xl font-semibold">Minha lista</h1>
          <p className="max-w-2xl text-neutral-400">
            Organize seus títulos, marque assistidos e acompanhe seu histórico.
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-neutral-950/70 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Resumo rápido</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summary.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-neutral-950/80 p-4">
                <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-neutral-100">{stat.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-neutral-500">
            Dica: busque por atores para descobrir novos títulos.
          </p>
        </div>
      </header>
      <ListSearch initialItems={items} showSearch={false} />
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-neutral-950/70 p-6">
          <h2 className="text-xl font-semibold">Histórico individual</h2>
          <ul className="mt-4 space-y-3 text-sm text-neutral-400">
            {user.pickHistory.map((entry) => (
              <li key={entry.id}>
                <span className="font-medium text-neutral-100">{entry.item.title}</span> em{" "}
                {entry.pickedAt.toLocaleDateString("pt-BR")}
              </li>
            ))}
            {user.pickHistory.length === 0 && <li>Ainda sem sorteios.</li>}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-neutral-950/70 p-6">
          <h2 className="text-xl font-semibold">Histórico em dupla</h2>
          <ul className="mt-4 space-y-3 text-sm text-neutral-400">
            {user.sharedPickHistory.map((entry) => (
              <li key={entry.id}>
                Você e {entry.partner.name ?? entry.partner.username} sortearam
                <span className="font-medium text-neutral-100"> {entry.item.title}</span> em{" "}
                {entry.pickedAt.toLocaleDateString("pt-BR")}
              </li>
            ))}
            {user.sharedPickHistory.length === 0 && <li>Ainda sem sorteios em dupla.</li>}
          </ul>
        </div>
      </section>
    </main>
  );
}
