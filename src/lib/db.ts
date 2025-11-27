import { Pool, QueryResult, type QueryResultRow } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV !== "production") {
  console.warn("DATABASE_URL 환경 변수가 설정되어 있지 않습니다.");
}

declare global {
  var pgPool: Pool | null | undefined;
}

const globalForPool = globalThis as typeof globalThis & {
  pgPool?: Pool | null;
};

const pool =
  globalForPool.pgPool ??
  (connectionString
    ? new Pool({
        connectionString,
        ssl: {
          rejectUnauthorized: false,
        },
        // 서버리스 환경 최적화 설정
        connectionTimeoutMillis: 30000, // 연결 타임아웃: 30초
        idleTimeoutMillis: 30000, // 유휴 연결 타임아웃: 30초
        max: 10, // 최대 연결 수
        allowExitOnIdle: true, // 서버리스 환경에서 프로세스 종료 허용
      })
    : null);

if (process.env.NODE_ENV !== "production") {
  globalForPool.pgPool = pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
  retries = 1
): Promise<QueryResult<T>> {
  if (!pool) {
    throw new Error("DATABASE_URL 환경 변수가 설정되어 있지 않습니다.");
  }
  
  const executeQuery = async (): Promise<QueryResult<T>> => {
    const client = await pool!.connect();
    try {
      // 쿼리 타임아웃 설정 (25초)
      await client.query("SET statement_timeout = '25s'");
      return await client.query<T>(text, params);
    } finally {
      client.release();
    }
  };

  try {
    return await executeQuery();
  } catch (error) {
    // 연결 오류 시 재시도
    if (
      retries > 0 &&
      error instanceof Error &&
      (error.message.includes("terminated") ||
        error.message.includes("timeout") ||
        error.message.includes("Connection"))
    ) {
      console.warn(`Database connection error, retrying... (${retries} retries left)`, error.message);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 대기 후 재시도
      return query<T>(text, params, retries - 1);
    }
    throw error;
  }
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
