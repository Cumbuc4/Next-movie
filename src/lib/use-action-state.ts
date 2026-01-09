"use client";

import { useCallback, useState, useTransition } from "react";
import type { FormEvent } from "react";

type ServerAction<State> = (prevState: State, formData: FormData) => Promise<State>;

export function useActionState<State>(action: ServerAction<State>, initialState: State) {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();

  const formAction = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);

      startTransition(async () => {
        try {
          const nextState = await action(state, formData);
          setState(nextState);
        } catch (error) {
          console.error("[action] failed", error);
        }
      });
    },
    [action, state],
  );

  return [state, formAction, isPending] as const;
}
