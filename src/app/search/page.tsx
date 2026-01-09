import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ListSearch } from "../list/search-client";

export default async function SearchPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      items: { orderBy: { addedAt: "desc" } },
    },
  });

  if (!user) {
    redirect("/api/auth/signout?callbackUrl=/login?error=session");
  }

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

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <header className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr] lg:items-end">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
            Buscar
          </p>
          <h1 className="text-3xl font-semibold">Explore o catálogo</h1>
          <p className="max-w-2xl text-neutral-400">
            Procure filmes, séries e atores para adicionar à sua lista.
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-neutral-950/70 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Dica</p>
          <p className="mt-2 text-sm text-neutral-300">
            Use filtros para encontrar títulos por gênero, tipo e popularidade.
          </p>
        </div>
      </header>

      <ListSearch initialItems={items} showList={false} />
    </main>
  );
}
