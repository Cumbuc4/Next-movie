"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

export type PickSoloState = {
  message?: string;
  picked?: {
    id: string;
    title: string;
  };
};

export async function pickSolo(prevState: PickSoloState, _formData: FormData): Promise<PickSoloState> {
  const session = await auth();
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return { message: "Sessão expirada" };
  }

  const user = await db.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    return { message: "Sessão expirada" };
  }

  const items = await db.listItem.findMany({
    where: { ownerId: user.id, watched: false },
  });

  if (items.length === 0) {
    return { message: "Lista vazia" };
  }

  const picked = items[Math.floor(Math.random() * items.length)];
  await db.pickHistory.create({ data: { ownerId: user.id, itemId: picked.id } });
  revalidatePath("/dashboard");
  return { picked: { id: picked.id, title: picked.title } };
}

const PickWithSchema = z.object({ partnerId: z.string().cuid() });

export type PickWithState = {
  error?: string;
  success?: string;
};

export async function pickWith(prevState: PickWithState, formData: FormData): Promise<PickWithState> {
  const session = await auth();
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return { error: "Sessão expirada" };
  }

  const me = await db.user.findUnique({ where: { email: userEmail } });
  if (!me) {
    return { error: "Sessão expirada" };
  }

  const parse = PickWithSchema.safeParse({ partnerId: formData.get("partnerId") });
  if (!parse.success) {
    return { error: "Parceiro inválido" };
  }

  if (parse.data.partnerId === me.id) {
    return { error: "Selecione um parceiro diferente" };
  }

  const friendship = await db.friendship.findFirst({
    where: {
      OR: [
        { aId: me.id, bId: parse.data.partnerId },
        { aId: parse.data.partnerId, bId: me.id },
      ],
    },
  });

  if (!friendship) {
    return { error: "Convide o parceiro antes de sortear" };
  }

  const [mine, theirs] = await Promise.all([
    db.listItem.findMany({ where: { ownerId: me.id, watched: false } }),
    db.listItem.findMany({ where: { ownerId: parse.data.partnerId, watched: false } }),
  ]);

  const pool = [...mine, ...theirs];
  if (pool.length === 0) {
    return { error: "Listas vazias" };
  }

  const picked = pool[Math.floor(Math.random() * pool.length)];
  await db.sharedPickHistory.create({
    data: {
      pickerId: me.id,
      partnerId: parse.data.partnerId,
      itemId: picked.id,
    },
  });

  revalidatePath("/dashboard");
  return { success: picked.title };
}
