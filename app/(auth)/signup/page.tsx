import SignupPageClient from "./SignupPageClient";

type PageProps = {
  searchParams: Promise<{
    from?: string | string[] | undefined;
  }>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveRedirect(rawFrom: string | null) {
  const fallback = "/dashboard";

  if (!rawFrom) return fallback;
  if (!rawFrom.startsWith("/") || rawFrom.startsWith("//")) return fallback;
  if (rawFrom.startsWith("/login") || rawFrom.startsWith("/signup")) return fallback;

  return rawFrom;
}

export default async function SignupPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const from = resolveRedirect(first(sp.from) ?? null);

  return <SignupPageClient from={from} />;
}