import { tmdbFetch } from "@/lib/tmdb";
import { NextResponse } from "next/server";

interface TMDBVideo {
  key: string;
  site: string;
  type: string;
  official?: boolean;
}

interface TMDBVideosResponse {
  results: TMDBVideo[];
}

const pickTrailer = (videos: TMDBVideo[]) => {
  const youtube = videos.filter((video) => video.site === "YouTube");
  const officialTrailer = youtube.find(
    (video) => video.type === "Trailer" && video.official,
  );
  if (officialTrailer) return officialTrailer;
  const trailer = youtube.find((video) => video.type === "Trailer");
  if (trailer) return trailer;
  const teaser = youtube.find((video) => video.type === "Teaser");
  if (teaser) return teaser;
  return youtube[0] ?? null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tmdbId = searchParams.get("tmdbId");
  const type = searchParams.get("type");

  if (!tmdbId || !type) {
    return NextResponse.json({ key: null });
  }

  const path = type === "TV" ? `/tv/${tmdbId}/videos` : `/movie/${tmdbId}/videos`;

  const fetchVideos = async (language: string) =>
    tmdbFetch<TMDBVideosResponse>(path, {
      params: {
        language,
      },
    });

  let data = await fetchVideos("pt-BR");
  let trailer = pickTrailer(data.results);

  if (!trailer) {
    data = await fetchVideos("en-US");
    trailer = pickTrailer(data.results);
  }

  return NextResponse.json({ key: trailer?.key ?? null });
}
