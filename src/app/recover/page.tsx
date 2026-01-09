import Link from "next/link";
import { RecoverForm } from "./recover-form";

export default function RecoverPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-10 px-6 py-16">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold">Recuperar código</h1>
        <p className="text-neutral-400">
          Informe o email cadastrado para gerar um novo código de acesso.
        </p>
      </header>
      <RecoverForm />
      <p className="text-center text-sm text-neutral-400">
        Lembrou do código?{" "}
        <Link className="font-semibold text-neutral-100 hover:underline" href="/login">
          Voltar ao login
        </Link>
      </p>
    </main>
  );
}
