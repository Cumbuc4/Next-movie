import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const BodySchema = z.object({
  itemId: z.string().cuid(),
});

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { itemId } = BodySchema.parse(await request.json());

  await db.listItem.updateMany({
    where: {
      id: itemId,
      ownerId: userId,
    },
    data: {
      archived: true,
    },
  });

  return new Response(null, { status: 204 });
}
