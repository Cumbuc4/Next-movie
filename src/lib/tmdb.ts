const TMDB_API_BASE = process.env.TMDB_API_BASE ?? "https://api.themoviedb.org/3";
const TMDB_IMG_BASE = process.env.TMDB_IMG_BASE ?? "https://image.tmdb.org/t/p";

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function tmdbFetch<T>(path: string, { params, ...init }: FetchOptions = {}): Promise<T> {
  const normalizedBase = TMDB_API_BASE.endsWith("/") ? TMDB_API_BASE : `${TMDB_API_BASE}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(normalizedPath, normalizedBase);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (apiKey && !apiKey.startsWith("eyJ")) {
    // TMDB v3 API key (32 hex chars) must be sent as query parameter
    url.searchParams.set("api_key", apiKey);
  }

  const requestUrl = url.toString();
  const requestHeaders =
    apiKey && apiKey.startsWith("eyJ") ? { authorization: `Bearer ${apiKey}` } : undefined;

  const res = await fetch(requestUrl, {
    ...init,
    headers: {
      accept: "application/json",
      ...requestHeaders,
      ...init?.headers,
    },
    next: { revalidate: 60 * 60 },
  });

  if (!res.ok) {
    const safeUrl = new URL(requestUrl);
    safeUrl.searchParams.delete("api_key");
    throw new Error(`TMDB request failed: ${res.status} - ${safeUrl.toString()}`);
  }

  return res.json() as Promise<T>;
}

export function tmdbImage(path: string, size: "w500" | "original" = "w500") {
  return `${TMDB_IMG_BASE}/${size}${path}`;
}
