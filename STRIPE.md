# Stripe 구독 통합 문서

## 개요

이 프로젝트는 Stripe Checkout과 Customer Portal을 사용하여 구독 결제를 처리합니다. 최소 구현 비용으로 구독 기능을 제공하며, Stripe에서 제공하는 기능을 최대한 활용합니다.

## 아키텍처

### 데이터베이스 스키마

- **`user_profiles` 테이블**

  - `stripe_customer_id`: Stripe 고객 ID 저장
  - `subscription_status`: 구독 상태 (`free`, `active`, `past_due`, `canceled`)

- **`stripe_events` 테이블**
  - 모든 웹훅 이벤트를 멱등성 보장을 위해 저장
  - `id`: Stripe 이벤트 ID (PK)
  - `type`: 이벤트 타입

### 주요 파일 구조

```
src/
├── lib/
│   └── stripe.ts                    # Stripe SDK 초기화 및 헬퍼 함수
├── app/
│   ├── api/
│   │   └── stripe/
│   │       ├── checkout/route.ts     # Checkout 세션 생성
│   │       ├── portal/route.ts       # Customer Portal 세션 생성
│   │       └── webhook/route.ts     # 웹훅 이벤트 처리
│   └── [locale]/
│       └── pricing/
│           ├── page.tsx              # 서버 컴포넌트
│           └── PricingPageClient.tsx # 클라이언트 컴포넌트
└── components/
    ├── AuthButton.tsx                # 헤더의 인증 버튼 (구독 관리 포함)
    └── PricingButton.tsx             # 헤더의 Pricing 링크 버튼
```

## 구독 플로우

### 1. 구독 시작 (`/api/stripe/checkout`)

1. 사용자가 `/pricing` 페이지에서 "구독하기" 버튼 클릭
2. 클라이언트가 `/api/stripe/checkout`에 POST 요청
3. 서버에서:
   - Supabase 인증 확인
   - `user_profiles` 테이블에 사용자 프로필 생성/업데이트
   - Stripe Customer 생성 (없는 경우) 또는 기존 Customer 사용
   - Stripe Checkout Session 생성
   - Checkout URL 반환
4. 클라이언트가 Checkout URL로 리다이렉트

### 2. 결제 완료 후 리다이렉트

- 성공: `/{locale}/pricing?status=success` → 성공 토스트 표시
- 취소: `/{locale}/pricing?status=cancelled` → 취소 토스트 표시

### 3. 웹훅 처리 (`/api/stripe/webhook`)

Stripe가 다음 이벤트를 전송하면 자동으로 처리됩니다:

- **`checkout.session.completed`**

  - `stripe_customer_id` 저장
  - `subscription_status`를 `active`로 설정 (subscription 모드이고 결제 완료된 경우)

- **`customer.subscription.created` / `customer.subscription.updated`**

  - 구독 상태를 `subscription_status`로 동기화
  - 상태 매핑: `active` → `active`, `trialing` → `active` (trial 미제공), `past_due` → `past_due`, `canceled` → `canceled`, 기타 → `free`

- **`customer.subscription.deleted`**

  - `subscription_status`를 `canceled`로 설정

- **`invoice.paid`**

  - `subscription_status`를 `active`로 설정

- **`invoice.payment_failed`**
  - `subscription_status`를 `past_due`로 설정

모든 이벤트는 `stripe_events` 테이블에 저장되어 중복 처리 방지 (멱등성 보장).

### 4. 구독 관리 (`/api/stripe/portal`)

- 구독 중인 사용자만 접근 가능 (`subscription_status`가 `active` 또는 `past_due`)
- Stripe Customer Portal 세션 생성
- 사용자가 결제 수단 변경, 구독 취소 등을 직접 처리

### 5. 환경 간 Customer ID 불일치 자동 복구

Test Mode와 Live Mode(프로덕션)는 데이터가 완전히 격리되어 있어, Test Mode에서 생성된 `stripe_customer_id`는 Live Mode에서 유효하지 않습니다.

- **문제 상황**: 개발 환경(Test Mode)에서 생성된 계정으로 프로덕션(Live Mode)에서 결제 시도 시 `resource_missing` 에러 발생
- **해결 로직**: `/api/stripe/checkout`에서 `resource_missing` 에러 감지 시:
  1. 자동으로 현재 환경(Live)에 맞는 새로운 Stripe Customer 생성
  2. DB의 `stripe_customer_id` 업데이트
  3. 결제 세션 생성 재시도
- **개발자 조치**: 별도 조치 불필요 (자동 처리됨)

## 환경 변수 설정

`.env` 파일에 다음 변수들을 설정해야 합니다:

| 변수명                       | 설명                                   |
| ---------------------------- | -------------------------------------- |
| `STRIPE_MODE`                | `test` (기본) 또는 `live`              |
| `STRIPE_TEST_SECRET_KEY`     | 테스트 모드 Secret Key                 |
| `STRIPE_LIVE_SECRET_KEY`     | 라이브 모드 Secret Key                 |
| `STRIPE_TEST_WEBHOOK_SECRET` | 테스트 모드 웹훅 시크릿                |
| `STRIPE_LIVE_WEBHOOK_SECRET` | 라이브 모드 웹훅 시크릿                |
| `STRIPE_TEST_PRICE_ID`       | 테스트 모드 Pro 플랜 Price ID          |
| `STRIPE_LIVE_PRICE_ID`       | 라이브 모드 Pro 플랜 Price ID          |
| `NEXT_PUBLIC_APP_URL`        | 프로덕션 URL (예: `https://altalt.io`) |

## 로컬 개발 환경 설정

### 1. Stripe CLI 설치 및 로그인

```bash
# Stripe CLI 설치 (macOS)
brew install stripe/stripe-cli/stripe

# Stripe CLI 로그인
stripe login
```

### 2. 웹훅 리스너 실행

**중요**: 백엔드와 동일한 Stripe 계정을 사용해야 합니다. `scripts/stripe-webhook.js`가 자동으로 `.env` 파일에서 API 키를 읽어 사용합니다.

```bash
NODE_ENV=development STRIPE_MODE=test node scripts/stripe-webhook.js
```

실행하면 다음과 같은 출력이 나타납니다:

```
🔔 Starting Stripe webhook listener (test mode)...
📍 Forwarding to: http://localhost:3000/api/stripe/webhook
🔑 [STRIPE-CLI] Using API key: sk_test_...
> Ready! Your webhook signing secret is whsec_... (^C to quit)
```

**반드시** 출력된 `whsec_...` 값을 `.env` 파일의 `STRIPE_TEST_WEBHOOK_SECRET`에 복사하고 dev 서버를 재시작해야 합니다.

### 3. 개발 서버 실행

```bash
pnpm dev
```

### 4. 테스트

1. 로컬에서 `/pricing` 페이지 접속
2. 로그인 후 "구독하기" 버튼 클릭
3. Stripe Checkout에서 테스트 카드로 결제:
   - 카드 번호: `4242 4242 4242 4242`
   - 만료일: 미래 날짜
   - CVC: 임의의 3자리 숫자
4. 결제 완료 후 리다이렉트 확인
5. Stripe CLI 창에서 이벤트 로그 확인:
   ```
   → event checkout.session.completed
   → endpoint http://localhost:3000/api/stripe/webhook [200]
   ```
6. 데이터베이스 확인:
   - `user_profiles.subscription_status`가 `active`로 변경되었는지
   - `stripe_events` 테이블에 이벤트가 기록되었는지

### 수동 이벤트 트리거 (테스트용)

```bash
# Checkout 완료 이벤트 트리거
stripe trigger checkout.session.completed

# 구독 업데이트 이벤트 트리거
stripe trigger customer.subscription.updated
```

## 프로덕션 배포

### 1. Stripe Dashboard에서 웹훅 엔드포인트 등록

1. [Stripe Dashboard](https://dashboard.stripe.com/webhooks) 접속
2. "Add endpoint" 클릭
3. Endpoint URL: `https://www.altalt.io/api/stripe/webhook`
4. 이벤트 선택:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. "Add endpoint" 클릭
6. 생성된 웹훅의 "Signing secret" 복사
7. `.env` 파일의 `STRIPE_LIVE_WEBHOOK_SECRET`에 설정

### 2. 환경 변수 설정

Vercel 등의 배포 플랫폼에서 다음 환경 변수를 설정:

- `STRIPE_MODE=live`
- `STRIPE_LIVE_SECRET_KEY`
- `STRIPE_LIVE_WEBHOOK_SECRET`
- `STRIPE_LIVE_PRICE_ID`
- `NEXT_PUBLIC_APP_URL=https://www.altalt.io`

## 문제 해결

### `stripe_events` 테이블이 비어있음

**원인**: 웹훅 이벤트가 서버에 도달하지 않았습니다.

**해결 방법**:

1. Stripe CLI가 실행 중인지 확인
2. `.env`의 `STRIPE_TEST_WEBHOOK_SECRET`이 최신 값인지 확인
3. Stripe CLI 창에서 이벤트 로그가 나타나는지 확인
4. `stripe trigger checkout.session.completed`로 수동 테스트

### 구독/결제 관리 메뉴가 보이지 않음

**원인**: `subscription_status`가 `active` 또는 `past_due`가 아닙니다.

**해결 방법**:

1. `user_profiles` 테이블에서 `subscription_status` 확인
2. 웹훅이 정상적으로 처리되었는지 확인 (`stripe_events` 테이블 확인)
3. 필요시 `stripe trigger customer.subscription.updated`로 수동 동기화

### 웹훅 서명 검증 실패

**원인**: `.env`의 웹훅 시크릿이 Stripe CLI에서 발급된 값과 일치하지 않습니다.

**해결 방법**:

1. Stripe CLI를 재시작하여 새로운 `whsec_...` 값 받기
2. `.env` 파일 업데이트
3. dev 서버 재시작

### 로컬 Checkout 완료 후 이벤트가 오지 않음

**원인**: Stripe CLI가 백엔드와 다른 Stripe 계정을 사용하고 있습니다.

**해결 방법**:

- `scripts/stripe-webhook.js`가 자동으로 `.env`의 API 키를 사용하도록 수정되어 있습니다.
- 스크립트 실행 시 "Using API key: sk*test*..." 메시지가 나타나는지 확인
- 백엔드에서 사용하는 `STRIPE_TEST_SECRET_KEY`와 동일한지 확인

## 주의사항

### ⚠️ 꼭 기억해야 할 것

1. **Stripe CLI와 백엔드가 동일한 Stripe 계정을 사용해야 합니다**

   - 다른 계정을 사용하면 로컬 Checkout 이벤트가 절대 도착하지 않습니다
   - `scripts/stripe-webhook.js`가 자동으로 `.env`의 키를 사용하므로 이 문제는 해결되었습니다

2. **웹훅 시크릿을 변경할 때마다 dev 서버를 재시작해야 합니다**

   - 새로운 `whsec_...` 값을 받으면 반드시 `.env` 업데이트 후 서버 재시작
   - 그렇지 않으면 모든 웹훅 요청이 서명 검증 실패로 400 에러 반환

3. **`stripe_events` 테이블이 비어있다면 웹훅이 도달하지 않은 것입니다**

   - 코드 문제가 아니라 이벤트 전달 경로 문제일 가능성이 높습니다
   - Stripe CLI 로그를 먼저 확인하세요

4. **프로덕션에서는 Stripe Dashboard에서 웹훅 엔드포인트를 등록해야 합니다**
   - 로컬 개발용 Stripe CLI는 프로덕션 환경에서 작동하지 않습니다
   - 반드시 Dashboard에서 엔드포인트를 등록하고 시크릿을 환경 변수에 설정하세요

## 참고 자료

- [Stripe Checkout Quickstart](https://docs.stripe.com/checkout/quickstart.md)
- [Stripe Webhooks Guide](https://docs.stripe.com/webhooks.md)
- [Stripe Customer Portal](https://docs.stripe.com/payments/checkout/custom-success-page.md)
- [Stripe Testing Guide](https://docs.stripe.com/testing.md)
