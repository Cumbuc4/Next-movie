import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      email: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/api/auth/signout?callbackUrl=/login?error=session");
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="grid gap-4 lg:grid-cols-[1.3fr,0.7fr] lg:items-end">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Perfil</p>
          <h1 className="text-3xl font-semibold">Gerencie seus dados</h1>
          <p className="max-w-2xl text-sm text-neutral-400">
            Atualize o nome exibido, o ID único, o email e o avatar do seu perfil.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-neutral-950/70 p-5 text-sm text-neutral-300 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-neutral-900 text-sm font-semibold text-neutral-200">
              {user.image ? (
                <img src={user.image} alt="Avatar atual" className="h-full w-full object-cover" />
              ) : (
                <span>{(user.name ?? user.username ?? "U").slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Conta criada em</p>
              <p className="mt-1 text-lg font-semibold text-neutral-100">
                {user.createdAt.toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            Dica: use seu ID único para conectar amigos.
          </p>
        </div>
      </header>

      <ProfileForm
        user={{
          id: user.id,
          name: user.name,
          username: user.username,
          image: user.image,
          email: user.email,
        }}
      />
    </main>
  );
}
