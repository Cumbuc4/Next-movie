"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, UpdateProfileState } from "../dashboard/actions";
import { useActionState } from "@/lib/use-action-state";
import { avatarOptions, isAvatarOption } from "@/lib/avatar-options";

type ProfileFormProps = {
  user: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
    email: string | null;
  };
};

const initialState: UpdateProfileState = {};

export function ProfileForm({ user }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, initialState);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const initialAvatar = user.image ?? "";
  const [selectedAvatar, setSelectedAvatar] = useState(initialAvatar);

  useEffect(() => {
    if (state?.success) {
      startTransition(() => router.refresh());
    }
  }, [state?.success, router, startTransition]);

  const avatarInitial = (user.name ?? user.username ?? "U").slice(0, 1).toUpperCase();
  const avatarPreview = selectedAvatar || "";
  const customAvatar =
    user.image && !isAvatarOption(user.image)
      ? { id: "current", label: "Avatar atual", url: user.image }
      : null;
  const avatarChoices = [
    { id: "none", label: "Sem foto", url: "" },
    ...(customAvatar ? [customAvatar] : []),
    ...avatarOptions.map((url, index) => ({ id: `avatar-${index}`, label: `Avatar ${index + 1}`, url })),
  ];

  return (
    <form
      onSubmit={formAction}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
    >
      <input type="hidden" name="image" value={selectedAvatar} />
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-emerald-500/15 blur-[90px]" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-blue-500/10 blur-[80px]" />
      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Seu perfil</p>
            <h2 className="mt-2 text-xl font-semibold">Seus dados</h2>
            <p className="text-sm text-neutral-400">Atualize seu nome, ID único, email e avatar.</p>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-emerald-400 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-300 disabled:opacity-60"
          >
            {isPending ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[auto,1fr]">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-neutral-900 text-lg font-semibold text-neutral-200">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar selecionado" className="h-full w-full object-cover" />
              ) : (
                <span>{avatarInitial}</span>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">ID único</p>
              <p className="font-mono text-sm text-neutral-200">{user.username}</p>
              <p className="text-xs text-neutral-500">Use este ID para adicionar amigos.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label
                htmlFor="profile-name"
                className="text-[10px] uppercase tracking-[0.35em] text-neutral-500"
              >
                Nome
              </label>
              <input
                id="profile-name"
                name="name"
                type="text"
                defaultValue={user.name ?? ""}
                minLength={2}
                maxLength={60}
                placeholder="Seu nome ou apelido"
                className="w-full rounded-full border border-white/10 bg-neutral-950/90 px-4 py-2 text-sm text-neutral-100 focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="profile-username"
                className="text-[10px] uppercase tracking-[0.35em] text-neutral-500"
              >
                ID único
              </label>
              <input
                id="profile-username"
                name="username"
                type="text"
                required
                minLength={3}
                maxLength={24}
                defaultValue={user.username}
                pattern="[A-Za-z0-9]+"
                className="w-full rounded-full border border-white/10 bg-neutral-950/90 px-4 py-2 font-mono text-sm uppercase tracking-wide text-neutral-100 focus:border-emerald-400 focus:outline-none"
              />
              <p className="text-xs text-neutral-500">Somente letras e números.</p>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label
                htmlFor="profile-email"
                className="text-[10px] uppercase tracking-[0.35em] text-neutral-500"
              >
                Email de recuperação
              </label>
              <input
                id="profile-email"
                name="email"
                type="email"
                placeholder="você@email.com"
                defaultValue={user.email ?? ""}
                className="w-full rounded-full border border-white/10 bg-neutral-950/90 px-4 py-2 text-sm text-neutral-100 focus:border-emerald-400 focus:outline-none"
              />
              <p className="text-xs text-neutral-500">Use este email para recuperar seu código.</p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-[0.35em] text-neutral-500">
                  Avatar
                </label>
                <span className="text-[10px] uppercase tracking-[0.35em] text-neutral-500">
                  Escolha um
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {avatarChoices.map((choice) => {
                  const isSelected = selectedAvatar === choice.url;
                  return (
                    <label
                      key={choice.id}
                      className={`flex cursor-pointer items-center justify-center rounded-2xl border bg-neutral-950/80 p-2 transition ${
                        isSelected
                          ? "border-emerald-400 ring-2 ring-emerald-400/30"
                          : "border-white/10 hover:border-white/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="avatar-choice"
                        value={choice.url}
                        checked={isSelected}
                        onChange={() => setSelectedAvatar(choice.url)}
                        className="sr-only"
                      />
                      {choice.url ? (
                        <img
                          src={choice.url}
                          alt={choice.label}
                          className="h-12 w-12 rounded-xl object-cover"
                        />
                      ) : (
                        <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">
                          Sem foto
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-neutral-500">Escolha um avatar pré-definido.</p>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label
                htmlFor="profile-id"
                className="text-[10px] uppercase tracking-[0.35em] text-neutral-500"
              >
                ID interno
              </label>
              <input
                id="profile-id"
                type="text"
                value={user.id}
                readOnly
                className="w-full cursor-not-allowed rounded-full border border-white/10 bg-neutral-900/60 px-4 py-2 font-mono text-sm text-neutral-500"
              />
            </div>
          </div>
        </div>

        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        {state?.success && <p className="text-sm text-emerald-400">{state.success}</p>}
      </div>
    </form>
  );
}
