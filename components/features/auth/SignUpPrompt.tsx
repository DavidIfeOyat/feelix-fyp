// components/SignUpPrompt.tsx
"use client";
import Link from "next/link";

type Props = {
  title?: string;
  message?: string;   // body text
  reason?: string;    // legacy alias for message
  ctaHref?: string;
  ctaLabel?: string;
};

export default function SignUpPrompt({
  title = "Create a free account",
  message,
  reason,
  ctaHref = "/signup",
  ctaLabel = "Sign up",
}: Props) {
  const body = message ?? reason ?? "Unlock watchlists, profiles, and more.";
  return (
    <div className="mt-4 border border-[--color-border] rounded-[--radius-xl] bg-[--color-surface] p-4 flex items-center justify-between">
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
