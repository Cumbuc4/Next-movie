"use client";

import { useActionState } from "react";
import { PickSoloState, pickSolo } from "./actions";

const initialState: PickSoloState = {};

export function SoloPicker() {
  const [state, formAction, isPending] = useActionState(pickSolo, initialState);

  return (
    <form action={formAction} className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Sorteio rápido</h2>
      <p className="mb-4 text-sm text-neutral-400">Escolhe aleatoriamente um item da sua lista não assistido.</p>
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
      >
        {isPending ? "Sorteando..." : "Sortear agora"}
      </button>
      {state?.picked && <p className="mt-3 text-sm text-emerald-400">Sorteado: {state.picked.title}</p>}
      {state?.message && <p className="mt-3 text-sm text-red-400">{state.message}</p>}
    </form>
  );
}
