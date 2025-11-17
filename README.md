# Alt Landing

Alt의 마케팅/구독 온보딩을 위한 Next.js 15 + Supabase 기반 애플리케이션입니다. Stripe Checkout & Customer Portal을 통해 최소 구현 비용으로 구독을 운영합니다.

## 요구 사항

- Node.js 20+
- pnpm
- Stripe CLI (웹훅 테스트용)
- Supabase 프로젝트 (Database + Auth)

## 환경 변수

다음 변수를 `.env.local`에 설정해야 합니다.

| Key                                                                                          | 설명                                                 |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                                                                        | 프로덕션/프리뷰 베이스 URL (예: `https://altalt.io`) |
| `NEXT_PUBLIC_SUPABASE_URL`                                                                   | Supabase 프로젝트 URL                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                                                              | Supabase anon key                                    |
| `SUPABASE_SERVICE_ROLE_KEY`                                                                  | Supabase service role key (웹훅에서 RLS 우회)        |
| `DATABASE_URL`                                                                               | Supabase/Postgres 연결 문자열 (`sslmode=require`)    |
| `STRIPE_MODE`                                                                                | `test`(기본) 또는 `live`                             |
| `STRIPE_TEST_SECRET_KEY` / `STRIPE_LIVE_SECRET_KEY`                                          | Stripe 대시보드에서 발급한 Secret key                |
| `STRIPE_TEST_WEBHOOK_SECRET` / `STRIPE_LIVE_WEBHOOK_SECRET`                                  | `stripe listen` 혹은 대시보드에서 발급된 웹훅 시크릿 |
| `STRIPE_TEST_PRICE_ID` / `STRIPE_LIVE_PRICE_ID`                                              | Pro 플랜 Price ID (`price_xxx`)                      |
| `NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY` / `NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY` (선택) | Stripe JS가 필요할 때 사용                           |

## 개발 서버 실행

```bash
pnpm install
pnpm dev
```

기본적으로 [http://localhost:3000](http://localhost:3000)에서 동작합니다. `NEXT_PUBLIC_APP_URL`을 설정하면 Stripe 리다이렉트 URL도 동일 값을 사용합니다.

## Stripe 웹훅 리스너

```bash
STRIPE_MODE=test node scripts/stripe-webhook.js
```

혹은 수동으로 `stripe listen --forward-to http://localhost:3000/api/stripe/webhook` 명령을 사용할 수 있습니다.

테스트 시 [Stripe Testing 가이드](https://docs.stripe.com/testing.md)를 참고해 카드 번호를 사용하세요.

## 수동 검증 체크리스트

1. `pnpm dev`로 앱을 실행합니다.
2. 다른 터미널에서 `STRIPE_MODE=test node scripts/stripe-webhook.js`를 실행해 Stripe CLI 웹훅을 연결합니다.
3. Supabase에 가입한 테스트 계정을 만들고 `/en/pricing` 페이지에서 구독 버튼을 눌러 Checkout이 열리는지 확인합니다.
4. Stripe CLI에서 `stripe trigger checkout.session.completed` 혹은 `stripe trigger customer.subscription.updated`를 실행해 이벤트가 웹훅으로 들어오는지 확인합니다.
5. 이벤트가 처리되면 `user_profiles.subscription_status`가 `active`로 갱신되고, `/pricing` 페이지 및 헤더의 Auth 메뉴에 “구독/결제 관리”가 노출되는지 확인합니다.
6. 문제가 있으면 Stripe Dashboard의 [Events](https://dashboard.stripe.com/test/events)에서 페이로드를 확인하고, 동일 이벤트 ID가 `stripe_events` 테이블에 저장되었는지 확인합니다.
