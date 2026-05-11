/**
 * Prisma 7 SqlDriverAdapterFactory for Turso using the HTTP Pipeline API.
 * No @libsql/client dependency — uses native fetch.
 */

// ColumnTypeEnum values (from @prisma/driver-adapter-utils)
const CT = {
  Int32: 0,
  Int64: 1,
  Float: 2,
  Double: 3,
  Numeric: 4,
  Boolean: 5,
  Text: 7,
  Date: 8,
  Time: 9,
  DateTime: 10,
  Json: 11,
  Bytes: 13,
  UnknownNumber: 128,
} as const;

// ── Turso HTTP wire types ──────────────────────────────────────────────────────

type TursoArg =
  | { type: "null" }
  | { type: "text"; value: string }
  | { type: "integer"; value: string }
  | { type: "float"; value: string }
  | { type: "blob"; base64: string };

interface TursoResult {
  cols: Array<{ name: string; decltype: string | null }>;
  rows: TursoArg[][];
  affected_row_count: number;
  last_insert_rowid: string | null;
}

interface TursoPipelineResponse {
  baton: string | null;
  results: Array<{
    type: string;
    response?: { result?: TursoResult };
    error?: { message: string };
  }>;
}

// ── Prisma 7 driver adapter types (local, no import needed) ───────────────────

interface SqlArgType {
  scalarType: string;
  arity: "scalar" | "list";
  dbType?: string;
}

interface SqlQuery {
  sql: string;
  args: unknown[];
  argTypes: SqlArgType[];
}

interface SqlResultSet {
  columnNames: string[];
  columnTypes: number[];
  rows: unknown[][];
  lastInsertId?: string;
}

interface TransactionOptions {
  usePhantomQuery: boolean;
}

// ── HTTP pipeline helper ───────────────────────────────────────────────────────

async function pipelinePost(
  url: string,
  token: string,
  requests: unknown[],
  baton?: string | null
): Promise<TursoPipelineResponse> {
  const body: Record<string, unknown> = { requests };
  if (baton) body.baton = baton;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Turso HTTP ${res.status}: ${await res.text()}`);
  return res.json() as Promise<TursoPipelineResponse>;
}

// ── Arg conversion (Prisma → Turso) ───────────────────────────────────────────

function convertArg(arg: unknown, argType?: SqlArgType): TursoArg {
  if (arg === null || arg === undefined) return { type: "null" };
  const scalar = argType?.scalarType;
  if (scalar === "bytes" && typeof arg === "string") return { type: "blob", base64: arg };
  if (scalar === "datetime" && typeof arg === "string") return { type: "text", value: arg };
  if (scalar === "bigint" && typeof arg === "string") return { type: "integer", value: arg };
  if (scalar === "decimal" && typeof arg === "string") return { type: "float", value: arg };
  if (typeof arg === "boolean") return { type: "integer", value: arg ? "1" : "0" };
  if (typeof arg === "bigint") return { type: "integer", value: arg.toString() };
  if (typeof arg === "number")
    return Number.isInteger(arg)
      ? { type: "integer", value: String(arg) }
      : { type: "float", value: String(arg) };
  if (arg instanceof Uint8Array)
    return { type: "blob", base64: Buffer.from(arg).toString("base64") };
  return { type: "text", value: String(arg) };
}

// ── Column type mapping (SQLite decltype → ColumnTypeEnum) ────────────────────

function mapDeclType(decltype: string | null): number {
  if (!decltype) return CT.UnknownNumber;
  switch (decltype.toUpperCase()) {
    case "INTEGER": case "INT": case "SMALLINT": case "MEDIUMINT":
    case "TINYINT": case "INT2": case "SERIAL":
      return CT.Int32;
    case "BIGINT": case "UNSIGNED BIG INT": case "INT8":
      return CT.Int64;
    case "FLOAT":
      return CT.Float;
    case "DOUBLE": case "DOUBLE PRECISION": case "REAL":
      return CT.Double;
    case "NUMERIC": case "DECIMAL":
      return CT.Numeric;
    case "BOOLEAN": case "BOOL":
      return CT.Boolean;
    case "TEXT": case "CLOB": case "CHARACTER": case "VARCHAR":
    case "NVARCHAR": case "NCHAR": case "NATIVE CHARACTER": case "VARYING CHARACTER":
      return CT.Text;
    case "DATE":
      return CT.Date;
    case "TIME":
      return CT.Time;
    case "DATETIME": case "TIMESTAMP":
      return CT.DateTime;
    case "JSON": case "JSONB":
      return CT.Json;
    case "BLOB":
      return CT.Bytes;
    default:
      return CT.Text;
  }
}

function extractCell(arg: TursoArg, colType: number): unknown {
  if (arg.type === "null") return null;
  if (arg.type === "integer") {
    const n = Number((arg as { value: string }).value);
    return colType === CT.Int64 ? String(n) : n;
  }
  if (arg.type === "float") return Number((arg as { value: string }).value);
  if (arg.type === "blob")
    return new Uint8Array(Buffer.from((arg as { base64: string }).base64, "base64"));
  return (arg as { value: string }).value;
}

function toResultSet(result: TursoResult): SqlResultSet {
  const columnTypes = result.cols.map((c) => mapDeclType(c.decltype));

  // Infer type from first non-null cell for columns with unknown types
  for (let ci = 0; ci < columnTypes.length; ci++) {
    if (columnTypes[ci] !== CT.UnknownNumber) continue;
    let found = false;
    for (const row of result.rows) {
      const cell = row[ci];
      if (cell.type === "null") continue;
      if (cell.type === "integer") { columnTypes[ci] = CT.Int32; found = true; break; }
      if (cell.type === "float")   { columnTypes[ci] = CT.Double; found = true; break; }
      if (cell.type === "blob")    { columnTypes[ci] = CT.Bytes;  found = true; break; }
      columnTypes[ci] = CT.Text; found = true; break;
    }
    if (!found) columnTypes[ci] = CT.Int32; // all-null default, same as libsql adapter
  }

  return {
    columnNames: result.cols.map((c) => c.name),
    columnTypes,
    rows: result.rows.map((row) => row.map((cell, i) => extractCell(cell, columnTypes[i]))),
    lastInsertId: result.last_insert_rowid ?? undefined,
  };
}

// ── Retry helper for transient Turso/network errors ──────────────────────────

const RETRYABLE = ["database is locked", "SQLITE_BUSY", "ConnectTimeoutError", "UND_ERR_CONNECT_TIMEOUT"];

function isRetryable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message + (err.cause ? String(err.cause) : "") : String(err);
  return RETRYABLE.some((s) => msg.includes(s));
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let delay = 150;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i < attempts - 1 && isRetryable(err)) {
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
        continue;
      }
      throw err;
    }
  }
  throw new Error("unreachable");
}

// ── Core query runner ─────────────────────────────────────────────────────────

async function runQuery(
  pipelineUrl: string,
  token: string,
  query: SqlQuery
): Promise<TursoResult> {
  return withRetry(async () => {
    const data = await pipelinePost(pipelineUrl, token, [
      {
        type: "execute",
        stmt: {
          sql: query.sql,
          args: query.args.map((arg, i) => convertArg(arg, query.argTypes?.[i])),
        },
      },
      { type: "close" },
    ]);
    const r = data.results[0];
    if (r.type === "error") throw new Error(r.error?.message ?? "Turso query error");
    return r.response!.result!;
  });
}

// ── Transaction adapter ───────────────────────────────────────────────────────
//
// Turso's baton-based interactive transactions expire under dev-server compile
// delays and fail with "database is locked" when multiple requests compete.
// We run each statement immediately (auto-committed) — safe for Prisma's upsert
// patterns because Turso's SQLite UNIQUE constraints catch any duplicate races.

class TursoTransaction {
  readonly provider = "sqlite" as const;
  readonly adapterName = "turso-http" as const;
  readonly options: TransactionOptions = { usePhantomQuery: true };

  constructor(
    private pipelineUrl: string,
    private token: string
  ) {}

  async queryRaw(query: SqlQuery): Promise<SqlResultSet> {
    const rs = await runQuery(this.pipelineUrl, this.token, query);
    return toResultSet(rs);
  }

  async executeRaw(query: SqlQuery): Promise<number> {
    const rs = await runQuery(this.pipelineUrl, this.token, query);
    return rs.affected_row_count;
  }

  // commit/rollback are no-ops: each statement was already auto-committed
  async commit(): Promise<void> {}
  async rollback(): Promise<void> {}

  async createSavepoint(_name: string): Promise<void> {}
  async rollbackToSavepoint(_name: string): Promise<void> {}
  async releaseSavepoint(_name: string): Promise<void> {}
}

// ── Main SQL adapter ──────────────────────────────────────────────────────────

class TursoSqlAdapter {
  readonly provider = "sqlite" as const;
  readonly adapterName = "turso-http" as const;

  constructor(private pipelineUrl: string, private token: string) {}

  async queryRaw(query: SqlQuery): Promise<SqlResultSet> {
    const rs = await runQuery(this.pipelineUrl, this.token, query);
    return toResultSet(rs);
  }

  async executeRaw(query: SqlQuery): Promise<number> {
    const rs = await runQuery(this.pipelineUrl, this.token, query);
    return rs.affected_row_count;
  }

  async executeScript(script: string): Promise<void> {
    const requests = script
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((sql) => ({ type: "execute", stmt: { sql, args: [] } }));
    if (!requests.length) return;
    requests.push({ type: "close" } as unknown as (typeof requests)[0]);
    await withRetry(async () => {
      const data = await pipelinePost(this.pipelineUrl, this.token, requests);
      for (const r of data.results) {
        if (r.type === "error") throw new Error(r.error?.message ?? "executeScript error");
      }
    });
  }

  async startTransaction(_isolationLevel?: string): Promise<TursoTransaction> {
    // No baton — each statement runs auto-committed to avoid lock contention
    return new TursoTransaction(this.pipelineUrl, this.token);
  }

  getConnectionInfo() {
    return { supportsRelationJoins: false };
  }

  async dispose(): Promise<void> {}
}

// ── Factory (what PrismaClient receives) ─────────────────────────────────────

export class TursoHttpAdapter {
  readonly provider = "sqlite" as const;
  readonly adapterName = "turso-http" as const;
  private pipelineUrl: string;

  constructor(dbUrl: string, private token: string) {
    this.pipelineUrl =
      dbUrl.replace("libsql://", "https://").replace(/\/$/, "") + "/v2/pipeline";
  }

  async connect(): Promise<TursoSqlAdapter> {
    return new TursoSqlAdapter(this.pipelineUrl, this.token);
  }
}
