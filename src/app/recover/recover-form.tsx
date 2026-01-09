"use client";

import { FormEvent, useState, useTransition } from "react";

type RecoverResponse = {
  success: boolean;
  loginCode: string | null;
  error?: string;
};

export function RecoverForm() {
  const [email, setEmail] = useState("");
  const [loginCode, setLoginCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const copyToClipboard = async () => {
    if (!loginCode) return;
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        return;
      }
      await navigator.clipboard.writeText(loginCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore clipboard errors.
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setLoginCode(null);

    startTransition(async () => {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setStatus(data?.error ?? "Não foi possível recuperar.");
        return;
      }

      const data = (await res.json()) as RecoverResponse;
      setLoginCode(data.loginCode ?? null);
      setStatus(
        data.loginCode
          ? "Código gerado. Guarde em um local seguro."
          : "Se o email existir, um novo código foi gerado.",
      );
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label className="text-sm text-neutral-300" htmlFor="recover-email">
          Email cadastrado
        </label>
        <input
          id="recover-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          placeholder="você@email.com"
        />
        <p className="text-xs text-neutral-500">
          Se o email estiver configurado, o código chega por lá. Caso contrário, aparece aqui.
        </p>
      </div>
      {status && <p className="text-sm text-neutral-300">{status}</p>}
      {loginCode && (
        <div className="rounded-lg border border-emerald-500/20 bg-neutral-900/50 p-4">
          <p className="text-xs uppercase tracking-widest text-neutral-500">Novo código</p>
          <div className="mt-2 flex items-center justify-between gap-3 rounded-md border border-dashed border-emerald-500/40 bg-neutral-950 px-4 py-3">
            <span className="font-mono text-lg tracking-wider text-emerald-300">{loginCode}</span>
            <button
              type="button"
              onClick={copyToClipboard}
              className="rounded-md border border-emerald-400 px-3 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10"
            >
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </div>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
      >
        {isPending ? "Gerando..." : "Gerar novo código"}
      </button>
    </form>
  );
}
