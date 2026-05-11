/**
 * Migration script: PostgreSQL → Turso (libSQL)
 *
 * Run after `prisma db push` has created the schema in Turso:
 *   npx tsx scripts/migrate-to-turso.ts
 *
 * Requires POSTGRES_DATABASE_URL and TURSO_DATABASE_URL + TURSO_AUTH_TOKEN in .env
 */

import "dotenv/config";
import { Pool } from "pg";
import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../lib/generated/prisma/client";

const pg = new Pool({ connectionString: process.env.POSTGRES_DATABASE_URL });

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapter = new PrismaLibSql({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN } as any);
const turso = new PrismaClient({ adapter: adapter as any });

function log(msg: string) {
  console.log(`[migrate] ${msg}`);
}

async function migrateTable<T>(
  label: string,
  rows: T[],
  upsertFn: (row: T) => Promise<unknown>
) {
  log(`Migrating ${label}: ${rows.length} rows`);
  let ok = 0;
  let fail = 0;
  for (const row of rows) {
    try {
      await upsertFn(row);
      ok++;
    } catch (err) {
      console.error(`  [${label}] failed:`, err);
      fail++;
    }
  }
  log(`  ${label}: ${ok} succeeded, ${fail} failed`);
}

async function run() {
  log("Starting PostgreSQL → Turso migration");

  // ── Designations ───────────────────────────────────────────
  const { rows: designations } = await pg.query<{
    id: string; name: string; description: string | null;
    createdAt: Date; updatedAt: Date;
  }>(`SELECT id, name, description, "createdAt", "updatedAt" FROM "Designation"`);

  await migrateTable("Designation", designations, (d) =>
    turso.designation.upsert({
      where: { id: d.id },
      update: { name: d.name, description: d.description },
      create: { id: d.id, name: d.name, description: d.description,
        createdAt: d.createdAt, updatedAt: d.updatedAt },
    })
  );

  // ── Polling Stations ────────────────────────────────────────
  const { rows: stations } = await pg.query<{
    id: string; name: string; county: string; subCounty: string;
    ward: string; votes: number; createdAt: Date; updatedAt: Date;
  }>(`SELECT id, name, county, "subCounty", ward, votes, "createdAt", "updatedAt" FROM "PollingStation"`);

  await migrateTable("PollingStation", stations, (s) =>
    turso.pollingStation.upsert({
      where: { id: s.id },
      update: { name: s.name, county: s.county, subCounty: s.subCounty, ward: s.ward, votes: s.votes },
      create: { id: s.id, name: s.name, county: s.county, subCounty: s.subCounty,
        ward: s.ward, votes: s.votes, createdAt: s.createdAt, updatedAt: s.updatedAt },
    })
  );

  // ── Users ───────────────────────────────────────────────────
  const { rows: users } = await pg.query<{
    id: string; name: string | null; email: string | null;
    image: string | null; emailVerified: Date | null;
    createdAt: Date; updatedAt: Date;
  }>(`SELECT id, name, email, image, "emailVerified", "createdAt", "updatedAt" FROM "User"`);

  await migrateTable("User", users, (u) =>
    turso.user.upsert({
      where: { id: u.id },
      update: { name: u.name, email: u.email, image: u.image, emailVerified: u.emailVerified },
      create: { id: u.id, name: u.name, email: u.email, image: u.image,
        emailVerified: u.emailVerified, createdAt: u.createdAt, updatedAt: u.updatedAt },
    })
  );

  // ── Profiles ────────────────────────────────────────────────
  const { rows: profiles } = await pg.query<{
    userId: string; email: string | null; role: string | null;
    fullName: string | null; designationId: string | null;
    tel: string | null; tel2: string | null; image: string | null;
    pollingStationId: string | null; createdAt: Date; updatedAt: Date;
  }>(`SELECT "userId", email, role, "fullName", "designationId", tel, tel2, image,
       "pollingStationId", "createdAt", "updatedAt" FROM "Profile"`);

  await migrateTable("Profile", profiles, (p) =>
    turso.profile.upsert({
      where: { userId: p.userId },
      update: {
        email: p.email, role: p.role, adminRole: "user",
        fullName: p.fullName, designationId: p.designationId,
        tel: p.tel, tel2: p.tel2, image: p.image,
        pollingStationId: p.pollingStationId,
      },
      create: {
        userId: p.userId, email: p.email, role: p.role ?? "user", adminRole: "user",
        fullName: p.fullName, designationId: p.designationId,
        tel: p.tel, tel2: p.tel2, image: p.image,
        pollingStationId: p.pollingStationId,
        createdAt: p.createdAt, updatedAt: p.updatedAt,
      },
    })
  );

  // ── Accounts (OAuth) ────────────────────────────────────────
  const { rows: accounts } = await pg.query<{
    userId: string; type: string; provider: string; providerAccountId: string;
    refresh_token: string | null; access_token: string | null;
    expires_at: number | null; token_type: string | null;
    scope: string | null; id_token: string | null; session_state: string | null;
  }>(`SELECT "userId", type, provider, "providerAccountId", refresh_token, access_token,
       expires_at, token_type, scope, id_token, session_state FROM "Account"`);

  await migrateTable("Account", accounts, (a) =>
    turso.account.upsert({
      where: { provider_providerAccountId: { provider: a.provider, providerAccountId: a.providerAccountId } },
      update: { refresh_token: a.refresh_token, access_token: a.access_token, expires_at: a.expires_at },
      create: {
        userId: a.userId, type: a.type, provider: a.provider,
        providerAccountId: a.providerAccountId, refresh_token: a.refresh_token,
        access_token: a.access_token, expires_at: a.expires_at, token_type: a.token_type,
        scope: a.scope, id_token: a.id_token, session_state: a.session_state,
      },
    })
  );

  // ── Aspirants ───────────────────────────────────────────────
  const { rows: aspirants } = await pg.query<{
    id: string; fullName: string; tel: string; position: string;
    pollingStationId: string; createdAt: Date; updatedAt: Date;
  }>(`SELECT id, "fullName", tel, position, "pollingStationId", "createdAt", "updatedAt" FROM "Aspirant"`);

  await migrateTable("Aspirant", aspirants, (a) =>
    turso.aspirant.upsert({
      where: { id: a.id },
      update: { fullName: a.fullName, tel: a.tel, position: a.position, pollingStationId: a.pollingStationId },
      create: { id: a.id, fullName: a.fullName, tel: a.tel, position: a.position,
        pollingStationId: a.pollingStationId, createdAt: a.createdAt, updatedAt: a.updatedAt },
    })
  );

  // ── Agents ──────────────────────────────────────────────────
  const { rows: agents } = await pg.query<{
    id: string; fullName: string; tel: string; tel2: string | null;
    position: string; pollingStationId: string; createdAt: Date; updatedAt: Date;
  }>(`SELECT id, "fullName", tel, tel2, position, "pollingStationId", "createdAt", "updatedAt" FROM "Agent"`);

  await migrateTable("Agent", agents, (a) =>
    turso.agent.upsert({
      where: { id: a.id },
      update: { fullName: a.fullName, tel: a.tel, tel2: a.tel2, position: a.position, pollingStationId: a.pollingStationId },
      create: { id: a.id, fullName: a.fullName, tel: a.tel, tel2: a.tel2, position: a.position,
        pollingStationId: a.pollingStationId, createdAt: a.createdAt, updatedAt: a.updatedAt },
    })
  );

  // ── Activities ──────────────────────────────────────────────
  const { rows: activities } = await pg.query<{
    id: string; name: string; description: string; supervisor: string;
    addedById: string; status: string; image: string; createdAt: Date; updatedAt: Date;
  }>(`SELECT id, name, description, supervisor, "addedById", status, image, "createdAt", "updatedAt" FROM "Activity"`);

  await migrateTable("Activity", activities, (a) =>
    turso.activity.upsert({
      where: { id: a.id },
      update: { name: a.name, description: a.description, supervisor: a.supervisor, status: a.status, image: a.image },
      create: { id: a.id, name: a.name, description: a.description, supervisor: a.supervisor,
        addedById: a.addedById, status: a.status, image: a.image, createdAt: a.createdAt, updatedAt: a.updatedAt },
    })
  );

  // ── Reports ─────────────────────────────────────────────────
  const { rows: reports } = await pg.query<{
    id: string; report: string; activityId: string; createdAt: Date; updatedAt: Date;
  }>(`SELECT id, report, "activityId", "createdAt", "updatedAt" FROM "Report"`);

  await migrateTable("Report", reports, (r) =>
    turso.report.upsert({
      where: { id: r.id },
      update: { report: r.report },
      create: { id: r.id, report: r.report, activityId: r.activityId,
        createdAt: r.createdAt, updatedAt: r.updatedAt },
    })
  );

  // ── Expenses ────────────────────────────────────────────────
  const { rows: expenses } = await pg.query<{
    id: string; describe: string | null; amount: number;
    addedById: string; createdAt: Date; updatedAt: Date;
  }>(`SELECT id, describe, amount, "addedById", "createdAt", "updatedAt" FROM "Expense"`);

  await migrateTable("Expense", expenses, (e) =>
    turso.expense.upsert({
      where: { id: e.id },
      update: { describe: e.describe, amount: e.amount },
      create: { id: e.id, describe: e.describe, amount: e.amount,
        addedById: e.addedById, createdAt: e.createdAt, updatedAt: e.updatedAt },
    })
  );

  // ── Funds ───────────────────────────────────────────────────
  const { rows: funds } = await pg.query<{
    id: string; name: string | null; amount: number; tel: string | null;
    status: string; createdAt: Date; updatedAt: Date;
  }>(`SELECT id, name, amount, tel, status, "createdAt", "updatedAt" FROM "Funds"`);

  await migrateTable("Funds", funds, (f) =>
    turso.funds.upsert({
      where: { id: f.id },
      update: { name: f.name, amount: f.amount, tel: f.tel, status: f.status },
      create: { id: f.id, name: f.name, amount: f.amount, tel: f.tel,
        status: f.status, createdAt: f.createdAt, updatedAt: f.updatedAt },
    })
  );

  // ── Gifts ───────────────────────────────────────────────────
  const { rows: gifts } = await pg.query<{
    id: string; name: string | null; describe: string; tel: string | null;
    createdAt: Date; updatedAt: Date;
  }>(`SELECT id, name, describe, tel, "createdAt", "updatedAt" FROM "Gifts"`);

  await migrateTable("Gifts", gifts, (g) =>
    turso.gifts.upsert({
      where: { id: g.id },
      update: { name: g.name, describe: g.describe, tel: g.tel },
      create: { id: g.id, name: g.name, describe: g.describe, tel: g.tel,
        createdAt: g.createdAt, updatedAt: g.updatedAt },
    })
  );

  // ── Messages ────────────────────────────────────────────────
  const { rows: messages } = await pg.query<{
    id: string; name: string; tel: string; pollingStation: string;
    message: string; createdAt: Date; updatedAt: Date;
  }>(`SELECT id, name, tel, "pollingStation", message, "createdAt", "updatedAt" FROM "Message"`);

  await migrateTable("Message", messages, (m) =>
    turso.message.upsert({
      where: { id: m.id },
      update: { name: m.name, tel: m.tel, pollingStation: m.pollingStation, message: m.message },
      create: { id: m.id, name: m.name, tel: m.tel, pollingStation: m.pollingStation,
        message: m.message, createdAt: m.createdAt, updatedAt: m.updatedAt },
    })
  );

  log("Migration complete!");
  await pg.end();
  await turso.$disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
