import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

function AuthFallback() {
  return (
    <section className="container py-10 sm:py-14">
      <div className="mx-auto max-w-md border-2 border-black bg-[var(--surface)]">
        <div className="px-5 py-6 text-sm text-[var(--muted)]">Loading...</div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <LoginPageClient />
    </Suspense>
  );
}