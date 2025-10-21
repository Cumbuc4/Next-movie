import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { SoloPicker } from "./solo-picker";
import { PartnerPicker } from "./partner-picker";

export default async function DashboardPage() {
  const session = await auth();
  const userEmail = session?.user?.email;

  if (!userEmail) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { email: userEmail },
    include: {
      items: {
        orderBy: { addedAt: "desc" },
      },
      friendshipsA: {
        include: { b: true },
      },
      friendshipsB: {
        include: { a: true },
      },
      pickHistory: {
        orderBy: { pickedAt: "desc" },
        take: 5,
        include: { item: true },
      },
      sharedPickHistory: {
        orderBy: { pickedAt: "desc" },
        take: 5,
        include: { item: true, partner: true },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const friends = [
    ...user.friendshipsA.map((friendship) => friendship.b),
    ...user.friendshipsB.map((friendship) => friendship.a),
  ].map((friend) => ({ id: friend.id, name: friend.name, email: friend.email }));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2 border-b border-neutral-800 pb-6">
        <h1 className="text-3xl font-semibold">Olá, {user.name ?? user.email}</h1>
        <p className="text-neutral-400">
          Gerencie sua lista de filmes e séries, convide amigos e sorteie o próximo item para assistir.
        </p>
        <div className="flex items-center gap-4">
          <Link className="text-sm text-emerald-400 hover:text-emerald-300" href="/list">
            Adicionar novos títulos
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="text-sm text-neutral-400 transition hover:text-neutral-200" type="submit">
              Encerrar sessão
            </button>
          </form>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <SoloPicker />

        <PartnerPicker friends={friends} />
      </section>

      <section>
        <h2 className="text-xl font-semibold">Sua lista ({user.items.length})</h2>
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {user.items.map((item) => (
            <li key={item.id} className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-sm text-neutral-400">{item.type === "MOVIE" ? "Filme" : "Série"}</p>
              <p className="mt-2 text-sm text-neutral-400">{item.overview}</p>
            </li>
          ))}
          {user.items.length === 0 && <p className="text-neutral-500">Nenhum item adicionado ainda.</p>}
        </ul>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">Histórico individual</h2>
          <ul className="mt-4 space-y-3 text-sm text-neutral-400">
            {user.pickHistory.map((entry) => (
              <li key={entry.id}>
                <span className="font-medium text-neutral-100">{entry.item.title}</span> em {entry.pickedAt.toLocaleDateString()}
              </li>
            ))}
            {user.pickHistory.length === 0 && <li>Ainda sem sorteios.</li>}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Histórico em dupla</h2>
          <ul className="mt-4 space-y-3 text-sm text-neutral-400">
            {user.sharedPickHistory.map((entry) => (
              <li key={entry.id}>
                Você e {entry.partner.name ?? entry.partner.email} sortearam
                <span className="font-medium text-neutral-100"> {entry.item.title}</span> em
                {" "}
                {entry.pickedAt.toLocaleDateString()}
              </li>
            ))}
            {user.sharedPickHistory.length === 0 && <li>Ainda sem sorteios em dupla.</li>}
          </ul>
        </div>
      </section>
    </main>
  );
}

