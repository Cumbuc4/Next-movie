"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

export type PickedItem = {
  id: string;
  tmdbId: number;
  title: string;
  overview: string | null;
  type: "MOVIE" | "TV";
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
};

const DEFAULT_TMDB_IMG_BASE = "https://image.tmdb.org/t/p";

type PickResultModalProps = {
  item: PickedItem | null;
  open: boolean;
  onClose: () => void;
};

export function PickResultModal({ item, open, onClose }: PickResultModalProps) {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const tmdbImageBase = useMemo(
    () => process.env.NEXT_PUBLIC_TMDB_IMG_BASE ?? DEFAULT_TMDB_IMG_BASE,
    [],
  );

  useEffect(() => {
    if (!open || !item) {
      return;
    }

    let ignore = false;

    const loadTrailer = async () => {
      setIsLoading(true);
      setTrailerKey(null);
      try {
        const res = await fetch(
          `/api/tmdb/videos?tmdbId=${item.tmdbId}&type=${item.type}`,
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
  }, [open, item]);

  if (!open || !item) {
    return null;
  }

  const displayImage = item.backdropPath
    ? `${tmdbImageBase}/w1280${item.backdropPath}`
    : item.posterPath
    ? `${tmdbImageBase}/w780${item.posterPath}`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        style={{ maxHeight: "90vh" }}
      >
        <button
          type="button"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-black/60 text-lg text-white transition hover:bg-black/80"
          onClick={onClose}
          aria-label="Fechar detalhes"
        >
          x
        </button>
        <div className="relative h-56 w-full">
          {displayImage ? (
            <Image
              src={displayImage}
              alt={`Imagem de ${item.title}`}
              fill
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-sm text-neutral-500">
              Sem imagem
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          <div className="absolute bottom-6 left-6 space-y-2">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-wider text-white/80">
              {item.type === "MOVIE" ? "Filme" : "Série"}
            </span>
            <h3 className="text-2xl font-semibold text-white sm:text-3xl">{item.title}</h3>
          </div>
        </div>

        <div className="space-y-5 overflow-y-auto p-6">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-neutral-400">
            {item.releaseDate && (
              <span>Lançamento: {new Date(item.releaseDate).toLocaleDateString("pt-BR")}</span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-neutral-300">
            {item.overview || "Sem descrição para este título."}
          </p>
          <div className="rounded-2xl border border-white/10 bg-neutral-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Trailer</p>
            <div className="mt-3">
              {isLoading && (
                <p className="text-sm text-neutral-400">Carregando trailer...</p>
              )}
              {!isLoading && trailerKey && (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10">
                  <iframe
                    title={`Trailer de ${item.title}`}
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
          <div className="flex justify-end">
            <button
              type="button"
              className="rounded-full border border-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-300 transition hover:border-white/30"
              onClick={onClose}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
