"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";

export function LoginForm() {
  const [loginCode, setLoginCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);

        startTransition(async () => {
          const result = await signIn("credentials", {
            redirect: false,
            loginCode,
          });

          if (result?.error) {
            setError(
              result.error === "CredentialsSignin"
                ? "Codigo invalido. Verifique os caracteres informados."
                : result.error,
            );
            return;
          }

          window.location.href = "/dashboard";
        });
      }}
    >
      <div className="space-y-1">
        <label className="text-sm text-neutral-300" htmlFor="login-code">
          Codigo de acesso
        </label>
        <input
          id="login-code"
          type="text"
          required
          value={loginCode}
          onChange={(event) =>
            setLoginCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20))
          }
          className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm uppercase tracking-wide focus:border-emerald-400 focus:outline-none"
          placeholder="ex: 7F4K2M9P1QRS"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
      >
        {isPending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
