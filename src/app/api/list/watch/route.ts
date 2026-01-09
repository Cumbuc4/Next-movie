import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const BodySchema = z.object({
  itemId: z.string().cuid(),
  watched: z.boolean(),
});

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { itemId, watched } = BodySchema.parse(await request.json());

  const result = await db.listItem.updateMany({
    where: {
      id: itemId,
      ownerId: userId,
    },
    data: {
      watched,
    },
  });

  if (result.count === 0) {
    return new Response("Not found", { status: 404 });
  }

  return Response.json({ itemId, watched });
}
