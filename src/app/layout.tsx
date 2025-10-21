import "@/styles/globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { Provider } from "./providers";

export const metadata: Metadata = {
  title: "Next Movie",
  description: "Monte listas de filmes e séries e sorteie em dupla.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-neutral-950 text-neutral-50 antialiased">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
