import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      // Designation-based display role (chairperson, secretary, etc.)
      role: string;
      // Hierarchical RBAC admin role
      adminRole: string;
      // Geographic scope for county/subcounty/ward/station admins
      adminCounty: string | null;
      adminSubCounty: string | null;
      adminWard: string | null;
      pollingStationId: string | null;
      permissions: string[] | null;
    };
  }
  interface User {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    adminRole?: string;
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma as unknown as Parameters<typeof PrismaAdapter>[0]),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],

  events: {
    async createUser({ user }) {
      if (!user.id) return;
      await prisma.profile.upsert({
        where: { userId: user.id },
        update: { email: user.email ?? null },
        create: {
          userId: user.id,
          role: "user",
          adminRole: "user",
          email: user.email ?? null,
        },
      });
    },
  },

  callbacks: {
    async session({ session, user }) {
      if (!user?.id || !session.user) return session;

      // Always set the user id first
      session.user.id = user.id;
      session.user.email = user.email ?? session.user.email;
      session.user.name = user.name ?? session.user.name;
      session.user.image = user.image ?? session.user.image;

      // Defaults in case the DB call fails
      session.user.role = "user";
      session.user.adminRole = "user";
      session.user.adminCounty = null;
      session.user.adminSubCounty = null;
      session.user.adminWard = null;
      session.user.pollingStationId = null;
      session.user.permissions = null;

      try {
        const profile = await prisma.profile.upsert({
          where: { userId: user.id },
          update: { email: user.email ?? null },
          create: {
            userId: user.id,
            role: "user",
            adminRole: "user",
            email: user.email ?? null,
          },
          include: {
            designation: { select: { name: true } },
          },
        });

        session.user.role = (
          profile.designation?.name ?? profile.role ?? "user"
        ).toLowerCase().trim();
        session.user.adminRole = (profile.adminRole || "user").toLowerCase().trim();
        session.user.adminCounty = profile.adminCounty ?? null;
        session.user.adminSubCounty = profile.adminSubCounty ?? null;
        session.user.adminWard = profile.adminWard ?? null;
        session.user.pollingStationId = profile.pollingStationId ?? null;
        session.user.permissions = profile.permissions
          ? (JSON.parse(profile.permissions) as string[])
          : null;
      } catch (err) {
        console.error("[auth] Failed to load profile for user", user.id, err);
        // Return session with defaults — prevents SessionTokenError from propagating
      }

      return session;
    },
  },
});
