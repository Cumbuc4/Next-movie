import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const Body = z.object({ partnerId: z.string().cuid() });

function serialize(item: {
  id: string;
  tmdbId: number;
  title: string;
  overview: string | null;
  type: "MOVIE" | "TV";
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: Date | null;
}) {
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

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { partnerId } = Body.parse(await request.json());

  if (partnerId === userId) {
    return new Response("Bad Request", { status: 400 });
  }

  const friendship = await db.friendship.findFirst({
    where: {
      OR: [
        { aId: userId, bId: partnerId },
        { aId: partnerId, bId: userId },
      ],
    },
  });

  if (!friendship) {
    return new Response("Forbidden", { status: 403 });
  }

  const [mine, theirs] = await Promise.all([
    db.listItem.findMany({ where: { ownerId: userId, watched: false, archived: false } }),
    db.listItem.findMany({ where: { ownerId: partnerId, watched: false, archived: false } }),
  ]);

  const pool = [...mine, ...theirs];
  if (pool.length === 0) {
    return Response.json({ message: "Listas vazias" });
  }

  const picked = pool[Math.floor(Math.random() * pool.length)];

  await db.sharedPickHistory.create({
    data: {
      pickerId: userId,
      partnerId,
      itemId: picked.id,
    },
  });

  return Response.json({ picked: serialize(picked) });
}
