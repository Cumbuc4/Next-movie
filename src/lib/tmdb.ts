const TMDB_API_BASE = process.env.TMDB_API_BASE ?? "https://api.themoviedb.org/3";
const TMDB_IMG_BASE = process.env.TMDB_IMG_BASE ?? "https://image.tmdb.org/t/p";

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function tmdbFetch<T>(path: string, { params, ...init }: FetchOptions = {}): Promise<T> {
  const url = new URL(path, TMDB_API_BASE);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url, {
    ...init,
    headers: {
      accept: "application/json",
      authorization: `Bearer ${process.env.TMDB_API_KEY ?? ""}`,
      ...init?.headers,
    },
    next: { revalidate: 60 * 60 },
  });

  if (!res.ok) {
    throw new Error(`TMDB request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function tmdbImage(path: string, size: "w500" | "original" = "w500") {
  return `${TMDB_IMG_BASE}/${size}${path}`;
}
