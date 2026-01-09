"use client";

import { useEffect, useState } from "react";
import { PickSoloState, pickSolo } from "./actions";
import { PickResultModal, PickedItem } from "@/components/pick-result-modal";
import { useActionState } from "@/lib/use-action-state";

const initialState: PickSoloState = {};

export function SoloPicker() {
  const [state, formAction, isPending] = useActionState(pickSolo, initialState);
  const [activePick, setActivePick] = useState<PickedItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (state?.picked) {
      setActivePick(state.picked);
      setModalOpen(true);
    }
  }, [state?.picked]);

  return (
    <>
      <form
        onSubmit={formAction}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
      >
        <div className="pointer-events-none absolute -right-12 -top-14 h-32 w-32 rounded-full bg-emerald-500/15 blur-[90px]" />
        <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Solo</p>
        <h2 className="text-xl font-semibold">Sorteio rápido</h2>
        <p className="mb-4 text-sm text-neutral-400">
          Escolhe aleatoriamente um item da sua lista não assistido.
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-full bg-emerald-400 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-emerald-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-300 disabled:opacity-60"
        >
          {isPending ? "Sorteando..." : "Sortear agora"}
        </button>
        {state?.picked && (
          <div className="mt-4 flex items-center justify-between rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
            <span className="text-sm font-semibold text-emerald-300">Sorteio pronto!</span>
            <button
              type="button"
              className="text-xs font-semibold uppercase tracking-wider text-emerald-200 hover:text-emerald-100"
              onClick={() => setModalOpen(true)}
            >
              Ver detalhes
            </button>
          </div>
        )}
        {state?.message && <p className="mt-3 text-sm text-red-400">{state.message}</p>}
      </form>
      <PickResultModal item={activePick} open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
