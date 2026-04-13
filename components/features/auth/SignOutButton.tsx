"use client";

import { signOutAction } from "@/app/actions/auth";

export default function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button type="submit" className="btn btn-ghost">
        Sign out
      </button>
    </form>
  );
}
