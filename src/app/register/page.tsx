import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "./register-form";
import { auth } from "@/lib/auth";

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-10 px-6 py-16">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold">Crie seu ID de acesso</h1>
        <p className="text-neutral-400">
          Informe como devemos te chamar e escolha um nome de usuário único. Geraremos o ID que você usará para entrar sempre que quiser.
        </p>
      </header>
      <RegisterForm />
      <p className="text-center text-sm text-neutral-400">
        Já recebeu um ID?{" "}
        <Link className="font-semibold text-neutral-100 hover:underline" href="/login">
          Acesse aqui
        </Link>
      </p>
    </main>
  );
}
