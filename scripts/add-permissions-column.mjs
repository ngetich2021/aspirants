/**
 * Adds the `permissions` column to the Profile table in Turso.
 * Run once: node scripts/add-permissions-column.mjs
 */

import "dotenv/config";

const TURSO_URL = `${process.env.TURSO_DATABASE_URL.replace("libsql://", "https://")}/v2/pipeline`;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

async function tursoExec(sql) {
  const res = await fetch(TURSO_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${TURSO_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [{ type: "execute", stmt: { sql, args: [] } }, { type: "close" }],
    }),
  });
  const data = await res.json();
  const err = data.results?.find((r) => r.type === "error");
  if (err) throw new Error(JSON.stringify(err));
  return data;
}

try {
  await tursoExec("ALTER TABLE Profile ADD COLUMN permissions TEXT");
  console.log("✓ permissions column added to Profile");
} catch (err) {
  if (err.message.includes("duplicate column")) {
    console.log("⚠ permissions column already exists, skipping");
  } else {
    console.error("✗ Failed:", err.message);
    process.exit(1);
  }
}
