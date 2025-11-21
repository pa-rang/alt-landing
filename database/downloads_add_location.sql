-- downloads 테이블에 location 컬럼 추가
ALTER TABLE public.downloads 
ADD COLUMN IF NOT EXISTS location VARCHAR(100) NULL;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_downloads_location ON public.downloads(location) WHERE location IS NOT NULL;

-- 커맨트 추가
COMMENT ON COLUMN public.downloads.location IS '다운로드 버튼이 위치한 페이지 (예: home, pricing, game)';

