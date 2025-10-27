-- 피드백 테이블 생성
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id SERIAL PRIMARY KEY,
  feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('issue', 'idea')),
  content TEXT NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON public.feedbacks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_feedback_type ON public.feedbacks(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedbacks_deleted_at ON public.feedbacks(deleted_at) WHERE deleted_at IS NULL;

-- 커맨트 추가
COMMENT ON TABLE public.feedbacks IS '사용자 피드백을 저장하는 테이블';
COMMENT ON COLUMN public.feedbacks.feedback_type IS '피드백 유형: issue(이슈) 또는 idea(아이디어)';
COMMENT ON COLUMN public.feedbacks.content IS '피드백 내용';
COMMENT ON COLUMN public.feedbacks.email IS '답변을 위한 이메일 주소';
COMMENT ON COLUMN public.feedbacks.deleted_at IS '소프트 삭제를 위한 타임스탬프';

