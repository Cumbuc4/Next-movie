import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function serialize(item: { id: string; tmdbId: number; title: string; overview: string | null; type: "MOVIE" | "TV"; posterPath: string | null; backdropPath: string | null; releaseDate: Date | null }) {
  return {
    id: item.id,
    tmdbId: item.tmdbId,
    title: item.title,
    overview: item.overview,
    type: item.type,
    posterPath: item.posterPath,
    backdropPath: item.backdropPath,
    releaseDate: item.releaseDate?.toISOString() ?? null,
  };
}

export async function POST() {
  const session = await auth();
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await db.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const items = await db.listItem.findMany({
    where: { ownerId: user.id, watched: false },
  });

  if (items.length === 0) {
    return Response.json({ message: "Lista vazia" });
  }

  const picked = items[Math.floor(Math.random() * items.length)];

  await db.pickHistory.create({
    data: {
      ownerId: user.id,
      itemId: picked.id,
    },
  });

  return Response.json({ picked: serialize(picked) });
}
