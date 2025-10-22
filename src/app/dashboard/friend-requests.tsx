"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FriendRequestActionState,
  cancelFriendRequest,
  respondFriendRequest,
} from "./actions";

type IncomingRequest = {
  id: string;
  requester: {
    name: string | null;
    username: string;
  };
  createdAt: string;
};

type OutgoingRequest = {
  id: string;
  recipient: {
    name: string | null;
    username: string;
  };
  createdAt: string;
};

const initialState: FriendRequestActionState = {};

export function IncomingFriendRequests({ requests }: { requests: IncomingRequest[] }) {
  const [state, formAction, isPending] = useActionState(respondFriendRequest, initialState);
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (state?.success) {
      startTransition(() => router.refresh());
    }
  }, [state?.success, router, startTransition]);

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Solicitações recebidas</h2>
      <p className="mb-4 text-sm text-neutral-400">
        Aceite apenas convites de pessoas que você conhece. Você pode recusar se não reconhecer o usuário.
      </p>
      {state?.error && <p className="mb-3 text-sm text-red-400">{state.error}</p>}
      {state?.success && <p className="mb-3 text-sm text-emerald-400">{state.success}</p>}
      <ul className="space-y-4 text-sm text-neutral-300">
        {requests.length === 0 && <li>Nenhuma solicitação pendente.</li>}
        {requests.map((request) => (
          <li key={request.id} className="rounded-md border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-neutral-100">
                {request.requester.name ?? request.requester.username}
              </span>
              <span className="font-mono text-xs uppercase tracking-wide text-neutral-500">
                {request.requester.username}
              </span>
              <span className="text-xs text-neutral-500">
                Recebido em {new Date(request.createdAt).toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <form action={formAction} className="flex-1">
                <input type="hidden" name="requestId" value={request.id} />
                <input type="hidden" name="decision" value="accept" />
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
                >
                  {isPending ? "Processando..." : "Aceitar"}
                </button>
              </form>
              <form action={formAction} className="flex-1">
                <input type="hidden" name="requestId" value={request.id} />
                <input type="hidden" name="decision" value="decline" />
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-md border border-neutral-700 px-3 py-2 text-xs font-semibold text-neutral-300 hover:border-neutral-500 hover:text-neutral-100 disabled:opacity-60"
                >
                  {isPending ? "Processando..." : "Recusar"}
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OutgoingFriendRequests({ requests }: { requests: OutgoingRequest[] }) {
  const [state, formAction, isPending] = useActionState(cancelFriendRequest, initialState);
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (state?.success) {
      startTransition(() => router.refresh());
    }
  }, [state?.success, router, startTransition]);

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Convites enviados</h2>
      <p className="mb-4 text-sm text-neutral-400">
        Você pode cancelar o convite se tiver convidado a pessoa por engano ou quiser ajustar o nome de usuário.
      </p>
      {state?.error && <p className="mb-3 text-sm text-red-400">{state.error}</p>}
      {state?.success && <p className="mb-3 text-sm text-emerald-400">{state.success}</p>}
      <ul className="space-y-4 text-sm text-neutral-300">
        {requests.length === 0 && <li>Nenhum convite pendente.</li>}
        {requests.map((request) => (
          <li key={request.id} className="rounded-md border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-neutral-100">
                {request.recipient.name ?? request.recipient.username}
              </span>
              <span className="font-mono text-xs uppercase tracking-wide text-neutral-500">
                {request.recipient.username}
              </span>
              <span className="text-xs text-neutral-500">
                Enviado em {new Date(request.createdAt).toLocaleString("pt-BR")}
              </span>
            </div>
            <form action={formAction} className="mt-3">
              <input type="hidden" name="requestId" value={request.id} />
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-md border border-neutral-700 px-3 py-2 text-xs font-semibold text-neutral-300 hover:border-neutral-500 hover:text-neutral-100 disabled:opacity-60"
              >
                {isPending ? "Processando..." : "Cancelar convite"}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
