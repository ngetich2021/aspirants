/**
 * Migration: PostgreSQL → Turso via HTTP API
 * Uses only pg (already installed) and built-in fetch (Node 18+).
 * Run: node scripts/migrate-http.mjs
 */

import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.POSTGRES_DATABASE_URL });

const TURSO_URL = `${process.env.TURSO_DATABASE_URL.replace("libsql://", "https://")}/v2/pipeline`;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

// ── Turso HTTP helper ──────────────────────────────────────────────────────
async function tursoExec(sql, args = []) {
  const res = await fetch(TURSO_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${TURSO_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [{ type: "execute", stmt: { sql, args } }, { type: "close" }],
    }),
  });
  const data = await res.json();
  const err = data.results?.find((r) => r.type === "error");
  if (err) throw new Error(JSON.stringify(err));
  return data;
}

function v(x) {
  if (x === null || x === undefined) return { type: "null" };
  if (x instanceof Date) return { type: "text", value: x.toISOString() };
  if (typeof x === "number") return { type: "integer", value: String(Math.round(x)) };
  return { type: "text", value: String(x) };
}

async function migrate(label, pgSql, upsertFn) {
  const { rows } = await pool.query(pgSql);
  console.log(`Migrating ${label}: ${rows.length} rows`);
  let ok = 0, fail = 0;
  for (const row of rows) {
    try { await upsertFn(row); ok++; }
    catch (err) { console.error(`  ✗ row failed: ${err.message.slice(0, 80)}`); fail++; }
  }
  console.log(`  ✓ ${ok} ok, ${fail} failed`);
}

console.log("Starting PostgreSQL → Turso migration...\n");

// Designations
await migrate(
  "Designation",
  `SELECT id, name, description, "createdAt", "updatedAt" FROM "Designation"`,
  (r) => tursoExec(
    `INSERT OR REPLACE INTO "Designation" (id,name,description,"createdAt","updatedAt") VALUES (?,?,?,?,?)`,
    [v(r.id), v(r.name), v(r.description), v(r.createdAt), v(r.updatedAt)]
  )
);

// Polling Stations
await migrate(
  "PollingStation",
  `SELECT id, name, county, "subCounty", ward, votes, "createdAt", "updatedAt" FROM "PollingStation"`,
  (r) => tursoExec(
    `INSERT OR REPLACE INTO "PollingStation" (id,name,county,"subCounty",ward,votes,"createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?)`,
    [v(r.id), v(r.name), v(r.county), v(r.subCounty), v(r.ward), v(r.votes), v(r.createdAt), v(r.updatedAt)]
  )
);

// Users
await migrate(
  "User",
  `SELECT id, name, email, image, "emailVerified", "createdAt", "updatedAt" FROM "User"`,
  (r) => tursoExec(
    `INSERT OR REPLACE INTO "User" (id,name,email,image,"emailVerified","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?)`,
    [v(r.id), v(r.name), v(r.email), v(r.image), v(r.emailVerified), v(r.createdAt), v(r.updatedAt)]
  )
);

// Profiles (migrate with adminRole defaulting to "user")
await migrate(
  "Profile",
  `SELECT "userId", email, role, "fullName", "designationId", tel, tel2, image, "pollingStationId", "createdAt", "updatedAt" FROM "Profile"`,
  (r) => tursoExec(
    `INSERT OR REPLACE INTO "Profile" ("userId",email,role,"adminRole","adminCounty","adminSubCounty","adminWard","fullName","designationId",tel,tel2,image,"pollingStationId","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [v(r.userId), v(r.email), v(r.role), v("user"), v(null), v(null), v(null), v(r.fullName), v(r.designationId), v(r.tel), v(r.tel2), v(r.image), v(r.pollingStationId), v(r.createdAt), v(r.updatedAt)]
  )
);

// Accounts
await migrate(
  "Account",
  `SELECT "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state FROM "Account"`,
  (r) => tursoExec(
    `INSERT OR REPLACE INTO "Account" ("userId",type,provider,"providerAccountId","refresh_token","access_token","expires_at","token_type",scope,"id_token","session_state") VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [v(r.userId), v(r.type), v(r.provider), v(r.providerAccountId), v(r.refresh_token), v(r.access_token), v(r.expires_at), v(r.token_type), v(r.scope), v(r.id_token), v(r.session_state)]
  )
);

// Sessions
await migrate(
  "Session",
  `SELECT id, "sessionToken", "userId", expires FROM "Session"`,
  (r) => tursoExec(
    `INSERT OR REPLACE INTO "Session" (id,"sessionToken","userId",expires) VALUES (?,?,?,?)`,
    [v(r.id), v(r.sessionToken), v(r.userId), v(r.expires)]
  )
);

// Aspirants
await migrate(
  "Aspirant",
  `SELECT id, "fullName", tel, position, "pollingStationId", "createdAt", "updatedAt" FROM "Aspirant"`,
  (r) => tursoExec(
    `INSERT OR REPLACE INTO "Aspirant" (id,"fullName",tel,position,"pollingStationId","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?)`,
    [v(r.id), v(r.fullName), v(r.tel), v(r.position), v(r.pollingStationId), v(r.createdAt), v(r.updatedAt)]
  )
);

// Agents
await migrate(
  "Agent",
  `SELECT id, "fullName", tel, tel2, position, "pollingStationId", "createdAt", "updatedAt" FROM "Agent"`,
  (r) => tursoExec(
    `INSERT OR REPLACE INTO "Agent" (id,"fullName",tel,tel2,position,"pollingStationId","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?)`,
    [v(r.id), v(r.fullName), v(r.tel), v(r.tel2), v(r.position), v(r.pollingStationId), v(r.createdAt), v(r.updatedAt)]
  )
);

// Activities
await migrate(
  "Activity",
  `SELECT id, name, description, supervisor, "addedById", status, image, "createdAt", "updatedAt" FROM "Activity"`,
  (r) => tursoExec(
    `INSERT OR REPLACE INTO "Activity" (id,name,description,supervisor,"addedById",status,image,"createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,?)`,
    [v(r.id), v(r.name), v(r.description), v(r.supervisor), v(r.addedById), v(r.status), v(r.image), v(r.createdAt), v(r.updatedAt)]
  )
);

// Reports
await migrate(
  "Report",
  `SELECT id, report, "activityId", "createdAt", "updatedAt" FROM "Report"`,
  (r) => tursoExec(
    `INSERT OR REPLACE INTO "Report" (id,report,"activityId","createdAt","updatedAt") VALUES (?,?,?,?,?)`,
    [v(r.id), v(r.report), v(r.activityId), v(r.createdAt), v(r.updatedAt)]
  )
);

// Expenses
await migrate(
  "Expense",
  `SELECT id, describe, amount, "addedById", "createdAt", "updatedAt" FROM "Expense"`,
  (r) => tursoExec(
    `INSERT OR REPLACE INTO "Expense" (id,describe,amount,"addedById","createdAt","updatedAt") VALUES (?,?,?,?,?,?)`,
    [v(r.id), v(r.describe), v(r.amount), v(r.addedById), v(r.createdAt), v(r.updatedAt)]
  )
);

// Funds
await migrate(
  "Funds",
  `SELECT id, name, amount, tel, status, "createdAt", "updatedAt" FROM "Funds"`,
  (r) => tursoExec(
    `INSERT OR REPLACE INTO "Funds" (id,name,amount,tel,status,"createdAt","updatedAt") VALUES (?,?,?,?,?,?,?)`,
    [v(r.id), v(r.name), v(r.amount), v(r.tel), v(r.status), v(r.createdAt), v(r.updatedAt)]
  )
);

// Gifts
await migrate(
  "Gifts",
  `SELECT id, name, describe, tel, "createdAt", "updatedAt" FROM "Gifts"`,
  (r) => tursoExec(
    `INSERT OR REPLACE INTO "Gifts" (id,name,describe,tel,"createdAt","updatedAt") VALUES (?,?,?,?,?,?)`,
    [v(r.id), v(r.name), v(r.describe), v(r.tel), v(r.createdAt), v(r.updatedAt)]
  )
);

// Messages
await migrate(
  "Message",
  `SELECT id, name, tel, "pollingStation", message, "createdAt", "updatedAt" FROM "Message"`,
  (r) => tursoExec(
    `INSERT OR REPLACE INTO "Message" (id,name,tel,"pollingStation",message,"createdAt","updatedAt") VALUES (?,?,?,?,?,?,?)`,
    [v(r.id), v(r.name), v(r.tel), v(r.pollingStation), v(r.message), v(r.createdAt), v(r.updatedAt)]
  )
);

console.log("\nMigration complete!");
await pool.end();
