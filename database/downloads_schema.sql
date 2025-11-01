-- 다운로드 로그 테이블 생성
CREATE TABLE IF NOT EXISTS public.downloads (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NULL,
  platform VARCHAR(50) NOT NULL DEFAULT 'macos',
  user_agent TEXT NULL,
  ip_address VARCHAR(45) NULL,
  download_url TEXT NOT NULL,
  version VARCHAR(50) NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_downloads_created_at ON public.downloads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_downloads_email ON public.downloads(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_downloads_platform ON public.downloads(platform);

-- 커맨트 추가
COMMENT ON TABLE public.downloads IS 'alt 다운로드 로그를 저장하는 테이블';
COMMENT ON COLUMN public.downloads.email IS '사용자 이메일 (선택적, 게임에서 다운로드하는 경우에만 제공)';
COMMENT ON COLUMN public.downloads.platform IS '다운로드 플랫폼 (macos, windows 등)';
COMMENT ON COLUMN public.downloads.user_agent IS '사용자 브라우저 정보';
COMMENT ON COLUMN public.downloads.ip_address IS '다운로드 요청 IP 주소';
COMMENT ON COLUMN public.downloads.download_url IS '실제 다운로드된 파일 URL';
COMMENT ON COLUMN public.downloads.version IS '다운로드된 버전 정보';
COMMENT ON COLUMN public.downloads.created_at IS '다운로드 발생 시간';

