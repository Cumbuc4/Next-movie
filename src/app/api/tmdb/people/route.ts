import { tmdbFetch } from "@/lib/tmdb";
import { NextResponse } from "next/server";

interface TMDBPersonResult {
  results: Array<{
    id: number;
    name: string;
    profile_path?: string | null;
    popularity?: number;
    known_for?: Array<{
      title?: string;
      name?: string;
    }>;
  }>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json([]);
  }

  const data = await tmdbFetch<TMDBPersonResult>("/search/person", {
    params: {
      query,
      include_adult: false,
      language: "pt-BR",
      page: 1,
    },
  });

  const sorted = data.results
    .slice()
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));

  return NextResponse.json(
    sorted.map((person) => ({
      id: person.id,
      name: person.name,
      profilePath: person.profile_path ?? null,
      popularity: person.popularity ?? 0,
      knownFor:
        person.known_for
          ?.map((item) => item.title ?? item.name)
          .filter(Boolean) ?? [],
    })),
  );
}
