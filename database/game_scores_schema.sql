-- 게임 점수 테이블 생성
CREATE TABLE IF NOT EXISTS public.game_scores (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  organization VARCHAR(255) NOT NULL,
  nickname VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
-- 개인 리더보드용: 점수 내림차순
CREATE INDEX IF NOT EXISTS idx_game_scores_score ON public.game_scores(score DESC);

-- 학교/직장 리더보드용: organization과 score
CREATE INDEX IF NOT EXISTS idx_game_scores_organization ON public.game_scores(organization, score DESC);

-- 이메일 검색용
CREATE INDEX IF NOT EXISTS idx_game_scores_email ON public.game_scores(email);

-- 커맨트 추가
COMMENT ON TABLE public.game_scores IS '네모토마토 게임 점수를 저장하는 테이블';
COMMENT ON COLUMN public.game_scores.email IS '사용자 이메일 (UNIQUE, 한 이메일당 하나의 최고 점수만 저장)';
COMMENT ON COLUMN public.game_scores.organization IS '이메일 도메인에서 추출된 학교/직장명';
COMMENT ON COLUMN public.game_scores.nickname IS '사용자 닉네임';
COMMENT ON COLUMN public.game_scores.score IS '게임 점수';
COMMENT ON COLUMN public.game_scores.created_at IS '최초 등록 시간';
COMMENT ON COLUMN public.game_scores.updated_at IS '최근 업데이트 시간';
