"use client";

import { useState, useTransition } from "react";

type ListItem = {
  id: string;
  tmdbId: number;
  title: string;
  overview: string | null;
  type: "MOVIE" | "TV";
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
};

type SearchResult = {
  id: number;
  title: string;
  overview: string;
  posterPath: string;
  backdropPath: string;
  type: "MOVIE" | "TV";
  releaseDate: string | null;
};

export function ListSearch({ initialItems }: { initialItems: ListItem[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [items, setItems] = useState<ListItem[]>(initialItems);
  const [status, setStatus] = useState<string | null>(null);
  const [isSearching, startSearching] = useTransition();
  const [isAdding, startAdding] = useTransition();

  return (
    <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
      <section className="space-y-4">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!query) return;
            startSearching(async () => {
              setStatus(null);
              const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}`);
              if (!res.ok) {
                setStatus("Falha na busca");
                return;
              }
              const data = (await res.json()) as SearchResult[];
              setResults(data);
            });
          }}
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar filmes ou séries"
            className="flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400"
            disabled={isSearching}
          >
            {isSearching ? "Buscando..." : "Buscar"}
          </button>
        </form>
        {status && <p className="text-sm text-red-400">{status}</p>}
        <ul className="space-y-4">
          {results.map((result) => {
            const alreadyAdded = items.some((item) => item.tmdbId === result.id && item.type === result.type);
            return (
              <li key={`${result.type}-${result.id}`} className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
                <h3 className="text-lg font-semibold">{result.title}</h3>
                <p className="text-sm text-neutral-400">{result.overview}</p>
                <button
                  className="mt-3 rounded-md border border-neutral-700 px-3 py-2 text-sm hover:border-emerald-400 disabled:opacity-60"
                  disabled={alreadyAdded || isAdding}
                  onClick={() => {
                    startAdding(async () => {
                      setStatus(null);
                      const res = await fetch("/api/list/add", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          tmdbId: result.id,
                          type: result.type,
                          title: result.title,
                          overview: result.overview,
                          posterPath: result.posterPath,
                          backdropPath: result.backdropPath,
                          releaseDate: result.releaseDate,
                        }),
                      });
                      if (!res.ok) {
                        setStatus("Não foi possível adicionar");
                        return;
                      }
                      const item = (await res.json()) as ListItem;
                      setItems((previous) => [item, ...previous]);
                      setStatus(`Adicionado ${result.title}`);
                    });
                  }}
                >
                  {alreadyAdded ? "Já está na lista" : "Adicionar"}
                </button>
              </li>
            );
          })}
          {results.length === 0 && <p className="text-neutral-500">Pesquise títulos para adicionar.</p>}
        </ul>
      </section>
      <aside className="space-y-3">
        <h2 className="text-lg font-semibold">Itens recentes</h2>
        <ul className="space-y-2 text-sm text-neutral-400">
          {items.slice(0, 10).map((item) => (
            <li key={item.id}>
              {item.title} — {item.type === "MOVIE" ? "Filme" : "Série"}
            </li>
          ))}
          {items.length === 0 && <li>Nenhum item adicionado ainda.</li>}
        </ul>
      </aside>
    </div>
  );
}
