import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { db } from "@/lib/db";
import { generateLoginCode, hashLoginCode } from "@/lib/login-code";
import { PrismaRateLimiter } from "@/lib/rate-limit";

const recoverSchema = z.object({
  email: z.string().email("Email inválido."),
});

const recoverLimiter = new PrismaRateLimiter(10 * 60 * 1000, 5);
const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM;
const resendReplyTo = process.env.RESEND_REPLY_TO;
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXTAUTH_URL ??
  "http://localhost:3000";

const sendRecoverEmail = async (to: string, loginCode: string) => {
  if (!resendApiKey || !resendFrom) {
    return false;
  }

  const subject = "Seu novo código de acesso";
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0b0f14; color: #f5f7fb; padding: 24px;">
      <h2 style="margin: 0 0 12px;">Novo código de acesso</h2>
      <p style="margin: 0 0 12px;">Use este código para entrar no Time2Watch:</p>
      <div style="font-size: 20px; font-weight: bold; letter-spacing: 4px; margin: 12px 0;">
        ${loginCode}
      </div>
      <p style="margin: 0 0 12px;">Se você não solicitou isso, ignore este email.</p>
      <a href="${siteUrl}/login" style="color: #34d399;">Ir para o login</a>
    </div>
  `;
  const text = `Seu novo código de acesso: ${loginCode}. Acesse ${siteUrl}/login`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom,
      to,
      subject,
      html,
      text,
      reply_to: resendReplyTo ?? undefined,
    }),
  });

  if (!res.ok) {
    console.error("[recover] resend error", res.status, await res.text());
    return false;
  }

  return true;
};

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const hit = await recoverLimiter.hit(`recover:${ip}`);
    if (!hit.allowed) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente em alguns minutos." },
        { status: 429 },
      );
    }

    if (!resendApiKey || !resendFrom) {
      return NextResponse.json(
        { error: "Recuperacao indisponivel no momento." },
        { status: 503 },
      );
    }

    const json = await request.json();
    const { email } = recoverSchema.parse(json);
    const normalizedEmail = email.trim().toLowerCase();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ success: true });
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

    await db.user.update({
      where: { id: user.id },
      data: { loginCodeHash },
    });

    const sent = await sendRecoverEmail(normalizedEmail, loginCode);
    if (!sent) {
      return NextResponse.json(
        { error: "Falha ao enviar email. Tente novamente." },
        { status: 502 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 },
      );
    }

    console.error("[recover] unexpected error", error);
    return NextResponse.json({ error: "Erro interno ao recuperar." }, { status: 500 });
  }
}

