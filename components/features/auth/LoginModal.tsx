"use client";

import Link from "next/link";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  reason?: string;
  from?: string;
};

export default function LoginModal({
  open,
  onClose,
  reason = "Sign in to save this to your watchlist.",
  from = "/",
}: LoginModalProps) {
  if (!open) return null;

  const loginHref = `/login?from=${encodeURIComponent(from)}`;
  const signupHref = `/signup?from=${encodeURIComponent(from)}`;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-[--radius-xl] border border-white/10 bg-black/90 p-6 backdrop-blur">
        <h3 className="text-xl font-bold">Create an account to continue</h3>

        <p className="mt-2 text-sm text-[--color-muted]">{reason}</p>

        <div className="mt-5 grid gap-2">
          <Link className="btn btn-primary w-full" href={signupHref}>
            Create account
          </Link>

          <Link className="btn btn-ghost w-full" href={loginHref}>
            Sign in
          </Link>

          <button
            type="button"
            className="btn btn-ghost w-full"
            onClick={onClose}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}