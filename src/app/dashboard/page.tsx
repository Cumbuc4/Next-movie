import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { SoloPicker } from "./solo-picker";
import { PartnerPicker } from "./partner-picker";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      friendshipsA: { include: { b: true } },
      friendshipsB: { include: { a: true } },
      friendRequestsReceived: {
        where: { status: "PENDING" },
        include: { requester: { select: { id: true, username: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      friendRequestsSent: {
        where: { status: "PENDING" },
        include: { recipient: { select: { id: true, username: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      items: { orderBy: { addedAt: "desc" } },
      pickHistory: { orderBy: { pickedAt: "desc" }, take: 5, include: { item: true } },
      sharedPickHistory: {
        orderBy: { pickedAt: "desc" },
        take: 5,
        include: { item: true, partner: true },
      },
    },
  });

  if (!user) {
    redirect("/api/auth/signout?callbackUrl=/login?error=session");
  }

  const friends = [
    ...user.friendshipsA.map((friendship) => friendship.b),
    ...user.friendshipsB.map((friendship) => friendship.a),
  ].map((friend) => ({
    id: friend.id,
    name: friend.name,
    username: friend.username,
  }));

  const incomingRequests = user.friendRequestsReceived.map((request) => ({
    id: request.id,
    createdAt: request.createdAt.toISOString(),
    requester: {
      name: request.requester.name,
      username: request.requester.username,
    },
  }));

  const outgoingRequests = user.friendRequestsSent.map((request) => ({
    id: request.id,
    createdAt: request.createdAt.toISOString(),
    recipient: {
      name: request.recipient.name,
      username: request.recipient.username,
    },
  }));

  const activeItems = user.items.filter((item) => !item.archived);
  const movieCount = activeItems.filter((item) => item.type === "MOVIE").length;
  const tvCount = activeItems.filter((item) => item.type === "TV").length;
  const pendingInvites = incomingRequests.length + outgoingRequests.length;

  const stats = [
    { label: "Títulos", value: activeItems.length, note: "na sua lista" },
    { label: "Filmes", value: movieCount, note: "marcados" },
    { label: "Séries", value: tvCount, note: "marcadas" },
    { label: "Convites", value: pendingInvites, note: "pendentes" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-10">
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-950/70 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/15 blur-[140px]" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-neutral-500">Nome de usuário</p>
              <p className="font-mono text-sm text-neutral-200">{user.username}</p>
              <p className="text-xs text-neutral-500">
                Seu código de acesso aparece apenas no cadastro. Guarde-o em local seguro.
              </p>
              <h1 className="pt-2 text-3xl font-semibold">Olá, {user.name ?? user.username}</h1>
              <p className="max-w-2xl text-sm text-neutral-400">
                Gerencie sua lista, convide amigos e sorteie o próximo título para assistir.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                className="rounded-full bg-emerald-400 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-300"
                href="/list"
              >
                Adicionar novos títulos
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button
                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-300 transition hover:border-white/25 hover:text-neutral-100"
                  type="submit"
                >
                  Encerrar sessão
                </button>
              </form>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-neutral-950/80 p-4"
              >
                <p className="text-[10px] uppercase tracking-[0.35em] text-neutral-500">
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-neutral-100">{stat.value}</p>
                <p className="text-xs text-neutral-500">{stat.note}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <SoloPicker />
        <PartnerPicker friends={friends} />
      </section>

    </main>
  );
}
