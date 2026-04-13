import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

function LoginPageFallback() {
  return (
    <section className="container py-10 sm:py-14">
      <div className="mx-auto max-w-5xl border-2 border-black bg-[var(--surface)]">
        <div className="border-b-2 border-black px-5 py-4 sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
            Feelix access
          </p>
          <h1 className="mt-3 text-3xl font-extrabold uppercase leading-none tracking-[-0.06em] text-[var(--foreground)] sm:text-4xl">
            Loading
          </h1>
        </div>

        <div className="p-5 text-sm text-[var(--muted)] sm:p-6">
          Preparing sign in...
        </div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageClient />
    </Suspense>
  );
}