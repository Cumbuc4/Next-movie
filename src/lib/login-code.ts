import { createHash, randomBytes } from "crypto";

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateLoginCode(length = 16): string {
  const bytes = randomBytes(length);
  const chars = [];
  for (let i = 0; i < length; i += 1) {
    const index = bytes[i] % CHARSET.length;
    chars.push(CHARSET[index]);
  }
  return chars.join("");
}

export function hashLoginCode(code: string): string {
  return createHash("sha256").update(code.toUpperCase(), "utf8").digest("hex");
}
