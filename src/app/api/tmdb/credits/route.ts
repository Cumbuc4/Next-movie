import { tmdbFetch } from "@/lib/tmdb";
import { NextResponse } from "next/server";

interface TMDBCredits {
  cast: Array<{
    id: number;
    title?: string;
    name?: string;
    overview?: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
    media_type: "movie" | "tv";
    release_date?: string;
    first_air_date?: string;
    popularity?: number;
    genre_ids?: number[];
    vote_average?: number;
    vote_count?: number;
    character?: string;
  }>;
  crew: Array<{
    id: number;
    title?: string;
    name?: string;
    overview?: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
    media_type: "movie" | "tv";
    release_date?: string;
    first_air_date?: string;
    popularity?: number;
    genre_ids?: number[];
    vote_average?: number;
    vote_count?: number;
    job?: string;
  }>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const personId = searchParams.get("personId");

  if (!personId) {
    return NextResponse.json([]);
  }

  const credits = await tmdbFetch<TMDBCredits>(`/person/${personId}/combined_credits`, {
    params: {
      language: "pt-BR",
    },
  });

  const merged = [
    ...credits.cast.map((item) => ({
      id: item.id,
      title: item.title ?? item.name ?? "",
      overview: item.overview ?? "",
      posterPath: item.poster_path ?? null,
      backdropPath: item.backdrop_path ?? null,
      type: item.media_type.toUpperCase(),
      releaseDate: item.release_date ?? item.first_air_date ?? null,
      popularity: item.popularity ?? 0,
      genreIds: item.genre_ids ?? [],
      voteAverage: item.vote_average ?? 0,
      voteCount: item.vote_count ?? 0,
      character: item.character ?? null,
      job: null,
    })),
    ...credits.crew.map((item) => ({
      id: item.id,
      title: item.title ?? item.name ?? "",
      overview: item.overview ?? "",
      posterPath: item.poster_path ?? null,
      backdropPath: item.backdrop_path ?? null,
      type: item.media_type.toUpperCase(),
      releaseDate: item.release_date ?? item.first_air_date ?? null,
      popularity: item.popularity ?? 0,
      genreIds: item.genre_ids ?? [],
      voteAverage: item.vote_average ?? 0,
      voteCount: item.vote_count ?? 0,
      character: null,
      job: item.job ?? null,
    })),
  ];

  const unique = new Map<string, (typeof merged)[number]>();
  for (const entry of merged) {
    const key = `${entry.type}-${entry.id}`;
    if (!unique.has(key)) {
      unique.set(key, entry);
    }
  }

  const sorted = Array.from(unique.values()).sort(
    (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0),
  );

  return NextResponse.json(sorted);
}
