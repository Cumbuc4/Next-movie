
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { PickResultModal, PickedItem } from "@/components/pick-result-modal";

type ListItem = {
  id: string;
  tmdbId: number;
  title: string;
  overview: string | null;
  type: "MOVIE" | "TV";
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  watched: boolean;
  archived: boolean;
};

type SearchResult = {
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
  character?: string | null;
  job?: string | null;
};

type PersonResult = {
  id: number;
  name: string;
  profilePath: string | null;
  popularity: number;
  knownFor: string[];
};

type GenreOption = {
  id: number;
  name: string;
};

const DEFAULT_TMDB_IMG_BASE = "https://image.tmdb.org/t/p";

type SearchMode = "titles" | "actors";
type SortMode = "popularity" | "release" | "title";

type Filters = {
  type: "ALL" | "MOVIE" | "TV";
  sortBy: SortMode;
  genre: number | "ALL";
};

type ListSearchProps = {
  initialItems: ListItem[];
  showSearch?: boolean;
  showList?: boolean;
};

export function ListSearch({
  initialItems,
  showSearch = true,
  showList = true,
}: ListSearchProps) {
  const router = useRouter();
  const [searchMode, setSearchMode] = useState<SearchMode>("titles");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recommended, setRecommended] = useState<SearchResult[]>([]);
  const [recommendedStatus, setRecommendedStatus] = useState<string | null>(null);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);
  const [recommendedPage, setRecommendedPage] = useState(0);
  const [recommendedHasMore, setRecommendedHasMore] = useState(true);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const [actorQuery, setActorQuery] = useState("");
  const [actorResults, setActorResults] = useState<PersonResult[]>([]);
  const [actorSuggestions, setActorSuggestions] = useState<PersonResult[]>([]);
  const [actorSuggestionsOpen, setActorSuggestionsOpen] = useState(false);
  const [selectedActor, setSelectedActor] = useState<PersonResult | null>(null);
  const [actorCredits, setActorCredits] = useState<SearchResult[]>([]);

  const [items, setItems] = useState<ListItem[]>(initialItems);
  const [listQuery, setListQuery] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [actorStatus, setActorStatus] = useState<string | null>(null);
  const [isSearching, startSearching] = useTransition();
  const [isAdding, startAdding] = useTransition();
  const [isRemoving, startRemoving] = useTransition();
  const [isToggling, startToggling] = useTransition();
  const [hasSearchedTitles, setHasSearchedTitles] = useState(false);
  const [hasSearchedActors, setHasSearchedActors] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [genres, setGenres] = useState<GenreOption[]>([]);
  const [previewItem, setPreviewItem] = useState<PickedItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    type: "ALL",
    sortBy: "popularity",
    genre: "ALL",
  });

  const pageSize = 10;

  const tmdbImageBase = useMemo(
    () => process.env.NEXT_PUBLIC_TMDB_IMG_BASE ?? DEFAULT_TMDB_IMG_BASE,
    [],
  );

  const activeItems = useMemo(
    () => items.filter((item) => !item.archived),
    [items],
  );

  const filteredActiveItems = useMemo(() => {
    const clean = listQuery.trim().toLowerCase();
    if (!clean) {
      return activeItems;
    }
    return activeItems.filter((item) => item.title.toLowerCase().includes(clean));
  }, [activeItems, listQuery]);

  const unwatchedItems = useMemo(
    () => filteredActiveItems.filter((item) => !item.watched),
    [filteredActiveItems],
  );

  const watchedItems = useMemo(
    () => filteredActiveItems.filter((item) => item.watched),
    [filteredActiveItems],
  );

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(unwatchedItems.length / pageSize) - 1);
    setCurrentPage((prev) => Math.min(prev, maxPage));
  }, [unwatchedItems.length]);

  useEffect(() => {
    let ignore = false;

    const loadGenres = async () => {
      try {
        const res = await fetch("/api/tmdb/genres");
        if (!res.ok) return;
        const data = (await res.json()) as { all: GenreOption[] };
        if (!ignore) {
          setGenres(data.all);
        }
      } catch {
        // Ignore genre load errors to keep search usable.
      }
    };

    void loadGenres();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (searchMode !== "titles") return;
    const clean = query.trim();
    if (clean.length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(clean)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as SearchResult[];
        setSuggestions(data.slice(0, 6));
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSuggestions([]);
        }
      }
    }, 300);

    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [query, searchMode]);

  useEffect(() => {
    if (searchMode !== "actors") return;
    const clean = actorQuery.trim();
    if (clean.length < 2) {
      setActorSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tmdb/people?query=${encodeURIComponent(clean)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as PersonResult[];
        setActorSuggestions(data.slice(0, 6));
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setActorSuggestions([]);
        }
      }
    }, 300);

    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [actorQuery, searchMode]);

  useEffect(() => {
    setExpandedId(null);
    setStatus(null);
    setActorStatus(null);
    setHasSearchedTitles(false);
    setHasSearchedActors(false);
  }, [searchMode]);

  const applyFilters = (list: SearchResult[]) => {
    let filtered = [...list];

    if (filters.type !== "ALL") {
      filtered = filtered.filter((item) => item.type === filters.type);
    }
    if (filters.genre !== "ALL") {
      filtered = filtered.filter((item) => item.genreIds.includes(filters.genre as number));
    }

    filtered.sort((a, b) => {
      if (filters.sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      if (filters.sortBy === "release") {
        return new Date(b.releaseDate ?? 0).getTime() - new Date(a.releaseDate ?? 0).getTime();
      }
      return (b.popularity ?? 0) - (a.popularity ?? 0);
    });

    return filtered;
  };

  const filteredResults = useMemo(
    () => applyFilters(results),
    [results, filters.type, filters.genre, filters.sortBy],
  );

  const filteredCredits = useMemo(
    () => applyFilters(actorCredits),
    [actorCredits, filters.type, filters.genre, filters.sortBy],
  );

  const filteredRecommended = useMemo(
    () => applyFilters(recommended),
    [recommended, filters.type, filters.genre, filters.sortBy],
  );

  const visibleResults = searchMode === "titles" ? filteredResults : filteredCredits;

  const expandedPool =
    searchMode === "titles" ? [...filteredResults, ...filteredRecommended] : filteredCredits;
  const expandedResult =
    expandedId !== null
      ? expandedPool.find((candidate) => candidate.id === expandedId) ?? null
      : null;
  const expandedAlreadyInList = expandedResult
    ? activeItems.some(
        (item) => item.tmdbId === expandedResult.id && item.type === expandedResult.type,
      )
    : false;

  const totalUnwatched = activeItems.filter((item) => !item.watched).length;
  const totalPages = Math.max(1, Math.ceil(Math.max(unwatchedItems.length, 1) / pageSize));
  const listCountLabel = listQuery
    ? `${unwatchedItems.length}/${totalUnwatched}`
    : `${totalUnwatched}`;
  const recommendedQuery = searchMode === "titles" ? query.trim() : actorQuery.trim();
  const shouldShowRecommended =
    (searchMode === "titles" &&
      (recommendedQuery.length === 0 ||
        (hasSearchedTitles && results.length === 0))) ||
    (searchMode === "actors" &&
      hasSearchedActors &&
      actorResults.length === 0 &&
      !selectedActor);

  const loadRecommended = async (
    nextPage: number,
    baseQuery: string,
    replace: boolean,
  ) => {
    const normalizedQuery = baseQuery.trim();
    const queryParam = normalizedQuery.length > 0 ? normalizedQuery : "";

    setIsLoadingRecommended(true);
    setRecommendedStatus(null);
    try {
      const params = new URLSearchParams({ page: String(nextPage) });
      if (queryParam) {
        params.set("query", queryParam);
      }
      const res = await fetch(`/api/tmdb/recommended?${params.toString()}`);
      if (!res.ok) {
        setRecommendedStatus("Recomendações indisponíveis.");
        return;
      }
      const data = (await res.json()) as SearchResult[];
      if (data.length === 0) {
        setRecommendedHasMore(false);
        setRecommendedStatus(
          queryParam ? "Sem recomendações para essa busca." : "Sem recomendações no momento.",
        );
        if (replace) {
          setRecommended([]);
          setRecommendedPage(0);
        }
        return;
      }

      setRecommended((prev) => {
        const merged = replace ? data : [...prev, ...data];
        const unique = new Map<string, SearchResult>();
        for (const entry of merged) {
          unique.set(`${entry.type}-${entry.id}`, entry);
        }
        return Array.from(unique.values());
      });
      setRecommendedPage(nextPage);
      setRecommendedHasMore(true);
    } catch {
      setRecommendedStatus("Recomendações indisponíveis.");
    } finally {
      setIsLoadingRecommended(false);
    }
  };

  useEffect(() => {
    if (!shouldShowRecommended) return;
    setRecommended([]);
    setRecommendedPage(0);
    setRecommendedHasMore(true);
    setRecommendedStatus(null);
  }, [shouldShowRecommended, recommendedQuery]);

  useEffect(() => {
    if (!shouldShowRecommended) return;
    if (isLoadingRecommended || !recommendedHasMore) return;
    if (recommendedPage > 0) return;
    void loadRecommended(1, recommendedQuery, true);
  }, [
    shouldShowRecommended,
    recommendedQuery,
    recommendedPage,
    recommendedHasMore,
    isLoadingRecommended,
  ]);

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
        setStatus("Não foi possível adicionar");
        return;
      }

      const item = (await res.json()) as ListItem;
      setItems((previous) => {
        const existingIndex = previous.findIndex((entry) => entry.id === item.id);
        if (existingIndex === -1) {
          return [item, ...previous];
        }
        const next = [...previous];
        next[existingIndex] = item;
        return next;
      });
      setCurrentPage(0);
      setStatus(`Adicionado ${result.title}`);
      router.refresh();
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
          setStatus("Não foi possível remover");
          return;
        }

        setItems((previous) =>
          previous.map((item) =>
            item.id === itemId ? { ...item, archived: true } : item,
          ),
        );
        setStatus(`Removido ${title}`);
        router.refresh();
      } finally {
        setRemovingId(null);
      }
    });
  };

  const handleOpenPreview = (item: ListItem) => {
    setPreviewItem({
      id: item.id,
      tmdbId: item.tmdbId,
      title: item.title,
      overview: item.overview,
      type: item.type,
      posterPath: item.posterPath,
      backdropPath: item.backdropPath,
      releaseDate: item.releaseDate,
    });
    setPreviewOpen(true);
  };

  const handleToggleWatched = (itemId: string, currentWatched: boolean) => {
    setTogglingKey(itemId);
    startToggling(async () => {
      try {
        setStatus(null);
        const nextWatched = !currentWatched;
        const res = await fetch("/api/list/watch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ itemId, watched: nextWatched }),
        });

        if (!res.ok) {
          setStatus("Não foi possível atualizar");
          return;
        }

        setItems((previous) =>
          previous.map((item) =>
            item.id === itemId ? { ...item, watched: nextWatched } : item,
          ),
        );
        setStatus(nextWatched ? "Marcado como assistido" : "Marcado como não assistido");
        router.refresh();
      } finally {
        setTogglingKey(null);
      }
    });
  };

  const handleMarkWatched = (event: MouseEvent<HTMLButtonElement>, result: SearchResult) => {
    event.stopPropagation();
    if (isToggling) return;

    const existing = items.find(
      (item) => item.tmdbId === result.id && item.type === result.type,
    );
    const key = existing ? existing.id : `search-${result.type}-${result.id}`;
    const canToggleExisting = Boolean(existing && !existing.archived);
    const nextWatched = canToggleExisting ? !existing?.watched : true;
    setTogglingKey(key);

    startToggling(async () => {
      try {
        setStatus(null);
        if (canToggleExisting && existing) {
          const res = await fetch("/api/list/watch", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ itemId: existing.id, watched: nextWatched }),
          });

          if (!res.ok) {
            setStatus("Não foi possível atualizar");
            return;
          }

          setItems((previous) =>
            previous.map((item) =>
              item.id === existing.id ? { ...item, watched: nextWatched } : item,
            ),
          );
        } else {
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
              watched: true,
              archived: false,
            }),
          });

          if (!res.ok) {
            setStatus("Não foi possível adicionar");
            return;
          }

          const item = (await res.json()) as ListItem;
          setItems((previous) => {
            const existingIndex = previous.findIndex((entry) => entry.id === item.id);
            if (existingIndex === -1) {
              return [item, ...previous];
            }
            const next = [...previous];
            next[existingIndex] = item;
            return next;
          });
        }

        setStatus(nextWatched ? "Marcado como assistido" : "Marcado como não assistido");
        router.refresh();
      } finally {
        setTogglingKey(null);
      }
    });
  };

  const handleActorSelect = (actor: PersonResult) => {
    setSelectedActor(actor);
    setActorResults([]);
    setActorCredits([]);

    startSearching(async () => {
      setActorStatus(null);
      const res = await fetch(`/api/tmdb/credits?personId=${actor.id}`);
      if (!res.ok) {
        setActorStatus("Falha ao carregar filmografia");
        return;
      }
      const data = (await res.json()) as SearchResult[];
      setActorCredits(data);
    });
  };

  const handleActorSearch = () => {
    const clean = actorQuery.trim();
    if (!clean) return;

    startSearching(async () => {
      setActorStatus(null);
      setHasSearchedActors(true);
      setSelectedActor(null);
      setActorCredits([]);
      const res = await fetch(`/api/tmdb/people?query=${encodeURIComponent(clean)}`);
      if (!res.ok) {
        setActorStatus("Falha na busca");
        return;
      }
      const data = (await res.json()) as PersonResult[];
      setActorResults(data);
      if (data.length === 0) {
        setActorStatus("Nenhum ator encontrado");
      }
    });
  };

  const handleTitleSearch = () => {
    const clean = query.trim();
    if (!clean) return;

    startSearching(async () => {
      setStatus(null);
      setHasSearchedTitles(true);
      const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(clean)}`);
      if (!res.ok) {
        setStatus("Falha na busca");
        return;
      }
      const data = (await res.json()) as SearchResult[];
      setResults(data);
      setExpandedId(null);
      if (data.length === 0) {
        setStatus("Nenhum título encontrado");
      }
    });
  };

  const handleSuggestionSelect = (result: SearchResult) => {
    setQuery(result.title);
    setHasSearchedTitles(true);
    setSuggestionsOpen(false);
    setResults([result]);
    setExpandedId(result.id);
  };

  const handleActorSuggestionSelect = (actor: PersonResult) => {
    setActorQuery(actor.name);
    setHasSearchedActors(true);
    setActorSuggestionsOpen(false);
    handleActorSelect(actor);
  };

  const clearActorSelection = () => {
    setSelectedActor(null);
    setActorCredits([]);
  };

  const renderResultCard = (result: SearchResult) => {
    const listEntry = items.find(
      (item) => item.tmdbId === result.id && item.type === result.type,
    );
    const alreadyAdded = Boolean(listEntry && !listEntry.archived);
    const alreadyWatched = Boolean(listEntry?.watched && !listEntry?.archived);
    const searchKey = `search-${result.type}-${result.id}`;
    const isMarking =
      isToggling && (togglingKey === searchKey || togglingKey === listEntry?.id);
    const displayImage = result.backdropPath
      ? `${tmdbImageBase}/w780${result.backdropPath}`
      : result.posterPath
      ? `${tmdbImageBase}/w342${result.posterPath}`
      : null;

    return (
      <li
        key={`${result.type}-${result.id}`}
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/70 shadow-[0_20px_50px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:border-emerald-500/60 hover:shadow-[0_30px_70px_rgba(0,0,0,0.45)]"
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
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-neutral-400">
              <span className="rounded-full border border-neutral-700 px-2 py-0.5">
                {result.type === "MOVIE" ? "Filme" : "Série"}
              </span>
              {result.releaseDate && (
                <span>{new Date(result.releaseDate).getFullYear()}</span>
              )}
              <span>Popularidade: {Math.round(result.popularity)}</span>
            </div>
            <h3 className="text-lg font-semibold text-neutral-50">{result.title}</h3>
            <p className="line-clamp-3 text-sm text-neutral-400">{result.overview}</p>
            {(result.character || result.job) && (
              <p className="text-xs text-emerald-300">
                {result.character ? `Personagem: ${result.character}` : `Cargo: ${result.job}`}
              </p>
            )}
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-neutral-700 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-100 transition hover:border-emerald-400 hover:text-emerald-300 disabled:opacity-60"
              disabled={alreadyAdded || isAdding}
              onClick={(event) => handleAdd(event, result)}
            >
              {alreadyAdded
                ? "Ja esta na lista"
                : listEntry?.archived
                ? "Adicionar novamente"
                : "Adicionar a lista"}
            </button>
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-300 transition hover:border-emerald-400/60 hover:text-emerald-200 disabled:opacity-60"
              disabled={isMarking}
              onClick={(event) => handleMarkWatched(event, result)}
            >
              {isMarking
                ? "Atualizando..."
                : alreadyWatched
                ? "Desmarcar"
                : "Marcar assistido"}
            </button>
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-12">
      {showSearch && (
        <section className="rounded-3xl border border-white/10 bg-neutral-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Buscar</p>
                <h2 className="text-xl font-semibold text-neutral-100">Explorar catálogo</h2>
                <p className="text-sm text-neutral-400">
                  Pesquise títulos para adicionar e manter sua lista organizada.
                </p>
              </div>
              <div className="inline-flex rounded-full border border-white/10 bg-neutral-950/80 p-1 text-xs font-semibold uppercase tracking-wider text-neutral-300 shadow-lg shadow-black/40 backdrop-blur">
                <button
                  type="button"
                  onClick={() => setSearchMode("titles")}
                  className={`rounded-full px-4 py-2 transition ${
                    searchMode === "titles"
                      ? "bg-white/10 text-neutral-100"
                      : "hover:text-neutral-200"
                  }`}
                >
                Filmes e séries
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode("actors")}
                  className={`rounded-full px-4 py-2 transition ${
                    searchMode === "actors"
                      ? "bg-white/10 text-neutral-100"
                      : "hover:text-neutral-200"
                  }`}
                >
                  Atores
                </button>
              </div>
            </div>

            <div className="space-y-6">
          {searchMode === "titles" ? (
            <section className="space-y-4 rounded-3xl border border-white/10 bg-neutral-950/70 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <form
                className="flex flex-col gap-3 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleTitleSearch();
                }}
              >
                <div className="relative flex-1">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onFocus={() => setSuggestionsOpen(true)}
                    onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
                    placeholder="Buscar filmes ou séries"
                    className="w-full rounded-full border border-white/10 bg-neutral-950/80 px-4 py-3 text-sm text-neutral-100 focus:border-emerald-400 focus:outline-none"
                  />
                  {suggestionsOpen && suggestions.length > 0 && (
                    <div className="absolute top-full z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl">
                      {suggestions.map((suggestion) => (
                        <button
                          type="button"
                          key={`${suggestion.type}-${suggestion.id}`}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSuggestionSelect(suggestion)}
                          className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left text-sm text-neutral-200 transition hover:bg-white/5"
                        >
                          <div className="relative h-10 w-8 overflow-hidden rounded-md bg-neutral-900">
                            {suggestion.posterPath ? (
                              <Image
                                src={`${tmdbImageBase}/w154${suggestion.posterPath}`}
                                alt={suggestion.title}
                                fill
                                sizes="32px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-500">
                                Sem
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-neutral-100">{suggestion.title}</p>
                            <p className="text-xs text-neutral-400">
                              {suggestion.type === "MOVIE" ? "Filme" : "Série"}
                              {suggestion.releaseDate
                                ? `  -  ${new Date(suggestion.releaseDate).getFullYear()}`
                                : ""}
                            </p>
                          </div>
                          <span className="text-[10px] uppercase tracking-wider text-emerald-300">
                            Ver
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="rounded-full bg-emerald-400 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-emerald-950 hover:bg-emerald-300"
                  disabled={isSearching}
                >
                  {isSearching ? "Buscando..." : "Buscar"}
                </button>
              </form>
              {status && <p className="text-sm text-neutral-300">{status}</p>}
            </section>
          ) : (
            <section className="space-y-4 rounded-3xl border border-white/10 bg-neutral-950/70 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <form
                className="flex flex-col gap-3 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleActorSearch();
                }}
              >
                <div className="relative flex-1">
                  <input
                    value={actorQuery}
                    onChange={(event) => setActorQuery(event.target.value)}
                    onFocus={() => setActorSuggestionsOpen(true)}
                    onBlur={() => setTimeout(() => setActorSuggestionsOpen(false), 150)}
                    placeholder="Buscar por ator"
                    className="w-full rounded-full border border-white/10 bg-neutral-950/80 px-4 py-3 text-sm text-neutral-100 focus:border-emerald-400 focus:outline-none"
                  />
                  {actorSuggestionsOpen && actorSuggestions.length > 0 && (
                    <div className="absolute top-full z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl">
                      {actorSuggestions.map((actor) => (
                        <button
                          type="button"
                          key={actor.id}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleActorSuggestionSelect(actor)}
                          className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left text-sm text-neutral-200 transition hover:bg-white/5"
                        >
                          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-neutral-900">
                              {actor.profilePath ? (
                              <Image
                                src={`${tmdbImageBase}/w185${actor.profilePath}`}
                                alt={actor.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-500">
                                Sem
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-neutral-100">{actor.name}</p>
                            {actor.knownFor.length > 0 && (
                              <p className="text-xs text-neutral-400">
                                {actor.knownFor.slice(0, 2).join("  -  ")}
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] uppercase tracking-wider text-emerald-300">
                            Ver
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="rounded-full bg-emerald-400 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-emerald-950 hover:bg-emerald-300"
                  disabled={isSearching}
                >
                  {isSearching ? "Buscando..." : "Buscar"}
                </button>
              </form>
              {actorStatus && <p className="text-sm text-neutral-300">{actorStatus}</p>}
            </section>
          )}

          {searchMode === "titles" || (searchMode === "actors" && selectedActor) ? (
            <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-white/10 bg-neutral-950/80 p-3 text-xs text-neutral-300 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
              <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                Filtros
              </span>
              <select
                value={filters.type}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    type: event.target.value as Filters["type"],
                  }))
                }
                className="rounded-full border border-white/10 bg-neutral-950 px-3 py-2 text-xs"
              >
                <option value="ALL">Todos os tipos</option>
                <option value="MOVIE">Filmes</option>
                <option value="TV">Séries</option>
              </select>
              <select
                value={filters.genre}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    genre: event.target.value === "ALL" ? "ALL" : Number(event.target.value),
                  }))
                }
                className="rounded-full border border-white/10 bg-neutral-950 px-3 py-2 text-xs"
              >
                <option value="ALL">Todas as categorias</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
              </select>
              <select
                value={filters.sortBy}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    sortBy: event.target.value as SortMode,
                  }))
                }
                className="rounded-full border border-white/10 bg-neutral-950 px-3 py-2 text-xs"
              >
                <option value="popularity">Popularidade</option>
                <option value="release">Lancamento</option>
                <option value="title">Título</option>
              </select>
            </div>
          ) : null}
          {searchMode === "actors" && !selectedActor && actorResults.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {actorResults.map((actor) => (
                <button
                  type="button"
                  key={actor.id}
                  onClick={() => handleActorSelect(actor)}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-neutral-950/70 p-4 text-left shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:border-emerald-400/60"
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-full bg-neutral-900">
                    {actor.profilePath ? (
                      <Image
                        src={`${tmdbImageBase}/w185${actor.profilePath}`}
                        alt={actor.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                        Sem
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-100">{actor.name}</p>
                    {actor.knownFor.length > 0 && (
                      <p className="text-xs text-neutral-400">
                        {actor.knownFor.slice(0, 3).join("  -  ")}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-300">
                    Ver filmes
                  </span>
                </button>
              ))}
            </div>
          )}

          {searchMode === "actors" && selectedActor && (
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-neutral-950/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full bg-neutral-900">
                  {selectedActor.profilePath ? (
                    <Image
                      src={`${tmdbImageBase}/w185${selectedActor.profilePath}`}
                      alt={selectedActor.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                      Sem
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Filmografia</p>
                  <p className="text-lg font-semibold text-neutral-100">{selectedActor.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearActorSelection}
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-300 transition hover:border-white/30"
              >
                Trocar ator
              </button>
            </div>
          )}

          {(searchMode === "titles" || (searchMode === "actors" && selectedActor)) && (
            <ul className="grid gap-4 sm:grid-cols-2">
              {visibleResults.map(renderResultCard)}

              {visibleResults.length === 0 && (
            <p className="text-neutral-500">Pesquise títulos para adicionar.</p>
              )}
            </ul>
          )}

          {shouldShowRecommended && (
              <section className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Sugestões</p>
                    <h3 className="text-lg font-semibold text-neutral-100">Recomendados</h3>
                    <p className="text-sm text-neutral-400">
                      Seleção de títulos em alta para você explorar agora.
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-wider text-neutral-400">
                    {recommendedQuery ? "Baseado na busca" : "Atualizados agora"}
                  </span>
                </div>

                {isLoadingRecommended && recommendedPage === 0 ? (
                  <p className="text-sm text-neutral-400">Carregando recomendados...</p>
                ) : filteredRecommended.length > 0 ? (
                  <ul className="grid gap-4 sm:grid-cols-2">
                    {filteredRecommended.map(renderResultCard)}
                  </ul>
                ) : (
                  <p className="text-sm text-neutral-500">
                    {recommendedStatus ?? "Sem recomendações no momento."}
                  </p>
                )}

                {filteredRecommended.length > 0 && (
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        loadRecommended(recommendedPage + 1, recommendedQuery, false)
                      }
                      disabled={isLoadingRecommended || !recommendedHasMore}
                      className="rounded-full border border-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-300 transition hover:border-white/30 hover:text-neutral-100 disabled:opacity-50"
                    >
                      {isLoadingRecommended
                        ? "Carregando..."
                        : recommendedHasMore
                        ? "Avançar"
                        : "Sem mais recomendações"}
                    </button>
                  </div>
                )}
              </section>
            )}
            </div>
          </div>
        </section>
      )}

      {showList && (
        <section className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-neutral-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-100">
                Minha lista <span className="text-sm text-neutral-500">({listCountLabel})</span>
              </h2>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Revise seus títulos antes do próximo sorteio.
            </p>
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">Busca</p>
              <input
                value={listQuery}
                onChange={(event) => setListQuery(event.target.value)}
                placeholder="Busca na lista"
                className="w-full rounded-full border border-white/10 bg-neutral-950/90 px-4 py-2 text-xs text-neutral-200 focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              {unwatchedItems
                .slice(currentPage * pageSize, currentPage * pageSize + pageSize)
                .map((item) => {
                  const image = item.posterPath
                    ? `${tmdbImageBase}/w154${item.posterPath}`
                    : item.backdropPath
                    ? `${tmdbImageBase}/w300${item.backdropPath}`
                    : null;

                  return (
                    <li
                      key={item.id}
                      className="flex cursor-pointer items-center gap-4 rounded-2xl border border-white/10 bg-neutral-900/70 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.25)] transition hover:border-emerald-400/40"
                      onClick={() => handleOpenPreview(item)}
                    >
                      <div className="relative h-16 w-12 overflow-hidden rounded-lg bg-neutral-900">
                        {image ? (
                          <Image
                            src={image}
                            alt={item.title}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-500">
                            Sem
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-neutral-100">{item.title}</p>
                        <p className="text-xs text-neutral-500">
                          {item.type === "MOVIE" ? "Filme" : "Série"}
                          {item.releaseDate
                            ? `  -  ${new Date(item.releaseDate).getFullYear()}`
                            : ""}
                        </p>
                        {item.watched && (
                          <span className="mt-2 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-300">
                            Assistido
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-300 transition hover:border-emerald-400/60 hover:text-emerald-200 disabled:opacity-60"
                          disabled={isToggling && togglingKey === item.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleToggleWatched(item.id, item.watched);
                          }}
                        >
                          {isToggling && togglingKey === item.id
                            ? "Atualizando..."
                            : item.watched
                            ? "Desmarcar"
                            : "Marcar assistido"}
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-red-500/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-300 transition hover:bg-red-500/10 hover:text-red-200 disabled:opacity-60"
                          disabled={isRemoving && removingId === item.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRemove(item.id, item.title);
                          }}
                        >
                          {isRemoving && removingId === item.id ? "Removendo..." : "Remover"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              {unwatchedItems.length === 0 && (
                <li className="text-neutral-500">
                  {listQuery ? "Nenhum item encontrado." : "Nenhum item adicionado ainda."}
                </li>
              )}
            </ul>
            {unwatchedItems.length > 0 && (
              <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
                <button
                  type="button"
                  className="rounded-full border border-neutral-800 px-3 py-1 transition hover:border-neutral-600 hover:text-neutral-200 disabled:opacity-50"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                  disabled={currentPage === 0}
                >
                  Página anterior
                </button>
                <span>
                  Página {currentPage + 1} de {totalPages}
                </span>
                <button
                  type="button"
                  className="rounded-full border border-neutral-800 px-3 py-1 transition hover:border-neutral-600 hover:text-neutral-200 disabled:opacity-50"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
                  disabled={currentPage >= totalPages - 1}
                >
                  Próxima página
                </button>
              </div>
            )}
            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-400">
                  Marcados como assistido
                </h3>
                <span className="text-xs text-neutral-500">({watchedItems.length})</span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Itens assistidos ficam aqui para você desmarcar ou remover.
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                {watchedItems.map((item) => {
                  const image = item.posterPath
                    ? `${tmdbImageBase}/w154${item.posterPath}`
                    : item.backdropPath
                    ? `${tmdbImageBase}/w300${item.backdropPath}`
                    : null;

                  return (
                    <li
                      key={item.id}
                      className="flex cursor-pointer items-center gap-4 rounded-2xl border border-white/10 bg-neutral-900/70 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.25)] transition hover:border-emerald-400/40"
                      onClick={() => handleOpenPreview(item)}
                    >
                      <div className="relative h-16 w-12 overflow-hidden rounded-lg bg-neutral-900">
                        {image ? (
                          <Image
                            src={image}
                            alt={item.title}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-500">
                            Sem
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-neutral-100">{item.title}</p>
                        <p className="text-xs text-neutral-500">
                        {item.type === "MOVIE" ? "Filme" : "Série"}
                          {item.releaseDate
                            ? `  -  ${new Date(item.releaseDate).getFullYear()}`
                            : ""}
                        </p>
                        <span className="mt-2 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-300">
                          Assistido
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-300 transition hover:border-emerald-400/60 hover:text-emerald-200 disabled:opacity-60"
                          disabled={isToggling && togglingKey === item.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleToggleWatched(item.id, item.watched);
                          }}
                        >
                          {isToggling && togglingKey === item.id
                            ? "Atualizando..."
                            : "Desmarcar"}
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-red-500/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-300 transition hover:bg-red-500/10 hover:text-red-200 disabled:opacity-60"
                          disabled={isRemoving && removingId === item.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRemove(item.id, item.title);
                          }}
                        >
                          {isRemoving && removingId === item.id ? "Removendo..." : "Remover"}
                        </button>
                      </div>
                    </li>
                  );
                })}
                {watchedItems.length === 0 && (
                  <li className="text-neutral-500">Nenhum item assistido ainda.</li>
                )}
              </ul>
            </div>
            {status && <p className="mt-4 text-sm text-neutral-300">{status}</p>}
          </div>
        </section>
      )}
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
      <PickResultModal
        item={previewItem}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
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
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!result) {
    return null;
  }

  useEffect(() => {
    let ignore = false;

    const loadTrailer = async () => {
      setIsLoading(true);
      setTrailerKey(null);
      try {
        const res = await fetch(
          `/api/tmdb/videos?tmdbId=${result.id}&type=${result.type}`,
        );
        if (!res.ok) {
          return;
        }
        const data = (await res.json()) as { key: string | null };
        if (!ignore) {
          setTrailerKey(data.key);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void loadTrailer();

    return () => {
      ignore = true;
    };
  }, [result.id, result.type]);

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
          className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-black/60 text-lg text-white transition hover:bg-black/80"
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
              {result.type === "MOVIE" ? "Filme" : "Série"}
            </span>
            {result.releaseDate && (
              <span>Lancamento: {new Date(result.releaseDate).toLocaleDateString("pt-BR")}</span>
            )}
            <span>Popularidade: {Math.round(result.popularity)}</span>
            <span>Nota: {result.voteAverage.toFixed(1)}</span>
          </div>
          <h3 className="text-2xl font-semibold text-neutral-50">{result.title}</h3>
          <p className="text-sm leading-relaxed text-neutral-300">{result.overview}</p>
          {(result.character || result.job) && (
            <p className="text-sm text-emerald-300">
              {result.character ? `Personagem: ${result.character}` : `Cargo: ${result.job}`}
            </p>
          )}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Trailer</p>
            <div className="mt-3">
              {isLoading && (
                <p className="text-sm text-neutral-400">Carregando trailer...</p>
              )}
              {!isLoading && trailerKey && (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10">
                  <iframe
                    title={`Trailer de ${result.title}`}
                    src={`https://www.youtube.com/embed/${trailerKey}`}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
              {!isLoading && !trailerKey && (
                <p className="text-sm text-neutral-400">Trailer indisponível no momento.</p>
              )}
            </div>
          </div>
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
