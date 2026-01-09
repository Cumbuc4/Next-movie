"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AddFriendState, addFriend } from "./actions";
import { useActionState } from "@/lib/use-action-state";

const initialState: AddFriendState = {};

export function AddFriendForm() {
  const [state, formAction, isPending] = useActionState(addFriend, initialState);
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (state?.success) {
      startTransition(() => router.refresh());
    }
  }, [state?.success, router, startTransition]);

  return (
    <form
      onSubmit={formAction}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-500/15 blur-[80px]" />
      <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Conexões</p>
      <h2 className="mt-2 text-xl font-semibold">Adicionar amigo</h2>
      <p className="mb-4 text-sm text-neutral-400">
        Informe o nome de usuário do seu amigo para conectar e liberar os sorteios em dupla.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          name="username"
          type="text"
          required
          minLength={3}
          maxLength={24}
          pattern="[A-Za-z0-9]+"
          placeholder="ex: cineamigo123"
          className="flex-1 rounded-full border border-white/10 bg-neutral-950/90 px-4 py-2 font-mono text-sm uppercase tracking-wide text-neutral-100 focus:border-emerald-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-950 hover:bg-emerald-300 disabled:opacity-60 sm:w-auto sm:flex-none"
        >
          {isPending ? "Enviando..." : "Convidar"}
        </button>
      </div>
      {state?.error && <p className="mt-3 text-sm text-red-400">{state.error}</p>}
      {state?.success && <p className="mt-3 text-sm text-emerald-400">{state.success}</p>}
    </form>
  );
}
