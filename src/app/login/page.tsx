import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./signin-form";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function LoginPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const session = await auth();
  const resolvedParams = await searchParams;
  const rawError = resolvedParams?.error;
  const normalizedError = Array.isArray(rawError) ? rawError[0] : rawError;

  if (session?.user && !normalizedError) {
    redirect("/dashboard");
  }

  const showSessionError = normalizedError === "session";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-10 px-6 py-16">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold">Acesse sua conta</h1>
        <p className="text-neutral-400">
          Informe o código gerado no cadastro para continuar organizando suas listas.
        </p>
        {showSessionError && (
          <p className="rounded-md border border-yellow-500/40 bg-yellow-500/5 px-3 py-2 text-sm text-yellow-200">
            Sua sessão anterior expirou ou não é mais válida. Faça login novamente para continuar.
          </p>
        )}
      </header>
      <LoginForm />
      <p className="text-center text-sm text-neutral-400">
        Esqueceu o código?{" "}
        <Link className="font-semibold text-neutral-100 hover:underline" href="/recover">
          Recuperar acesso
        </Link>
      </p>
      <p className="text-center text-sm text-neutral-400">
        Ainda não tem conta?{" "}
        <Link className="font-semibold text-neutral-100 hover:underline" href="/register">
          Cadastre-se aqui
        </Link>
      </p>
    </main>
  );
}
