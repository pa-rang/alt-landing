#!/usr/bin/env node

/**
 * Stripe 웹훅 리스너 스크립트
 * STRIPE_MODE 환경 변수에 따라 test/live 모드로 자동 실행
 * 백엔드와 동일한 Stripe 계정을 사용하도록 .env 파일에서 키를 읽어옵니다.
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// .env 파일 읽기 및 파싱
function loadEnvFile() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) {
    console.warn("⚠️  .env 파일을 찾을 수 없습니다. 환경 변수를 직접 설정해주세요.");
    return {};
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const env = {};

  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // 따옴표 제거
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      env[key] = value;
    }
  });

  return env;
}

const env = loadEnvFile();
const stripeMode = process.env.STRIPE_MODE === "live" || env.STRIPE_MODE === "live" ? "live" : "test";
const isLive = stripeMode === "live";

// 백엔드와 동일한 Stripe API 키 사용
const stripeApiKey = isLive
  ? process.env.STRIPE_LIVE_SECRET_KEY || env.STRIPE_LIVE_SECRET_KEY
  : process.env.STRIPE_TEST_SECRET_KEY || env.STRIPE_TEST_SECRET_KEY;

if (!stripeApiKey) {
  console.error("❌ [STRIPE-CLI] Stripe API 키를 찾을 수 없습니다.");
  console.error(
    `💡 [STRIPE-CLI] ${
      isLive ? "STRIPE_LIVE_SECRET_KEY" : "STRIPE_TEST_SECRET_KEY"
    } 환경 변수를 설정하거나 .env 파일에 추가해주세요.`
  );
  process.exit(1);
}

/**
 * 웹훅 포워딩 URL 결정
 * - STRIPE_WEBHOOK_FORWARD_URL이 있으면 최우선 사용
 * - 없으면 로컬(dev)에서는 localhost, 그 외에는 NEXT_PUBLIC_APP_URL 사용
 */
const getDefaultWebhookUrl = () => {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000/api/stripe/webhook";
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/webhook`;
  }

  // 안전한 기본값
  return "http://localhost:3000/api/stripe/webhook";
};

const webhookUrl = process.env.STRIPE_WEBHOOK_FORWARD_URL || getDefaultWebhookUrl();

console.log(`🔔 Starting Stripe webhook listener (${stripeMode} mode)...`);
console.log(`📍 Forwarding to: ${webhookUrl}`);

const args = ["listen", "--forward-to", webhookUrl];

// 라이브 모드일 경우 --live 플래그 추가
if (isLive) {
  args.push("--live");
  console.log("⚠️  LIVE MODE: Using live Stripe keys");
}

console.log("🔔 [STRIPE-CLI] Executing command: stripe", args.join(" "));
console.log(`🔑 [STRIPE-CLI] Using API key: ${stripeApiKey.substring(0, 20)}...`);

const stripeProcess = spawn("stripe", args, {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    STRIPE_API_KEY: stripeApiKey,
  },
});

stripeProcess.on("error", (error) => {
  console.error("❌ [STRIPE-CLI] Failed to start Stripe CLI:", error.message);
  console.error("💡 Make sure Stripe CLI is installed: https://stripe.com/docs/stripe-cli");
  process.exit(1);
});

stripeProcess.on("exit", (code) => {
  if (code !== 0) {
    console.error(`❌ [STRIPE-CLI] Stripe CLI exited with code ${code}`);
    process.exit(code);
  }
});

console.log("🔔 [STRIPE-CLI] Stripe CLI process started");
console.log("🔔 [STRIPE-CLI] Waiting for webhook events...");
console.log("💡 [STRIPE-CLI] Tip: Make sure you're logged in to Stripe CLI with: stripe login");
console.log("💡 [STRIPE-CLI] To trigger a test event manually, use: stripe trigger checkout.session.completed");
