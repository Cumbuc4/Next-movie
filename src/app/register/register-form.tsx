"use client";

import { FormEvent, useState, useTransition } from "react";
import { signIn } from "next-auth/react";

const USERNAME_REGEX = /^[a-z0-9]+$/i;

type RegisterResponse = {
  success: boolean;
  loginCode: string;
  username: string;
};

export function RegisterForm() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [createdLoginCode, setCreatedLoginCode] = useState<string | null>(null);
  const [createdUsername, setCreatedUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const safeUsername = username.trim().toLowerCase();
    if (!USERNAME_REGEX.test(username) || safeUsername.length < 3 || safeUsername.length > 24) {
      setError("Escolha um nome de usuário com 3-24 letras ou números.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            username: safeUsername,
            email: email.trim() ? email.trim().toLowerCase() : null,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          setError(data?.error ?? "Não foi possível criar sua conta.");
          return;
        }

        const data = (await response.json()) as RegisterResponse;
        setCreatedLoginCode(data.loginCode);
        setCreatedUsername(data.username);
        setName("");
        setUsername("");
        setEmail("");
      } catch (requestError) {
        console.error(requestError);
        setError("Ocorreu um erro inesperado. Tente novamente.");
      }
    });
  };

  const copyToClipboard = async (value: string, target: "code" | "username") => {
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        return;
      }
      await navigator.clipboard.writeText(value);
      if (target === "code") {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2500);
      } else {
        setCopiedUsername(true);
        setTimeout(() => setCopiedUsername(false), 2500);
      }
    } catch (clipboardError) {
      console.error(clipboardError);
    }
  };

  if (createdLoginCode && createdUsername) {
    return (
      <div className="space-y-5 rounded-lg border border-emerald-500/20 bg-neutral-900/50 p-6">
        <h2 className="text-xl font-semibold text-emerald-400">Conta criada com sucesso!</h2>
        <p className="text-sm text-neutral-300">
          Guarde os dados abaixo. Use o código de acesso para entrar e compartilhe seu nome de usuário com amigos para conectarem-se.
        </p>
        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-500">Código de acesso</p>
            <div className="mt-1 flex items-center justify-between gap-3 rounded-md border border-dashed border-emerald-500/40 bg-neutral-950 px-4 py-3">
              <span className="font-mono text-lg tracking-wider text-emerald-300">{createdLoginCode}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(createdLoginCode, "code")}
                className="rounded-md border border-emerald-400 px-3 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10"
              >
                {copiedCode ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-500">Nome de usuário</p>
            <div className="mt-1 flex items-center justify-between gap-3 rounded-md border border-dashed border-emerald-500/40 bg-neutral-950 px-4 py-3">
              <span className="font-mono text-lg tracking-wider text-emerald-300">{createdUsername}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(createdUsername, "username")}
                className="rounded-md border border-emerald-400 px-3 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10"
              >
                {copiedUsername ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              signIn("credentials", { redirect: true, loginCode: createdLoginCode });
            }}
            className="w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400"
          >
            Entrar agora
          </button>
          <button
            type="button"
            onClick={() => {
              setCreatedLoginCode(null);
              setCreatedUsername(null);
            }}
            className="w-full rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-500 hover:text-neutral-100"
          >
            Criar outro cadastro
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label className="text-sm text-neutral-300" htmlFor="name">
          Como devemos te chamar?
        </label>
        <input
          id="name"
          type="text"
          required
          minLength={2}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          placeholder="Digite seu nome ou apelido"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-neutral-300" htmlFor="email">
          Email para recuperação (opcional)
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          placeholder="você@email.com"
          autoComplete="email"
        />
        <p className="text-xs text-neutral-500">
          Use este email para recuperar seu código se esquecer.
        </p>
      </div>
      <div className="space-y-1">
        <label className="text-sm text-neutral-300" htmlFor="username">
          Escolha um nome de usuário único
        </label>
        <input
          id="username"
          type="text"
          required
          minLength={3}
          maxLength={24}
          value={username}
          onChange={(event) => {
            const value = event.target.value.replace(/[^a-z0-9]/gi, "");
            setUsername(value);
          }}
          className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-sm uppercase tracking-wide focus:border-emerald-400 focus:outline-none"
          placeholder="ex: FILMELOVER123"
          pattern="[A-Za-z0-9]+"
        />
        <p className="text-xs text-neutral-500">Somente letras e números, até 24 caracteres.</p>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
      >
        {isPending ? "Gerando código..." : "Criar código de acesso"}
      </button>
    </form>
  );
}
