import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { LoginForm } from "./signin-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-10 px-6 py-16">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold">Acesse sua conta</h1>
        <p className="text-neutral-400">
          Entre com Google, GitHub ou use seu email e senha para continuar organizando suas listas.
        </p>
      </header>
      <form
        action={async () => {
          "use server";
          await signIn("google");
        }}
      >
        <button
          type="submit"
          className="w-full rounded-lg border border-neutral-700 px-4 py-3 font-semibold text-neutral-100 transition hover:border-neutral-500"
        >
          Entrar com Google
        </button>
      </form>
      <form
        action={async () => {
          "use server";
          await signIn("github");
        }}
      >
        <button
          type="submit"
          className="w-full rounded-lg border border-neutral-700 px-4 py-3 font-semibold text-neutral-100 transition hover:border-neutral-500"
        >
          Entrar com GitHub
        </button>
      </form>
      <LoginForm />
    </main>
  );
}
