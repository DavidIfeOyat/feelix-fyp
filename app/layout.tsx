import type { ReactNode } from "react";
import { Archivo } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/layout/NavBar";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-[var(--background)]">
      <body className={`${archivo.className} bg-[var(--background)] text-[var(--foreground)] antialiased`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 border-2 border-black bg-[var(--background)] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--foreground)]"
        >
          Skip to content
        </a>

        <NavBar />

        <main id="main" className="min-h-[calc(100vh-72px)]">
          {children}
        </main>
      </body>
    </html>
  );
}