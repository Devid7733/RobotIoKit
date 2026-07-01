import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { mergeGuestCartIntoUserCart } from "@/modules/cart/cart.service";
import { verifyPassword } from "@/lib/password";

export const authOptions = {
  session: {
    strategy: "jwt"
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        guestSessionId: { label: "Guest Session", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        const email = credentials.email.toLowerCase();

        const user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or password.");
        }

        const isValid = verifyPassword(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Invalid email or password.");
        }

        if (!user.emailVerified) {
          throw new Error("Please verify your email before signing in.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          guestSessionId: credentials.guestSessionId || null
        };
      }
    })
  ],
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async signIn({ user }) {
      if (user?.id && user?.role !== "ADMIN" && user?.guestSessionId && !user?.skipCartMerge) {
        await mergeGuestCartIntoUserCart(user.id, user.guestSessionId);
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId;
        session.user.role = token.role;
        session.user.email = token.email;
        session.user.name = token.name;
      }

      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true
};

export function auth() {
  return getServerSession(authOptions);
}
