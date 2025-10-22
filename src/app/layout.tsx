import "@/styles/globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { SiteNav } from "@/components/site-nav";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";
import { Provider } from "./providers";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Next Movie",
  description: "Monte listas de filmes e séries e sorteie em dupla.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <html lang="pt-BR">
      <body className="bg-neutral-950 text-neutral-50 antialiased">
        <Provider session={session}>
          <div className="flex min-h-screen flex-col">
            {session ? <SiteNav /> : <PublicHeader />}
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </div>
        </Provider>
      </body>
    </html>
  );
}
