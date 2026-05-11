import "server-only";
import { PrismaClient } from "./generated/prisma/client";
import { TursoHttpAdapter } from "./turso-adapter";

const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

if (!url) throw new Error("Missing TURSO_DATABASE_URL");
if (!token) throw new Error("Missing TURSO_AUTH_TOKEN");

const adapter = new TursoHttpAdapter(url, token);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalForPrisma.prisma ?? new PrismaClient({ adapter: adapter as any });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
