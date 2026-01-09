import "@/styles/globals.css";
import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { ReactNode } from "react";
import { SiteNav } from "@/components/site-nav";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";
import { Provider } from "./providers";
import { auth } from "@/lib/auth";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Time2Watch",
    template: "%s | Time2Watch",
  },
  description: "Monte listas de filmes e séries e sorteie em dupla.",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
      },
      {
        url: "/favicon.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    shortcut: ["/favicon.ico"],
    apple: ["/apple-touch-icon.png"],
  },
  openGraph: {
    title: "Time2Watch",
    description: "Monte listas de filmes e séries e sorteie em dupla.",
    url: "/",
    siteName: "Time2Watch",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Time2Watch",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Time2Watch",
    description: "Monte listas de filmes e séries e sorteie em dupla.",
    images: ["/og.png"],
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <html lang="pt-BR">
      <body
        className={`${manrope.variable} ${spaceGrotesk.variable} bg-neutral-950 text-neutral-50 antialiased`}
      >
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

