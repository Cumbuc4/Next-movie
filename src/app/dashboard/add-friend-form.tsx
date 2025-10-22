"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AddFriendState, addFriend } from "./actions";

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
    <form action={formAction} className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Adicionar amigo</h2>
      <p className="mb-4 text-sm text-neutral-400">
        Informe o nome de usuario do seu amigo para conectarem-se e habilitar os sorteios em dupla.
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
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-sm uppercase tracking-wide focus:border-emerald-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60 sm:w-auto sm:flex-none"
        >
          {isPending ? "Enviando..." : "Convidar"}
        </button>
      </div>
      {state?.error && <p className="mt-3 text-sm text-red-400">{state.error}</p>}
      {state?.success && <p className="mt-3 text-sm text-emerald-400">{state.success}</p>}
    </form>
  );
}
