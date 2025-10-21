"use client";

import { useFormState } from "react-dom";
import { PickWithState, pickWith } from "./actions";

type Friend = {
  id: string;
  name: string | null;
  email: string;
};

const initialState: PickWithState = {};

export function PartnerPicker({ friends }: { friends: Friend[] }) {
  const [state, formAction] = useFormState(pickWith, initialState);

  if (friends.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 text-sm text-neutral-400">
        <h2 className="text-xl font-semibold text-neutral-100">Sorteio em dupla</h2>
        <p className="mt-2">
          Adicione amigos à sua rede para desbloquear sorteios em dupla. Compartilhe sua lista e aproveite!
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Sorteio em dupla</h2>
      <p className="mb-4 text-sm text-neutral-400">Combina sua lista com a do parceiro escolhido.</p>
      <select
        name="partnerId"
        className="mb-4 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
        required
        defaultValue={friends[0]?.id}
      >
        {friends.map((friend) => (
          <option key={friend.id} value={friend.id}>
            {friend.name ?? friend.email}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="w-full rounded-lg bg-indigo-500 px-4 py-3 font-semibold text-indigo-950 hover:bg-indigo-400"
      >
        Sortear com parceiro
      </button>
      {state?.error && <p className="mt-3 text-sm text-red-400">{state.error}</p>}
      {state?.success && <p className="mt-3 text-sm text-emerald-400">Sorteado: {state.success}</p>}
    </form>
  );
}
