import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const BodySchema = z.object({
  tmdbId: z.number(),
  type: z.enum(["MOVIE", "TV"]),
  title: z.string(),
  overview: z.string().optional(),
  posterPath: z.string().optional(),
  backdropPath: z.string().optional(),
  releaseDate: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = BodySchema.parse(await request.json());

  const item = await db.listItem.upsert({
    where: {
      ownerId_tmdbId_type: {
        ownerId: userId,
        tmdbId: body.tmdbId,
        type: body.type,
      },
    },
    create: {
      ownerId: userId,
      tmdbId: body.tmdbId,
      type: body.type,
      title: body.title,
      overview: body.overview,
      posterPath: body.posterPath,
      backdropPath: body.backdropPath,
      releaseDate: body.releaseDate ? new Date(body.releaseDate) : undefined,
    },
    update: {
      title: body.title,
      overview: body.overview,
      posterPath: body.posterPath,
      backdropPath: body.backdropPath,
      releaseDate: body.releaseDate ? new Date(body.releaseDate) : undefined,
    },
  });

  const payload = {
    id: item.id,
    tmdbId: item.tmdbId,
    title: item.title,
    overview: item.overview,
    type: item.type,
    posterPath: item.posterPath,
    backdropPath: item.backdropPath,
    releaseDate: item.releaseDate?.toISOString() ?? null,
  };

  return Response.json(payload, { status: 201 });
}
