import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ListSearch } from "./search-client";

export default async function ListPage() {
  const session = await auth();
  const userEmail = session?.user?.email;

  if (!userEmail) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { email: userEmail },
    include: {
      items: {
        orderBy: { addedAt: "desc" },
      },
    },
  });

  if (!user) {
    redirect("/login");
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
  }));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold">Sua lista</h1>
        <p className="text-neutral-400">
          Busque títulos no catálogo da TMDB e adicione à sua lista pessoal para sortear depois.
        </p>
      </header>
      <ListSearch initialItems={items} />
    </main>
  );
}
