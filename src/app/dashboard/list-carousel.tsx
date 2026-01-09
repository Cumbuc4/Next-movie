"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_TMDB_IMG_BASE = "https://image.tmdb.org/t/p";

type CarouselItem = {
  id: string;
  title: string;
  backdropPath: string | null;
  posterPath: string | null;
  overview?: string | null;
  type?: "MOVIE" | "TV";
};

type ListCarouselProps = {
  items: CarouselItem[];
  autoRotateMs?: number;
};

export function ListCarousel({ items, autoRotateMs = 6000 }: ListCarouselProps) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [isRefreshing, startTransition] = useTransition();
  const slides = useMemo(() => items.filter(Boolean), [items]);

  const tmdbBase = useMemo(
    () => process.env.NEXT_PUBLIC_TMDB_IMG_BASE ?? DEFAULT_TMDB_IMG_BASE,
    [],
  );

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, autoRotateMs);
    return () => clearInterval(timer);
  }, [slides, autoRotateMs]);

  useEffect(() => {
    if (index >= slides.length) {
      setIndex(0);
    }
  }, [index, slides.length]);

  if (slides.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 text-center text-sm text-neutral-400">
        Nenhum item adicionado ainda. Use a sua lista para começar a montar um carrossel.
      </div>
    );
  }

  const active = slides[index];

  const primaryImage =
    (active.backdropPath && `${tmdbBase}/w1280${active.backdropPath}`) ||
    (active.posterPath && `${tmdbBase}/w780${active.posterPath}`) ||
    null;

  const goTo = (nextIndex: number) => {
    if (slides.length === 0) return;
    const normalized = (nextIndex + slides.length) % slides.length;
    setIndex(normalized);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-lg">
      <div className="relative h-80 w-full">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={active.title}
            fill
            sizes="(min-width: 1024px) 768px, 100vw"
            className="object-cover"
            priority={index === 0}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-sm text-neutral-500">
            Sem imagem disponível
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/10" />
        <div className="absolute inset-x-6 bottom-6 space-y-2">
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/80">
            {active.type === "TV" ? "Série" : "Filme"}
          </span>
          <h2 className="text-3xl font-semibold text-white md:text-4xl">{active.title}</h2>
          {active.overview && (
            <p className="line-clamp-2 max-w-2xl text-sm text-white/70">{active.overview}</p>
          )}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-4">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition hover:bg-black/80"
              aria-label="Anterior"
            >
              {"<"}
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition hover:bg-black/80"
              aria-label="Próximo"
            >
              {">"}
            </button>
          </div>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goTo(slideIndex)}
                className={`h-2 w-8 rounded-full border border-white/30 transition ${
                  slideIndex === index ? "bg-white/80" : "bg-white/20 hover:bg-white/40"
                }`}
                aria-label={`Ir para ${slide.title}`}
              />
            ))}
          </div>
        </>
      )}

      <div className="flex items-center justify-between border-t border-neutral-800 bg-neutral-950/80 px-4 py-3 text-xs text-neutral-400">
        <span>
          {index + 1} de {slides.length}
        </span>
        <button
          type="button"
          onClick={() => startTransition(() => router.refresh())}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-md border border-neutral-700 px-3 py-1 text-xs font-semibold text-neutral-300 transition hover:border-neutral-500 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? (
            <>
              <span className="inline-block h-3 w-3 animate-spin rounded-full border border-neutral-400 border-t-transparent" />
              Atualizando...
            </>
          ) : (
            "Atualizar lista"
          )}
        </button>
      </div>
    </div>
  );
}
