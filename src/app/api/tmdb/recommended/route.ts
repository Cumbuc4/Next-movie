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
    media_type: "movie" | "tv" | "person";
    release_date?: string;
    first_air_date?: string;
    popularity?: number;
    genre_ids?: number[];
    vote_average?: number;
    vote_count?: number;
  }>;
}

interface TMDBDiscoverResult {
  results: Array<{
    id: number;
    title?: string;
    name?: string;
    overview?: string;
    poster_path?: string;
    backdrop_path?: string;
    release_date?: string;
    first_air_date?: string;
    popularity?: number;
    genre_ids?: number[];
    vote_average?: number;
    vote_count?: number;
  }>;
}

interface TMDBKeywordResult {
  results: Array<{ id: number; name: string }>;
}

type MappedResult = {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  type: "MOVIE" | "TV";
  releaseDate: string | null;
  popularity: number;
  genreIds: number[];
  voteAverage: number;
  voteCount: number;
};

const mapResults = (
  results: TMDBSearchResult["results"],
  typeOverride?: "MOVIE" | "TV",
): MappedResult[] =>
  results.map((item) => ({
    id: item.id,
    title: item.title ?? item.name ?? "",
    overview: item.overview ?? "",
    posterPath: item.poster_path ?? null,
    backdropPath: item.backdrop_path ?? null,
    type: typeOverride ?? (item.media_type.toUpperCase() as "MOVIE" | "TV"),
    releaseDate: item.release_date ?? item.first_air_date ?? null,
    popularity: item.popularity ?? 0,
    genreIds: item.genre_ids ?? [],
    voteAverage: item.vote_average ?? 0,
    voteCount: item.vote_count ?? 0,
  }));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  if (query) {
    const search = await tmdbFetch<TMDBSearchResult>("/search/multi", {
      params: {
        query,
        include_adult: false,
        language: "pt-BR",
        page,
      },
    });

    const filtered = search.results.filter(
      (item) => item.media_type === "movie" || item.media_type === "tv",
    );

    if (filtered.length > 0) {
      const sorted = filtered.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
      return NextResponse.json(mapResults(sorted));
    }

    const keywordData = await tmdbFetch<TMDBKeywordResult>("/search/keyword", {
      params: {
        query,
        page: 1,
      },
    });
    const keywordId = keywordData.results[0]?.id;

    if (keywordId) {
      const [movies, tv] = await Promise.all([
        tmdbFetch<TMDBDiscoverResult>("/discover/movie", {
          params: {
            language: "pt-BR",
            page,
            include_adult: false,
            sort_by: "popularity.desc",
            with_keywords: keywordId,
          },
        }),
        tmdbFetch<TMDBDiscoverResult>("/discover/tv", {
          params: {
            language: "pt-BR",
            page,
            sort_by: "popularity.desc",
            with_keywords: keywordId,
          },
        }),
      ]);

      const merged: TMDBSearchResult["results"] = [
        ...movies.results.map((item) => ({
          ...item,
          media_type: "movie" as const,
        })),
        ...tv.results.map((item) => ({
          ...item,
          media_type: "tv" as const,
        })),
      ];

      if (merged.length > 0) {
        const sorted = merged.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
        return NextResponse.json(mapResults(sorted));
      }
    }
  }

  const trending = await tmdbFetch<TMDBSearchResult>("/trending/all/week", {
    params: {
      language: "pt-BR",
      page,
    },
  });

  const filtered = trending.results.filter(
    (item) => item.media_type === "movie" || item.media_type === "tv",
  );
  const sorted = filtered.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));

  return NextResponse.json(mapResults(sorted));
}
