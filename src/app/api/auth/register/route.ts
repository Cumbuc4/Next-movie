import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { db } from "@/lib/db";
import { generateLoginCode, hashLoginCode } from "@/lib/login-code";
import { PrismaRateLimiter } from "@/lib/rate-limit";

const USERNAME_REGEX = /^[a-z0-9]+$/i;
const registerLimiter = new PrismaRateLimiter(10 * 60 * 1000, 5);

const registerSchema = z.object({
  name: z.string().min(2, "Nome muito curto").max(100, "Nome muito longo"),
  username: z
    .string()
    .min(3, "O nome de usuário deve ter pelo menos 3 caracteres")
    .max(24, "O nome de usuário deve ter no máximo 24 caracteres")
    .regex(USERNAME_REGEX, "Use apenas letras e números no nome de usuário."),
  email: z.string().email("Email inválido.").nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const hit = await registerLimiter.hit(`register:${ip}`);
    if (!hit.allowed) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente em alguns minutos." },
        { status: 429 },
      );
    }

    const json = await request.json();
    const { name, username, email } = registerSchema.parse(json);

    const normalizedUsername = username.toLowerCase();
    const normalizedEmail = email ? email.toLowerCase() : null;

    const existing = await db.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Este nome de usuário já está em uso. Escolha outro." },
        { status: 409 },
      );
    }

    if (normalizedEmail) {
      const existingEmail = await db.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: "Este email já está em uso. Escolha outro." },
          { status: 409 },
        );
      }
    }

    let loginCode = "";
    let loginCodeHash = "";
    let attempts = 0;

    while (attempts < 5) {
      attempts += 1;
      loginCode = generateLoginCode();
      loginCodeHash = hashLoginCode(loginCode);
      const existingCode = await db.user.findUnique({
        where: { loginCodeHash },
        select: { id: true },
      });
      if (!existingCode) {
        break;
      }
      if (attempts === 5) {
        return NextResponse.json(
          { error: "Não foi possível gerar um código exclusivo. Tente novamente." },
          { status: 500 },
        );
      }
    }

    const user = await db.user.create({
      data: { name, username: normalizedUsername, loginCodeHash, email: normalizedEmail },
      select: { username: true },
    });

    return NextResponse.json({
      success: true,
      loginCode,
      username: user.username,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 },
      );
    }

    console.error("[register] unexpected error", error);
    return NextResponse.json({ error: "Erro interno ao registrar." }, { status: 500 });
  }
}
