<!-- e8c2a28c-137e-407e-9b7d-076ee1520635 a891bd85-736c-4eb6-9b08-503a7473c300 -->
# 네모토마토 게임 리더보드 구현 계획

## 1. 데이터베이스 스키마 생성

### `database/game_scores_schema.sql` 생성

- `game_scores` 테이블 생성
  - `id`: SERIAL PRIMARY KEY
  - `email`: VARCHAR(255) NOT NULL UNIQUE - 한 이메일당 하나의 최고 점수만 저장
  - `organization`: VARCHAR(255) NOT NULL - 이메일 도메인에서 추출된 학교/직장
  - `nickname`: VARCHAR(100) NOT NULL - 사용자 닉네임
  - `score`: INTEGER NOT NULL - 게임 점수
  - `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  - `updated_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- 인덱스 생성
  - 개인 리더보드용: `idx_game_scores_score` (score DESC)
  - 학교/직장 리더보드용: `idx_game_scores_organization` (organization, score DESC)
- `ON CONFLICT (email) DO UPDATE` 로직으로 최고 점수만 유지

## 2. Validation 스키마 생성

### `src/lib/validation/game-score.ts` 생성

- Zod 스키마 정의
  - `email`: 이메일 형식 검증
  - `organization`: 1-255자, 공백 제거
  - `nickname`: 1-100자, 특수문자 제한
  - `score`: 0 이상 정수
- 다국어 에러 메시지 지원

## 3. API 엔드포인트 구현

### `src/app/api/game/score/route.ts` 생성

- POST: 점수 제출
  - validation 수행
  - 기존 점수보다 높을 경우만 업데이트
  - Slack 알림 전송 (선택적)
  - 성공 시 개인 순위 반환

### `src/app/api/game/leaderboard/route.ts` 생성

- GET: 리더보드 조회
  - Query params: `type` (personal | organization)
  - 개인 리더보드: 상위 100명 (email, nickname, score)
  - 학교/직장 리더보드: organization별 최고 점수 합산, 상위 50개 (organization, total_score, member_count)

## 4. UI 컴포넌트 구현

### `src/components/game-leaderboard.tsx` 생성

- 개인 리더보드 테이블 컴포넌트
  - 순위, 닉네임, 점수 표시
  - 본인 점수 하이라이트
- 학교/직장 리더보드 테이블 컴포넌트
  - 순위, 학교/직장명, 총점, 멤버 수 표시
  - 본인 소속 하이라이트
- 로딩/에러 상태 처리

### `src/components/game-score-submit.tsx` 생성

- 점수 제출 폼
  - 이메일 입력받아 organization, nickname 추출하여 default 설정
  - organization input (editable, 이메일 도메인 @ 뒤)
  - nickname input (editable, 이메일 @ 앞)
  - 제출 시 validation 및 API 호출
  - 제출 완료 후 리더보드 표시

### `src/components/download-game.tsx` 수정

- 탭 시스템 추가
  - 게임 탭 (기존 게임 화면)
  - 개인 리더보드 탭
  - 학교/직장 리더보드 탭
- 게임 종료 시 모달 수정
  - 점수 제출 폼 표시 (필수)
  - 제출 후 리더보드 탭으로 자동 전환
  - 닫기 버튼 제거 (제출 필수)
- State 관리
  - 현재 선택된 탭
  - 제출된 이메일 정보
  - 리더보드 데이터

## 5. 다국어 지원

### `src/locales/ko.json` 업데이트

```json
"game": {
  "tabs": {
    "game": "게임",
    "personalLeaderboard": "개인 순위",
    "organizationLeaderboard": "학교/직장 순위"
  },
  "leaderboard": {
    "rank": "순위",
    "nickname": "닉네임",
    "organization": "학교/직장",
    "score": "점수",
    "totalScore": "총점",
    "members": "멤버 수",
    "loading": "불러오는 중...",
    "error": "리더보드를 불러올 수 없습니다.",
    "empty": "아직 등록된 점수가 없습니다."
  },
  "scoreSubmit": {
    "title": "리더보드에 등록하기",
    "emailLabel": "이메일",
    "organizationLabel": "학교/직장",
    "nicknameLabel": "닉네임",
    "submit": "등록하기",
    "submitting": "등록 중...",
    "success": "리더보드에 등록되었습니다!",
    "messages": { ... }
  }
}
```

### `src/locales/en.json` 업데이트

- 동일한 구조로 영어 번역 추가

## 6. 타입 정의

### 타입 추가

- `GameScore` 타입 (DB 레코드)
- `LeaderboardEntry` 타입 (개인)
- `OrganizationLeaderboardEntry` 타입 (학교/직장)
- `GameScoreInput` 타입 (제출 폼)

## 구현 순서

1. DB 스키마 및 validation 스키마
2. API 엔드포인트 (score, leaderboard)
3. 리더보드 컴포넌트
4. 점수 제출 폼 컴포넌트
5. 게임 컴포넌트 통합 (탭, 모달 수정)
6. 다국어 지원 및 테스트

### To-dos

- [ ] 데이터베이스 스키마 생성 (game_scores 테이블)
- [ ] 게임 점수 validation 스키마 생성
- [ ] 점수 제출 API 엔드포인트 구현 (/api/game/score)
- [ ] 리더보드 조회 API 엔드포인트 구현 (/api/game/leaderboard)
- [ ] 리더보드 UI 컴포넌트 구현
- [ ] 점수 제출 폼 컴포넌트 구현
- [ ] 게임 컴포넌트에 탭 시스템 및 모달 통합
- [ ] 다국어 지원 (ko.json, en.json 업데이트)