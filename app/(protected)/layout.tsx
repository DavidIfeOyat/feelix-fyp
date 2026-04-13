import type { ReactNode } from "react";
import { PostLoginOnboardingGate } from "@/components/features/auth/PostLoginOnboardingGate";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <PostLoginOnboardingGate>{children}</PostLoginOnboardingGate>;
}