import { tmdbFetch } from "@/lib/tmdb";
import { NextResponse } from "next/server";

type GenreResponse = { genres: Array<{ id: number; name: string }> };

export async function GET() {
  const [movie, tv] = await Promise.all([
    tmdbFetch<GenreResponse>("/genre/movie/list", { params: { language: "pt-BR" } }),
    tmdbFetch<GenreResponse>("/genre/tv/list", { params: { language: "pt-BR" } }),
  ]);

  const merged = [...movie.genres, ...tv.genres];
  const unique = new Map<number, string>();
  for (const genre of merged) {
    if (!unique.has(genre.id)) {
      unique.set(genre.id, genre.name);
    }
  }

  const all = Array.from(unique.entries()).map(([id, name]) => ({ id, name }));

  return NextResponse.json({ movie: movie.genres, tv: tv.genres, all });
}
