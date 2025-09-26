import { Pool, QueryResult, type QueryResultRow } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL 환경 변수가 설정되어 있지 않습니다.");
}

declare global {
  var pgPool: Pool | undefined;
}

const globalForPool = globalThis as typeof globalThis & {
  pgPool?: Pool;
};

const pool =
  globalForPool.pgPool ??
  new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPool.pgPool = pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query<{ now: string }>("select now() as now");
    return Boolean(result.rows[0]?.now);
  } catch (error) {
    console.error("Postgres 연결 확인 실패", error);
    return false;
  }
}
