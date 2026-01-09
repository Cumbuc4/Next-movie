import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type FriendProfilePageProps = {
  params: Promise<{ username: string }>;
};

export default async function FriendProfilePage({ params }: FriendProfilePageProps) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const { username } = await params;
  const normalizedUsername = username.toLowerCase();

  const friend = await db.user.findUnique({
    where: { username: normalizedUsername },
    include: {
      items: { orderBy: { addedAt: "desc" } },
      pickHistory: { orderBy: { pickedAt: "desc" }, take: 5, include: { item: true } },
      sharedPickHistory: {
        orderBy: { pickedAt: "desc" },
        take: 5,
        include: { item: true, partner: true },
      },
    },
  });

  if (!friend) {
    notFound();
  }

  const friendship = await db.friendship.findFirst({
    where: {
      OR: [
        { aId: userId, bId: friend.id },
        { aId: friend.id, bId: userId },
      ],
    },
  });

  if (!friendship) {
    notFound();
  }

  const activeItems = friend.items.filter((item) => !item.archived);
  const listItems = activeItems.filter((item) => !item.watched);
  const watchedItems = activeItems.filter((item) => item.watched);
  const movieCount = listItems.filter((item) => item.type === "MOVIE").length;
  const tvCount = listItems.filter((item) => item.type === "TV").length;
  const watchedCount = watchedItems.length;

  const summary = [
    { label: "Títulos", value: listItems.length },
    { label: "Filmes", value: movieCount },
    { label: "Séries", value: tvCount },
    { label: "Assistidos", value: watchedCount },
  ];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <header className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr] lg:items-end">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-neutral-900 text-lg font-semibold text-neutral-200">
              {friend.image ? (
                <img src={friend.image} alt="Avatar do amigo" className="h-full w-full object-cover" />
              ) : (
                <span>{(friend.name ?? friend.username ?? "U").slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Perfil do amigo</p>
              <h1 className="text-3xl font-semibold">{friend.name ?? friend.username}</h1>
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">ID único</p>
              <p className="font-mono text-sm text-neutral-200">{friend.username}</p>
            </div>
          </div>
          <p className="max-w-2xl text-sm text-neutral-400">
            Veja a lista e o histórico deste amigo, igual ao que aparece em "Minha lista".
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-neutral-950/70 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Resumo rápido</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summary.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-neutral-950/80 p-4">
                <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-neutral-100">{stat.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-neutral-500">
            Dica: combine um sorteio em dupla para decidir o próximo título.
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-white/10 bg-neutral-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Lista atual</h2>
            <p className="text-sm text-neutral-400">
              Títulos ativos que este amigo quer assistir.
            </p>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wider text-neutral-400">
            {listItems.length} títulos
          </span>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {listItems.length === 0 && (
            <li className="rounded-xl border border-white/10 bg-neutral-950/80 p-4 text-sm text-neutral-400">
              Nenhum título adicionado ainda.
            </li>
          )}
          {listItems.map((item) => {
            const typeLabel = item.type === "MOVIE" ? "Filme" : "Série";
            const year = item.releaseDate ? item.releaseDate.getFullYear() : null;
            const meta = year ? `${typeLabel} - ${year}` : typeLabel;
            return (
              <li
                key={item.id}
                className="rounded-xl border border-white/10 bg-neutral-950/80 p-4 text-sm text-neutral-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="block font-semibold text-neutral-100">{item.title}</span>
                    <span className="text-xs text-neutral-500">{meta}</span>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wider text-neutral-400">
                    Na lista
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-neutral-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Assistidos</h2>
            <p className="text-sm text-neutral-400">Títulos que este amigo já marcou.</p>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wider text-neutral-400">
            {watchedItems.length} títulos
          </span>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {watchedItems.length === 0 && (
            <li className="rounded-xl border border-white/10 bg-neutral-950/80 p-4 text-sm text-neutral-400">
              Nenhum título assistido ainda.
            </li>
          )}
          {watchedItems.map((item) => {
            const typeLabel = item.type === "MOVIE" ? "Filme" : "Série";
            const year = item.releaseDate ? item.releaseDate.getFullYear() : null;
            const meta = year ? `${typeLabel} - ${year}` : typeLabel;
            return (
              <li
                key={item.id}
                className="rounded-xl border border-white/10 bg-neutral-950/80 p-4 text-sm text-neutral-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="block font-semibold text-neutral-100">{item.title}</span>
                    <span className="text-xs text-neutral-500">{meta}</span>
                  </div>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-wider text-emerald-300">
                    Assistido
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-neutral-950/70 p-6">
          <h2 className="text-xl font-semibold">Histórico individual</h2>
          <ul className="mt-4 space-y-3 text-sm text-neutral-400">
            {friend.pickHistory.map((entry) => (
              <li key={entry.id}>
                <span className="font-medium text-neutral-100">{entry.item.title}</span> em{" "}
                {entry.pickedAt.toLocaleDateString("pt-BR")}
              </li>
            ))}
            {friend.pickHistory.length === 0 && <li>Ainda sem sorteios.</li>}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-neutral-950/70 p-6">
          <h2 className="text-xl font-semibold">Histórico em dupla</h2>
          <ul className="mt-4 space-y-3 text-sm text-neutral-400">
            {friend.sharedPickHistory.map((entry) => (
              <li key={entry.id}>
                {friend.name ?? friend.username} e{" "}
                {entry.partner.name ?? entry.partner.username} sortearam
                <span className="font-medium text-neutral-100"> {entry.item.title}</span> em{" "}
                {entry.pickedAt.toLocaleDateString("pt-BR")}
              </li>
            ))}
            {friend.sharedPickHistory.length === 0 && <li>Ainda sem sorteios em dupla.</li>}
          </ul>
        </div>
      </section>
    </main>
  );
}
