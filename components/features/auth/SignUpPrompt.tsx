"use client";

import Link from "next/link";

type SignUpPromptProps = {
  title?: string;
  message?: string;
  reason?: string; // legacy alias retained for compatibility
  ctaHref?: string;
  ctaLabel?: string;
};

export default function SignUpPrompt({
  title = "Create a free account",
  message,
  reason,
  ctaHref = "/signup",
  ctaLabel = "Sign up",
}: SignUpPromptProps) {
  const body = message ?? reason ?? "Unlock watchlists, profiles, and more.";

  return (
    <div className="mt-4 flex items-center justify-between rounded-[--radius-xl] border border-[--color-border] bg-[--color-surface] p-4">
      <div className="text-sm">
        <div className="font-semibold">{title}</div>
        <div className="text-[--color-muted]">{body}</div>
      </div>

      <Link href={ctaHref} className="btn btn-primary no-underline">
        {ctaLabel}
      </Link>
    </div>
  );
}