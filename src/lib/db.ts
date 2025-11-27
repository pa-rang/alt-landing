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
        // Supabase Session 모드 최적화 설정
        connectionTimeoutMillis: 10000, // 연결 타임아웃: 10초
        idleTimeoutMillis: 10000, // 유휴 연결 타임아웃: 10초
        max: 3, // Supabase Session 모드 제한에 맞춤 (낮게 유지)
        allowExitOnIdle: true, // 서버리스 환경에서 프로세스 종료 허용
      })
    : null);

if (process.env.NODE_ENV !== "production") {
  globalForPool.pgPool = pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
  retries = 2
): Promise<QueryResult<T>> {
  if (!pool) {
    throw new Error("DATABASE_URL 환경 변수가 설정되어 있지 않습니다.");
  }

  try {
    // pool.query()를 직접 사용하여 연결 풀이 내부적으로 관리하도록 함
    return await pool.query<T>(text, params);
  } catch (error) {
    // 연결 오류 또는 풀 고갈 시 재시도
    if (
      retries > 0 &&
      error instanceof Error &&
      (error.message.includes("terminated") ||
        error.message.includes("timeout") ||
        error.message.includes("Connection") ||
        error.message.includes("MaxClients"))
    ) {
      console.warn(`Database error, retrying... (${retries} retries left)`, error.message);
      await new Promise((resolve) => setTimeout(resolve, 500)); // 0.5초 대기 후 재시도
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
