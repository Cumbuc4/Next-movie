"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PrismaRateLimiter } from "@/lib/rate-limit";

const USERNAME_REGEX = /^[a-z0-9]+$/i;
const friendRequestLimiter = new PrismaRateLimiter(10 * 60 * 1000, 8);

export type PickSoloState = {
  message?: string;
  picked?: {
    id: string;
    title: string;
  };
};

export async function pickSolo(prevState: PickSoloState, formData: FormData): Promise<PickSoloState> {
  void prevState;
  void formData;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { message: "Sessão expirada" };
  }

  const items = await db.listItem.findMany({
    where: { ownerId: userId, watched: false },
  });

  if (items.length === 0) {
    return { message: "Lista vazia" };
  }

  const picked = items[Math.floor(Math.random() * items.length)];

  await db.pickHistory.create({
    data: { ownerId: userId, itemId: picked.id },
  });

  revalidatePath("/dashboard");

  return { picked: { id: picked.id, title: picked.title } };
}

const PickWithSchema = z.object({ partnerId: z.string().cuid() });

export type PickWithState = {
  error?: string;
  success?: string;
};

export async function pickWith(prevState: PickWithState, formData: FormData): Promise<PickWithState> {
  void prevState;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "Sessão expirada" };
  }

  const parseResult = PickWithSchema.safeParse({ partnerId: formData.get("partnerId") });
  if (!parseResult.success) {
    return { error: "Parceiro inválido" };
  }

  const partnerId = parseResult.data.partnerId;

  if (partnerId === userId) {
    return { error: "Selecione um parceiro diferente" };
  }

  const friendship = await db.friendship.findFirst({
    where: {
      OR: [
        { aId: userId, bId: partnerId },
        { aId: partnerId, bId: userId },
      ],
    },
  });

  if (!friendship) {
    return { error: "Convite ainda pendente. Aceite a solicitação antes de sortear." };
  }

  const [mine, theirs] = await Promise.all([
    db.listItem.findMany({ where: { ownerId: userId, watched: false } }),
    db.listItem.findMany({ where: { ownerId: partnerId, watched: false } }),
  ]);

  const pool = [...mine, ...theirs];
  if (pool.length === 0) {
    return { error: "Listas vazias" };
  }

  const picked = pool[Math.floor(Math.random() * pool.length)];

  await db.sharedPickHistory.create({
    data: {
      pickerId: userId,
      partnerId,
      itemId: picked.id,
    },
  });

  revalidatePath("/dashboard");
  return { success: picked.title };
}

const AddFriendSchema = z.object({
  username: z
    .string()
    .min(3, "Informe um nome de usuário válido.")
    .max(24, "Informe um nome de usuário válido.")
    .regex(USERNAME_REGEX, "Informe um nome de usuário válido."),
});

export type AddFriendState = {
  error?: string;
  success?: string;
};

export async function addFriend(prevState: AddFriendState, formData: FormData): Promise<AddFriendState> {
  void prevState;

  const session = await auth();
  const userId = session?.user?.id;
  const myUsername = session?.user?.username;

  if (!userId || !myUsername) {
    return { error: "Sessão expirada" };
  }

  const rawUsername = formData.get("username");
  const parsed = AddFriendSchema.safeParse({
    username: typeof rawUsername === "string" ? rawUsername : "",
  });

  if (!parsed.success) {
    return { error: "Use um nome de usuário com letras e números (3-24 caracteres)." };
  }

  const username = parsed.data.username.toLowerCase();

  if (username === myUsername) {
    return { error: "Você não pode enviar convite para si mesmo." };
  }

  const limiterHit = await friendRequestLimiter.hit(`friend-request:${userId}`);
  if (!limiterHit.allowed) {
    return { error: "Muitos convites em sequência. Tente novamente em alguns minutos." };
  }

  const friend = await db.user.findUnique({
    where: { username },
    select: { id: true, username: true, name: true },
  });

  if (!friend) {
    return { error: "Nome de usuário não encontrado." };
  }

  const existingFriendship = await db.friendship.findFirst({
    where: {
      OR: [
        { aId: userId, bId: friend.id },
        { aId: friend.id, bId: userId },
      ],
    },
  });

  if (existingFriendship) {
    return { error: "Vocês já são amigos." };
  }

  const outgoingRequest = await db.friendRequest.findUnique({
    where: { requesterId_recipientId: { requesterId: userId, recipientId: friend.id } },
  });

  if (outgoingRequest && outgoingRequest.status === "PENDING") {
    return { error: "Você já enviou um convite para esse usuário." };
  }

  const incomingRequest = await db.friendRequest.findUnique({
    where: { requesterId_recipientId: { requesterId: friend.id, recipientId: userId } },
  });

  if (incomingRequest && incomingRequest.status === "PENDING") {
    return { error: "Esse usuário já te convidou. Acesse suas solicitações pendentes para responder." };
  }

  await db.friendRequest.upsert({
    where: { requesterId_recipientId: { requesterId: userId, recipientId: friend.id } },
    update: {
      status: "PENDING",
      respondedAt: null,
      createdAt: new Date(),
    },
    create: {
      requesterId: userId,
      recipientId: friend.id,
    },
  });

  revalidatePath("/dashboard");
  return {
    success: `Convite enviado para ${friend.name ?? friend.username}. Aguarde a confirmação.`,
  };
}

const RespondSchema = z.object({
  requestId: z.string().cuid(),
  decision: z.enum(["accept", "decline"]),
});

export type FriendRequestActionState = {
  error?: string;
  success?: string;
};

export async function respondFriendRequest(
  prevState: FriendRequestActionState,
  formData: FormData,
): Promise<FriendRequestActionState> {
  void prevState;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "Sessão expirada" };
  }

  const parsed = RespondSchema.safeParse({
    requestId: formData.get("requestId"),
    decision: formData.get("decision"),
  });

  if (!parsed.success) {
    return { error: "Solicitação inválida." };
  }

  const request = await db.friendRequest.findUnique({
    where: { id: parsed.data.requestId },
    select: {
      id: true,
      status: true,
      requesterId: true,
      recipientId: true,
    },
  });

  if (!request || request.recipientId !== userId) {
    return { error: "Convite não encontrado." };
  }

  if (request.status !== "PENDING") {
    return { error: "Este convite já foi respondido." };
  }

  const now = new Date();

  if (parsed.data.decision === "decline") {
    await db.friendRequest.update({
      where: { id: request.id },
      data: { status: "DECLINED", respondedAt: now },
    });
    revalidatePath("/dashboard");
    return { success: "Convite recusado." };
  }

  const [aId, bId] =
    userId < request.requesterId ? [userId, request.requesterId] : [request.requesterId, userId];

  await db.$transaction([
    db.friendRequest.update({
      where: { id: request.id },
      data: { status: "ACCEPTED", respondedAt: now },
    }),
    db.friendship.upsert({
      where: { aId_bId: { aId, bId } },
      create: { aId, bId },
      update: {},
    }),
  ]);

  revalidatePath("/dashboard");
  return { success: "Convite aceito. Agora vocês são amigos!" };
}

const CancelSchema = z.object({
  requestId: z.string().cuid(),
});

export async function cancelFriendRequest(
  prevState: FriendRequestActionState,
  formData: FormData,
): Promise<FriendRequestActionState> {
  void prevState;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "Sessão expirada" };
  }

  const parsed = CancelSchema.safeParse({ requestId: formData.get("requestId") });
  if (!parsed.success) {
    return { error: "Solicitação inválida." };
  }

  const request = await db.friendRequest.findUnique({
    where: { id: parsed.data.requestId },
    select: { requesterId: true, status: true },
  });

  if (!request || request.requesterId !== userId) {
    return { error: "Convite não encontrado." };
  }

  if (request.status !== "PENDING") {
    return { error: "Este convite já foi respondido." };
  }

  await db.friendRequest.delete({ where: { id: parsed.data.requestId } });

  revalidatePath("/dashboard");
  return { success: "Convite cancelado." };
}

const RemoveFriendSchema = z.object({
  friendId: z.string().cuid(),
});

export type RemoveFriendState = {
  error?: string;
  success?: string;
};

export async function removeFriend(
  prevState: RemoveFriendState,
  formData: FormData,
): Promise<RemoveFriendState> {
  void prevState;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "Sessǜo expirada" };
  }

  const parsed = RemoveFriendSchema.safeParse({ friendId: formData.get("friendId") });
  if (!parsed.success) {
    return { error: "Amigo invǭlido." };
  }

  const friendId = parsed.data.friendId;

  if (friendId === userId) {
    return { error: "Amigo invǭlido." };
  }

  const friendship = await db.friendship.findFirst({
    where: {
      OR: [
        { aId: userId, bId: friendId },
        { aId: friendId, bId: userId },
      ],
    },
    select: { id: true },
  });

  if (!friendship) {
    return { error: "Amizade nǜo encontrada." };
  }

  await db.friendship.delete({ where: { id: friendship.id } });

  revalidatePath("/dashboard");
  return { success: "Amizade removida." };
}
