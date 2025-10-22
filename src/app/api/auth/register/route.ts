import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { db } from "@/lib/db";
import { generateLoginCode, hashLoginCode } from "@/lib/login-code";

const USERNAME_REGEX = /^[a-z0-9]+$/i;

const registerSchema = z.object({
  name: z.string().min(2, "Nome muito curto").max(100, "Nome muito longo"),
  username: z
    .string()
    .min(3, "O nome de usuário deve ter pelo menos 3 caracteres")
    .max(24, "O nome de usuário deve ter no máximo 24 caracteres")
    .regex(USERNAME_REGEX, "Use apenas letras e números no nome de usuário."),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { name, username } = registerSchema.parse(json);

    const normalizedUsername = username.toLowerCase();

    const existing = await db.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Este nome de usuário já está em uso. Escolha outro." },
        { status: 409 },
      );
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
          { error: "Nao foi possivel gerar um codigo exclusivo. Tente novamente." },
          { status: 500 },
        );
      }
    }

    const user = await db.user.create({
      data: { name, username: normalizedUsername, loginCodeHash },
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
