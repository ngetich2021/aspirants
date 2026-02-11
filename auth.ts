// src/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

// Extend NextAuth types to support our custom role and designation logic
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string; // This will hold "chairman", "leader", etc.
    };
  }

  interface User {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma as unknown as Parameters<typeof PrismaAdapter>[0]),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  events: {
    async createUser({ user }) {
      if (!user.id) return;

      // Initialize the profile on first login
      await prisma.profile.upsert({
        where: { userId: user.id },
        update: {
          email: user.email ?? null,
        },
        create: {
          userId: user.id,
          role: "user",
          email: user.email ?? null,
        },
      });

      console.log("🔥 New user profile created and synced:", user.id);
    },
  },

  callbacks: {
    async session({ session, user }) {
      if (!user?.id || !session.user) return session;

      // 1. Fetch Profile and include the Designation relation
      // We use upsert to ensure the profile exists and the email is in sync
      const profile = await prisma.profile.upsert({
        where: { userId: user.id },
        update: {
          email: user.email ?? null,
        },
        create: {
          userId: user.id,
          role: "user",
          email: user.email ?? null,
        },
        include: {
          designation: {
            select: {
              name: true, // We only need the name (e.g., "Chairman")
            },
          },
        },
      });

      // 2. Determine the role for the middleware
      // Priority: Designation Name > Profile Role > Default "user"
      const rawRole = profile.designation?.name || profile.role || "user";

      // 3. Attach required fields to session
      session.user.id = user.id;
      // We lowercase and trim so it matches your middleware map: ["chairman", "leader"]
      session.user.role = rawRole.toLowerCase().trim();

      // Use the freshest data from the User table (managed by Auth.js)
      session.user.email = user.email ?? session.user.email;
      session.user.name = user.name ?? session.user.name;
      session.user.image = user.image ?? session.user.image;

      return session;
    },
  },
});