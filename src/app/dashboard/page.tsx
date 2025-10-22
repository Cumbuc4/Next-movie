import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { SoloPicker } from "./solo-picker";
import { PartnerPicker } from "./partner-picker";
import { AddFriendForm } from "./add-friend-form";
import { IncomingFriendRequests, OutgoingFriendRequests } from "./friend-requests";
import { ListCarousel } from "./list-carousel";
import { RemoveFriendButton } from "./remove-friend-button";

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

  const listItems = user.items.map((item) => ({
    id: item.id,
    title: item.title,
    backdropPath: item.backdropPath,
    posterPath: item.posterPath,
    overview: item.overview,
    type: item.type,
  }));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-3 border-b border-neutral-800 pb-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-neutral-500">Nome de usuario</p>
          <p className="font-mono text-sm text-neutral-300">{user.username}</p>
          <p className="text-xs text-neutral-500">
            Seu codigo de acesso e exibido apenas durante o cadastro. Guarde-o em um local seguro.
          </p>
        </div>
        <h1 className="text-3xl font-semibold">Ola, {user.name ?? user.username}</h1>
        <p className="text-neutral-400">
          Gerencie sua lista de filmes e series, convide amigos e sorteie o proximo item para assistir.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link className="text-sm text-emerald-400 hover:text-emerald-300" href="/list">
            Adicionar novos titulos
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="text-sm text-neutral-400 transition hover:text-neutral-200" type="submit">
              Encerrar sessao
            </button>
          </form>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <AddFriendForm />
        <IncomingFriendRequests requests={incomingRequests} />
        <OutgoingFriendRequests requests={outgoingRequests} />
      </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Seus amigos</h2>
        <p className="mb-4 text-sm text-neutral-400">
          Compartilhe seu nome de usuario para conectar e liberar os sorteios em dupla.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2 text-sm text-neutral-300">
          {friends.length === 0 && <li>Nenhum amigo adicionado ainda.</li>}
          {friends.map((friend) => (
            <li key={friend.id} className="rounded-md border border-neutral-800 bg-neutral-950/60 p-4">
              <span className="block font-semibold text-neutral-100">{friend.name ?? friend.username}</span>
              <span className="font-mono text-xs uppercase tracking-wide text-neutral-500">
                {friend.username}
              </span>
              <RemoveFriendButton friendId={friend.id} />
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <SoloPicker />
        <PartnerPicker friends={friends} />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">Selecionados por voce</h2>
          <p className="text-sm text-neutral-400">
            Gire o carrossel para encontrar o proximo destaque que voce adicionou a sua lista.
          </p>
        </div>
        <ListCarousel items={listItems} />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">Historico individual</h2>
          <ul className="mt-4 space-y-3 text-sm text-neutral-400">
            {user.pickHistory.map((entry) => (
              <li key={entry.id}>
                <span className="font-medium text-neutral-100">{entry.item.title}</span> em {" "}
                {entry.pickedAt.toLocaleDateString("pt-BR")}
              </li>
            ))}
            {user.pickHistory.length === 0 && <li>Ainda sem sorteios.</li>}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Historico em dupla</h2>
          <ul className="mt-4 space-y-3 text-sm text-neutral-400">
            {user.sharedPickHistory.map((entry) => (
              <li key={entry.id}>
                Voce e {entry.partner.name ?? entry.partner.username} sortearam
                <span className="font-medium text-neutral-100"> {entry.item.title}</span> em {" "}
                {entry.pickedAt.toLocaleDateString("pt-BR")}
              </li>
            ))}
            {user.sharedPickHistory.length === 0 && <li>Ainda sem sorteios em dupla.</li>}
          </ul>
        </div>
      </section>
    </main>
  );
}
