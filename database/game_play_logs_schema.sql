-- 게임 플레이 로그 테이블 생성 (모든 등록 이벤트 기록)
CREATE TABLE IF NOT EXISTS public.game_play_logs (
  id SERIAL PRIMARY KEY,
  nickname VARCHAR(100) NOT NULL,
  organization VARCHAR(255) NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (최신 기록 조회용)
CREATE INDEX IF NOT EXISTS idx_game_play_logs_created_at ON public.game_play_logs(created_at DESC);

-- 커맨트 추가
COMMENT ON TABLE public.game_play_logs IS '모든 게임 플레이 등록 이벤트를 기록하는 테이블 (슬랙 노티와 동일)';
COMMENT ON COLUMN public.game_play_logs.nickname IS '사용자 닉네임';
COMMENT ON COLUMN public.game_play_logs.organization IS '학교/직장명';
COMMENT ON COLUMN public.game_play_logs.score IS '게임 점수';
COMMENT ON COLUMN public.game_play_logs.created_at IS '등록 시간';

