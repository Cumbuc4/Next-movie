import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AddFriendForm } from "@/app/dashboard/add-friend-form";
import { IncomingFriendRequests, OutgoingFriendRequests } from "@/app/dashboard/friend-requests";
import { RemoveFriendButton } from "@/app/dashboard/remove-friend-button";

export default async function FriendsPage() {
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

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-10">
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-950/70 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/15 blur-[140px]" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="relative space-y-3">
          <p className="text-xs uppercase tracking-widest text-neutral-500">Conexões</p>
          <h1 className="text-3xl font-semibold">Amigos e convites</h1>
          <p className="max-w-2xl text-sm text-neutral-400">
            Compartilhe seu ID único, envie convites e veja o perfil dos seus amigos.
          </p>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <AddFriendForm />
        <IncomingFriendRequests requests={incomingRequests} />
        <OutgoingFriendRequests requests={outgoingRequests} />
      </section>

      <section className="rounded-2xl border border-white/10 bg-neutral-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Seus amigos</h2>
            <p className="text-sm text-neutral-400">
              Compartilhe seu nome de usuário para conectar e liberar os sorteios em dupla.
            </p>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wider text-neutral-400">
            {friends.length} conexões
          </span>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-neutral-300">
          {friends.length === 0 && <li>Nenhum amigo adicionado ainda.</li>}
          {friends.map((friend) => (
            <li
              key={friend.id}
              className="rounded-xl border border-white/10 bg-neutral-950/80 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
            >
              <Link href={`/friends/${friend.username}`} className="group block">
                <span className="block font-semibold text-neutral-100 group-hover:text-neutral-50">
                  {friend.name ?? friend.username}
                </span>
                <span className="font-mono text-xs uppercase tracking-wide text-neutral-500 group-hover:text-neutral-300">
                  {friend.username}
                </span>
                <span className="mt-3 inline-flex rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-neutral-500 transition group-hover:border-white/30 group-hover:text-neutral-300">
                  Ver perfil
                </span>
              </Link>
              <RemoveFriendButton friendId={friend.id} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
