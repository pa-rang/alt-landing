import { NextResponse } from "next/server";

const RELEASES_JSON_URL = "https://altalt-dev.s3.ap-northeast-2.amazonaws.com/alt/darwin/arm64/RELEASES.json";
const CLOUDFRONT_CDN_URL = "https://d31j0e9r0hmts6.cloudfront.net";
const CACHE_TTL = 10 * 60 * 1000; // 10분 (밀리초)

// 메모리 캐시: { cdnUrl: string, s3Url: string, expiresAt: number }
let cache: { cdnUrl: string; s3Url: string; expiresAt: number } | null = null;

interface ReleaseInfo {
  version: string;
  updateTo: {
    name: string;
    version: string;
    pub_date: string;
    url: string;
    notes: string;
  };
}

interface ReleasesJson {
  releases: ReleaseInfo[];
  currentRelease: string;
}

/**
 * RELEASES.json의 URL 형식(Alt-darwin-arm64-0.0.6.zip)을
 * CloudFront CDN URL과 S3 fallback URL로 변환
 *
 * @param url 원본 URL (예: https://.../Alt-darwin-arm64-0.0.6.zip)
 * @returns 변환된 URL 객체 (CDN URL 우선, S3 URL fallback)
 */
function convertDownloadUrl(url: string): { cdnUrl: string; s3Url: string } {
  try {
    // URL 파싱
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // 파일명 추출 (예: Alt-darwin-arm64-0.0.6.zip)
    const filename = pathname.split("/").pop() || "";

    // Alt-darwin-arm64-0.0.6.zip -> Alt-0.0.6-arm64.dmg 변환
    // 패턴: Alt-darwin-arm64-{version}.zip -> Alt-{version}-arm64.dmg
    const match = filename.match(/^Alt-darwin-arm64-(\d+\.\d+\.\d+)\.zip$/);

    if (match) {
      const version = match[1];
      const newFilename = `Alt-${version}-arm64.dmg`;

      // CloudFront CDN URL (우선 사용)
      const cdnUrl = `${CLOUDFRONT_CDN_URL}/${newFilename}`;
      // S3 직접 URL (fallback) - 원본 URL의 도메인과 경로를 그대로 사용
      const newPathname = pathname.replace(filename, newFilename);
      urlObj.pathname = newPathname;
      const s3Url = urlObj.toString();

      console.log(`[mac-api] URL converted: ${filename} -> CDN: ${cdnUrl}, S3: ${s3Url}`);
      return { cdnUrl, s3Url };
    }

    // 패턴이 맞지 않으면 원본 URL을 그대로 사용 (하위 호환성)
    console.warn(`[mac-api] URL pattern not matched, using original URL: ${filename}`);
    return { cdnUrl: url, s3Url: url };
  } catch (error) {
    console.error(`[mac-api] Error converting URL: ${error}`);
    return { cdnUrl: url, s3Url: url };
  }
}

async function fetchLatestDownloadUrl(): Promise<{ cdnUrl: string; s3Url: string }> {
  console.log(`[mac-api] Fetching RELEASES.json from: ${RELEASES_JSON_URL}`);

  try {
    const response = await fetch(RELEASES_JSON_URL, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RELEASES.json: ${response.status} ${response.statusText}`);
    }

    const data: ReleasesJson = await response.json();
    console.log(
      `[mac-api] RELEASES.json fetched successfully. currentRelease: ${data.currentRelease}, releases count: ${
        data.releases?.length || 0
      }`
    );
    console.log(`[mac-api] RELEASES.json full content:`, JSON.stringify(data, null, 2));

    // currentRelease가 있으면 해당 버전 찾기
    if (data.currentRelease) {
      const release = data.releases.find((r) => r.version === data.currentRelease);
      if (release?.updateTo?.url) {
        const originalUrl = release.updateTo.url;
        const convertedUrls = convertDownloadUrl(originalUrl);
        console.log(
          `[mac-api] Found release from currentRelease: ${data.currentRelease}, Original URL: ${originalUrl}`
        );
        return convertedUrls;
      }
      console.warn(`[mac-api] currentRelease (${data.currentRelease}) specified but matching release not found`);
    }

    // currentRelease가 없거나 못 찾으면 가장 최신 pub_date 찾기
    if (data.releases && data.releases.length > 0) {
      const sortedReleases = [...data.releases].sort((a, b) => {
        const dateA = new Date(a.updateTo.pub_date).getTime();
        const dateB = new Date(b.updateTo.pub_date).getTime();
        return dateB - dateA; // 내림차순 (최신이 먼저)
      });

      const latestRelease = sortedReleases[0];
      if (latestRelease?.updateTo?.url) {
        const originalUrl = latestRelease.updateTo.url;
        const convertedUrls = convertDownloadUrl(originalUrl);
        console.log(
          `[mac-api] Found latest release by pub_date: ${latestRelease.version}, Original URL: ${originalUrl}`
        );
        return convertedUrls;
      }
    }

    throw new Error("No valid release URL found in RELEASES.json");
  } catch (error) {
    console.error("[mac-api] Error fetching latest download URL:", error);
    throw error;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const debug = searchParams.get("debug") === "true";

  try {
    // 디버그 모드: 캐시 상태와 정보 반환
    if (debug) {
      const cacheStatus = cache
        ? {
            cdnUrl: cache.cdnUrl,
            s3Url: cache.s3Url,
            expiresAt: new Date(cache.expiresAt).toISOString(),
            isExpired: cache.expiresAt <= Date.now(),
            remainingMs: Math.max(0, cache.expiresAt - Date.now()),
          }
        : null;

      try {
        const latestUrls = await fetchLatestDownloadUrl();
        // 디버그 모드에서는 원본 URL도 확인하기 위해 RELEASES.json 다시 fetch
        const response = await fetch(RELEASES_JSON_URL, {
          headers: { Accept: "application/json" },
        });
        let originalUrl = latestUrls.cdnUrl;
        if (response.ok) {
          const data: ReleasesJson = await response.json();
          if (data.currentRelease) {
            const release = data.releases.find((r) => r.version === data.currentRelease);
            originalUrl = release?.updateTo?.url || latestUrls.cdnUrl;
          }
        }

        return NextResponse.json({
          debug: true,
          cache: cacheStatus,
          originalUrl,
          cdnUrl: latestUrls.cdnUrl,
          s3Url: latestUrls.s3Url,
          convertedUrl: latestUrls.cdnUrl, // 하위 호환성
          latestUrl: latestUrls.cdnUrl, // 하위 호환성
          releasesJsonUrl: RELEASES_JSON_URL,
          cacheTtlMinutes: CACHE_TTL / 1000 / 60,
        });
      } catch (error) {
        return NextResponse.json({
          debug: true,
          cache: cacheStatus,
          error: error instanceof Error ? error.message : "Unknown error",
          releasesJsonUrl: RELEASES_JSON_URL,
          cacheTtlMinutes: CACHE_TTL / 1000 / 60,
        });
      }
    }

    // CDN URL 유효성 체크 및 fallback 함수
    const getValidUrl = async (cdnUrl: string, s3Url: string): Promise<string> => {
      try {
        const headResponse = await fetch(cdnUrl, { method: "HEAD", signal: AbortSignal.timeout(3000) });
        if (headResponse.ok) {
          return cdnUrl;
        }
      } catch (error) {
        console.warn(`[mac-api] CDN URL check failed, using S3 fallback: ${error}`);
      }
      return s3Url;
    };

    // 캐시 확인
    if (cache && cache.expiresAt > Date.now()) {
      const remainingMinutes = Math.floor((cache.expiresAt - Date.now()) / 1000 / 60);
      console.log(`[mac-api] Using cached URL (expires in ${remainingMinutes} minutes): CDN=${cache.cdnUrl}`);
      // 캐시된 CDN URL 유효성 체크 후 리디렉션
      const validUrl = await getValidUrl(cache.cdnUrl, cache.s3Url);
      return NextResponse.redirect(validUrl);
    }

    console.log(`[mac-api] Cache miss or expired. Fetching latest URL...`);
    // 캐시가 없거나 만료되었으면 RELEASES.json에서 최신 URL 가져오기
    const latestUrls = await fetchLatestDownloadUrl();

    // CDN URL 유효성 체크
    const validUrl = await getValidUrl(latestUrls.cdnUrl, latestUrls.s3Url);

    // 캐시 업데이트
    cache = {
      cdnUrl: latestUrls.cdnUrl,
      s3Url: latestUrls.s3Url,
      expiresAt: Date.now() + CACHE_TTL,
    };

    console.log(
      `[mac-api] Cache updated. CDN: ${latestUrls.cdnUrl}, S3: ${
        latestUrls.s3Url
      }, using: ${validUrl}, expires at: ${new Date(cache.expiresAt).toISOString()}`
    );

    // 유효한 URL로 리디렉션
    return NextResponse.redirect(validUrl);
  } catch (error) {
    console.error("[mac-api] Download API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch download URL",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
