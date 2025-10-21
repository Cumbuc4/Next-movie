import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const BodySchema = z.object({
  itemId: z.string().cuid(),
});

export async function POST(request: Request) {
  const session = await auth();
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await db.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { itemId } = BodySchema.parse(await request.json());

  await db.listItem.deleteMany({
    where: {
      id: itemId,
      ownerId: user.id,
    },
  });

  return new Response(null, { status: 204 });
}
