"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RemoveFriendState, removeFriend } from "./actions";
import { useActionState } from "@/lib/use-action-state";

const initialState: RemoveFriendState = {};

type RemoveFriendButtonProps = {
  friendId: string;
};

export function RemoveFriendButton({ friendId }: RemoveFriendButtonProps) {
  const [state, formAction, isPending] = useActionState(removeFriend, initialState);
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (state?.success) {
      startTransition(() => router.refresh());
    }
  }, [state?.success, router, startTransition]);

  return (
    <form onSubmit={formAction} className="mt-3 space-y-2">
      <input type="hidden" name="friendId" value={friendId} />
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/15 hover:text-red-200 disabled:opacity-60"
      >
        {isPending ? "Removendo..." : "Remover amizade"}
      </button>
      {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
    </form>
  );
}
