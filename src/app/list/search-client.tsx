"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { MouseEvent } from "react";

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
  popularity: number;
};

const DEFAULT_TMDB_IMG_BASE = "https://image.tmdb.org/t/p";

export function ListSearch({ initialItems }: { initialItems: ListItem[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [items, setItems] = useState<ListItem[]>(initialItems);
  const [status, setStatus] = useState<string | null>(null);
  const [isSearching, startSearching] = useTransition();
  const [isAdding, startAdding] = useTransition();
  const [isRemoving, startRemoving] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const pageSize = 10;

  const tmdbImageBase = useMemo(
    () => process.env.NEXT_PUBLIC_TMDB_IMG_BASE ?? DEFAULT_TMDB_IMG_BASE,
    [],
  );

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(items.length / pageSize) - 1);
    setCurrentPage((prev) => Math.min(prev, maxPage));
  }, [items.length]);

  const totalPages = Math.max(1, Math.ceil(Math.max(items.length, 1) / pageSize));
  const expandedResult =
    expandedId !== null ? results.find((candidate) => candidate.id === expandedId) ?? null : null;
  const expandedAlreadyInList = expandedResult
    ? items.some(
        (item) => item.tmdbId === expandedResult.id && item.type === expandedResult.type,
      )
    : false;

  const toggleExpanded = (id: number) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const handleAdd = (event: MouseEvent<HTMLButtonElement>, result: SearchResult) => {
    event.stopPropagation();
    if (isAdding) return;

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
        setStatus("Nao foi possivel adicionar");
        return;
      }

      const item = (await res.json()) as ListItem;
      setItems((previous) => [item, ...previous]);
      setCurrentPage(0);
      setStatus(`Adicionado ${result.title}`);
    });
  };

  const handleRemove = (itemId: string, title: string) => {
    setRemovingId(itemId);
    startRemoving(async () => {
      try {
        setStatus(null);
        const res = await fetch("/api/list/remove", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ itemId }),
        });

        if (!res.ok) {
          setStatus("Nao foi possivel remover");
          return;
        }

        setItems((previous) => {
          const updated = previous.filter((candidate) => candidate.id !== itemId);
          const maxPage = Math.max(0, Math.ceil(updated.length / pageSize) - 1);
          setCurrentPage((prev) => Math.min(prev, maxPage));
          return updated;
        });
        setStatus(`Removido ${title}`);
      } finally {
        setRemovingId(null);
      }
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
      <section className="space-y-6">
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
              setExpandedId(null);
            });
          }}
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar filmes ou series"
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
        {status && <p className="text-sm text-neutral-300">{status}</p>}

        <ul className="grid gap-4 sm:grid-cols-2">
          {results.map((result) => {
            const alreadyAdded = items.some(
              (item) => item.tmdbId === result.id && item.type === result.type,
            );
            const displayImage = result.backdropPath
              ? `${tmdbImageBase}/w780${result.backdropPath}`
              : result.posterPath
              ? `${tmdbImageBase}/w342${result.posterPath}`
              : null;

            return (
              <li
                key={`${result.type}-${result.id}`}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/70 shadow-sm transition hover:border-emerald-500/60 hover:shadow-lg"
                onClick={() => toggleExpanded(result.id)}
              >
                <div className="relative h-44 w-full">
                  {displayImage ? (
                    <Image
                      src={displayImage}
                      alt={`Imagem de ${result.title}`}
                      fill
                      sizes="(min-width: 1024px) 380px, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-xs text-neutral-500">
                      Sem imagem
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                </div>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-neutral-400">
                      <span className="rounded-full border border-neutral-700 px-2 py-0.5">
                        {result.type === "MOVIE" ? "Filme" : "Serie"}
                      </span>
                      {result.releaseDate && (
                        <span>{new Date(result.releaseDate).getFullYear()}</span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-50">{result.title}</h3>
                    <p className="line-clamp-3 text-sm text-neutral-400">{result.overview}</p>
                  </div>

                  <button
                    type="button"
                    className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-md border border-neutral-700 px-3 py-2 text-sm font-medium text-neutral-100 transition hover:border-emerald-400 hover:text-emerald-300 disabled:opacity-60"
                    disabled={alreadyAdded || isAdding}
                    onClick={(event) => handleAdd(event, result)}
                  >
                    {alreadyAdded ? "Ja esta na lista" : "Adicionar a lista"}
                  </button>
                </div>
              </li>
            );
          })}

          {results.length === 0 && <p className="text-neutral-500">Pesquise titulos para adicionar.</p>}
        </ul>
      </section>

      <aside className="space-y-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-100">
            Minha lista <span className="text-sm text-neutral-500">({items.length})</span>
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            Gerencie rapidamente os titulos que voce ja adicionou.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {items
              .slice(currentPage * pageSize, currentPage * pageSize + pageSize)
              .map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2"
              >
                <span className="flex-1 truncate text-neutral-200" title={item.title}>
                  {item.title}
                </span>
                <button
                  type="button"
                  className="rounded-md border border-red-500/40 px-2 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-500/10 hover:text-red-200 disabled:opacity-60"
                  disabled={isRemoving && removingId === item.id}
                  onClick={() => handleRemove(item.id, item.title)}
                >
                  {isRemoving && removingId === item.id ? "Removendo..." : "Remover"}
                </button>
              </li>
            ))}
            {items.length === 0 && <li className="text-neutral-500">Nenhum item adicionado ainda.</li>}
          </ul>
          {items.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
              <button
                type="button"
                className="rounded-md border border-neutral-800 px-2 py-1 transition hover:border-neutral-600 hover:text-neutral-200 disabled:opacity-50"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                disabled={currentPage === 0}
              >
                Pagina anterior
              </button>
              <span>
                Pagina {currentPage + 1} de {totalPages}
              </span>
              <button
                type="button"
                className="rounded-md border border-neutral-800 px-2 py-1 transition hover:border-neutral-600 hover:text-neutral-200 disabled:opacity-50"
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, totalPages - 1),
                  )
                }
                disabled={currentPage >= totalPages - 1}
              >
                Proxima pagina
              </button>
            </div>
          )}
        </div>
      </aside>
      {expandedResult && (
        <ExpandedOverlay
          result={expandedResult}
          tmdbImageBase={tmdbImageBase}
          isAdding={isAdding}
          isInList={expandedAlreadyInList}
          onAdd={handleAdd}
          onClose={() => setExpandedId(null)}
        />
      )}
    </div>
  );
}

type ExpandedOverlayProps = {
  result: SearchResult | null;
  tmdbImageBase: string;
  isAdding: boolean;
  onClose: () => void;
  onAdd: (event: MouseEvent<HTMLButtonElement>, result: SearchResult) => void;
  isInList: boolean;
};

function ExpandedOverlay({
  result,
  tmdbImageBase,
  isAdding,
  onClose,
  onAdd,
  isInList,
}: ExpandedOverlayProps) {
  if (!result) {
    return null;
  }

  const displayImage = result.backdropPath
    ? `${tmdbImageBase}/w1280${result.backdropPath}`
    : result.posterPath
    ? `${tmdbImageBase}/w780${result.posterPath}`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-950 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        style={{ maxHeight: "90vh" }}
      >
        <button
          type="button"
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-black/60 text-lg text-white transition hover:bg-black/80"
          onClick={onClose}
          aria-label="Fechar detalhes"
        >
          x
        </button>
        <div className="relative h-56 w-full">
          {displayImage ? (
            <Image
              src={displayImage}
              alt={`Imagem de ${result.title}`}
              fill
              sizes="(min-width: 1024px) 768px, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-sm text-neutral-500">
              Sem imagem
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        </div>

        <div className="space-y-4 overflow-y-auto p-6">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-neutral-400">
            <span className="rounded-full border border-neutral-700 px-2 py-0.5">
              {result.type === "MOVIE" ? "Filme" : "Serie"}
            </span>
            {result.releaseDate && (
              <span>Lancamento: {new Date(result.releaseDate).toLocaleDateString("pt-BR")}</span>
            )}
            <span>Popularidade: {Math.round(result.popularity)}</span>
          </div>
          <h3 className="text-2xl font-semibold text-neutral-50">{result.title}</h3>
          <p className="text-sm leading-relaxed text-neutral-300">{result.overview}</p>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              className="rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 transition hover:border-neutral-500 hover:text-neutral-100"
              onClick={onClose}
            >
              Fechar
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400 hover:text-emerald-200 disabled:opacity-60"
              disabled={isInList || isAdding}
              onClick={(event) => onAdd(event, result)}
            >
              {isInList ? "Ja esta na lista" : isAdding ? "Adicionando..." : "Adicionar a lista"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}








