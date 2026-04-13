// lib/auth.ts — dev-only credentials so you can log in now
import Credentials from "next-auth/providers/credentials";

export const authOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Dev Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email || "").toString().trim();
        if (!email) return null;
        return { id: email, email };
      },
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    async session({ session, token }: { session: any; token: any }) {
      if (session?.user && token?.sub) (session.user as any).id = token.sub;
      return session;
    },
  },
};
