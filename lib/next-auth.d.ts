import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User extends DefaultUser {
    role?: string;
    adminRole?: string;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      adminRole: string;
      adminCounty: string | null;
      adminSubCounty: string | null;
      adminWard: string | null;
      pollingStationId: string | null;
      permissions: string[] | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    adminRole?: string;
    adminCounty?: string | null;
    adminSubCounty?: string | null;
    adminWard?: string | null;
    pollingStationId?: string | null;
    permissions?: string[] | null;
  }
}
