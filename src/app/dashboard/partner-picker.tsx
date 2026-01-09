"use client";

import { useEffect, useState } from "react";
import { PickWithState, pickWith } from "./actions";
import { PickResultModal, PickedItem } from "@/components/pick-result-modal";
import { useActionState } from "@/lib/use-action-state";

type Friend = {
  id: string;
  name: string | null;
  username: string;
};

const initialState: PickWithState = {};

export function PartnerPicker({ friends }: { friends: Friend[] }) {
  const [state, formAction, isPending] = useActionState(pickWith, initialState);
  const [activePick, setActivePick] = useState<PickedItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (state?.picked) {
      setActivePick(state.picked);
      setModalOpen(true);
    }
  }, [state?.picked]);

  if (friends.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-neutral-950/70 p-6 text-sm text-neutral-400 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <h2 className="text-xl font-semibold text-neutral-100">Sorteio em dupla</h2>
        <p className="mt-2">
          Adicione amigos à sua rede para desbloquear sorteios em dupla. Compartilhe sua lista e aproveite!
        </p>
      </div>
    );
  }

  return (
    <>
      <form
        onSubmit={formAction}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
      >
        <div className="pointer-events-none absolute -left-10 -bottom-12 h-32 w-32 rounded-full bg-indigo-500/15 blur-[90px]" />
        <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Dupla</p>
        <h2 className="mt-2 text-xl font-semibold">Sorteio em dupla</h2>
        <p className="mb-4 text-sm text-neutral-400">Combine sua lista com a do parceiro escolhido.</p>
        <select
          name="partnerId"
          className="mb-4 w-full rounded-full border border-white/10 bg-neutral-950/90 px-4 py-2 text-sm text-neutral-100 focus:border-emerald-400 focus:outline-none"
          required
          defaultValue={friends[0]?.id}
        >
          {friends.map((friend) => (
            <option key={friend.id} value={friend.id}>
              {friend.name ?? friend.username} ({friend.username})
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-full bg-indigo-400 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-indigo-950 shadow-lg shadow-indigo-500/25 hover:bg-indigo-300 disabled:opacity-60"
        >
          {isPending ? "Sorteando..." : "Sortear com parceiro"}
        </button>
        {state?.error && <p className="mt-3 text-sm text-red-400">{state.error}</p>}
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
      </form>
      <PickResultModal item={activePick} open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
