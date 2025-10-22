import { tmdbFetch } from "@/lib/tmdb";
import { NextResponse } from "next/server";

interface TMDBSearchResult {
  results: Array<{
    id: number;
    title?: string;
    name?: string;
    overview?: string;
    poster_path?: string;
    backdrop_path?: string;
    media_type: "movie" | "tv";
    release_date?: string;
    first_air_date?: string;
    popularity?: number;
  }>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const data = await tmdbFetch<TMDBSearchResult>("/search/multi", {
    params: {
      query,
      include_adult: false,
      language: "pt-BR",
      page: 1,
    },
  });

  const filtered = data.results.filter((item) => item.media_type === "movie" || item.media_type === "tv");
  const sorted = filtered.sort(
    (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0),
  );

  return NextResponse.json(
    sorted.map((item) => ({
      id: item.id,
      title: item.title ?? item.name ?? "",
      overview: item.overview ?? "",
      posterPath: item.poster_path ?? "",
      backdropPath: item.backdrop_path ?? "",
      type: item.media_type.toUpperCase(),
      releaseDate: item.release_date ?? item.first_air_date ?? null,
      popularity: item.popularity ?? 0,
    })),
  );
}
