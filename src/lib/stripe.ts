import Stripe from "stripe";

type StripeMode = "test" | "live";

const STRIPE_MODE = (process.env.STRIPE_MODE === "live" ? "live" : "test") satisfies StripeMode;

type StripeConfig = {
  secretKey: string | undefined;
  webhookSecret: string | undefined;
  priceId: string | undefined;
  publishableKey?: string;
};

const stripeConfigs: Record<StripeMode, StripeConfig> = {
  test: {
    secretKey: process.env.STRIPE_TEST_SECRET_KEY,
    webhookSecret: process.env.STRIPE_TEST_WEBHOOK_SECRET,
    priceId: process.env.STRIPE_TEST_PRICE_ID,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY,
  },
  live: {
    secretKey: process.env.STRIPE_LIVE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_LIVE_WEBHOOK_SECRET,
    priceId: process.env.STRIPE_LIVE_PRICE_ID,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY,
  },
};

function requireEnv(value: string | undefined, key: string) {
  if (!value) {
    throw new Error(`${key} 환경 변수가 설정되어 있지 않습니다.`);
  }
  return value;
}

const activeConfig = stripeConfigs[STRIPE_MODE];

const STRIPE_SECRET_KEY = requireEnv(
  activeConfig.secretKey,
  STRIPE_MODE === "live" ? "STRIPE_LIVE_SECRET_KEY" : "STRIPE_TEST_SECRET_KEY"
);
const STRIPE_PRICE_ID = requireEnv(
  activeConfig.priceId,
  STRIPE_MODE === "live" ? "STRIPE_LIVE_PRICE_ID" : "STRIPE_TEST_PRICE_ID"
);

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
  appInfo: {
    name: "Alt Landing",
  },
});

export const STRIPE_PUBLISHABLE_KEY = activeConfig.publishableKey;
export const STRIPE_IS_LIVE = STRIPE_MODE === "live";

/**
 * 웹훅 시크릿을 지연 로드합니다.
 * 웹훅 라우트에서만 호출되어야 하며, 호출 시점에 환경 변수가 없으면 에러를 던집니다.
 *
 * @throws {Error} 웹훅 시크릿이 설정되지 않은 경우
 */
export function getWebhookSecret(): string {
  const webhookSecret = activeConfig.webhookSecret;
  const envKey = STRIPE_MODE === "live" ? "STRIPE_LIVE_WEBHOOK_SECRET" : "STRIPE_TEST_WEBHOOK_SECRET";

  if (!webhookSecret) {
    throw new Error(
      `${envKey} 환경 변수가 설정되어 있지 않습니다.\n\n` +
        `웹훅 시크릿을 설정하려면:\n` +
        `1. Stripe CLI를 실행: STRIPE_MODE=${STRIPE_MODE} node scripts/stripe-webhook.js\n` +
        `2. 출력된 "whsec_..." 값을 .env 파일의 ${envKey}에 추가\n` +
        `3. 개발 서버를 재시작하세요.\n\n` +
        `자세한 내용은 README.md의 "Stripe 웹훅 리스너" 섹션을 참고하세요.`
    );
  }

  return webhookSecret;
}

type BuildReturnUrlOptions = {
  locale?: string;
  pathname?: string;
  status?: "success" | "cancelled";
  query?: Record<string, string | undefined>;
};

const appBaseUrl =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_APP_URL || "https://altalt.io"
    : "http://localhost:3000";

export function buildStripeReturnUrl({
  locale = "en",
  pathname = "/pricing",
  status,
  query,
}: BuildReturnUrlOptions = {}) {
  const sanitizedLocale = locale.replace(/[^a-zA-Z-]/g, "") || "en";
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const url = new URL(`/${sanitizedLocale}${normalizedPath}`, appBaseUrl);

  if (status) {
    url.searchParams.set("status", status);
  }

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });
  }

  return url.toString();
}

export function getProPlanPriceId() {
  return STRIPE_PRICE_ID;
}
