# 일렉트론 앱 인증 구현 가이드

이 문서는 Next.js 서버를 백엔드로 사용하는 일렉트론 앱에서 로그인/회원가입을 구현하는 방법을 설명합니다.

## 개요

현재 Next.js 앱은 Supabase를 사용한 Email OTP 인증을 제공합니다. 일렉트론 앱은 이 API를 호출하여 인증을 수행합니다.

**인증 플로우:**

1. 사용자가 이메일 입력 → OTP 코드 전송
2. 이메일로 받은 6자리 코드 입력 → 인증 완료
3. 세션 토큰을 로컬에 저장하여 이후 요청에 사용

## API 엔드포인트

### 1. OTP 코드 전송

```
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "success": true
}
또는
{
  "error": "Error message"
}
```

### 2. OTP 코드 인증

```
POST /api/auth/verify
Content-Type: application/json

{
  "email": "user@example.com",
  "token": "123456"
}

Response:
{
  "success": true,
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_at": 1234567890,
    "expires_in": 3600
  },
  "user": {
    "id": "...",
    "email": "user@example.com"
  }
}
또는
{
  "error": "Error message"
}
```

### 3. 로그아웃

```
POST /api/auth/signout
Authorization: Bearer <access_token>

Response:
{
  "success": true
}
```

### 4. 인증 상태 확인 (선택사항)

```
GET /api/auth/session
Authorization: Bearer <access_token>

Response:
{
  "user": {
    "id": "...",
    "email": "user@example.com"
  }
}
또는
{
  "error": "Not authenticated"
}
```

## 일렉트론 앱 구현

### 1. 패키지 설치

### 1.1 Preload Script 설정

렌더러 프로세스에서 IPC를 사용하기 위해 preload script를 설정해야 합니다:

```typescript
// src/main/preload.ts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
});
```

```typescript
// src/main/index.ts에서 BrowserWindow 생성 시
const mainWindow = new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, "preload.js"), // 빌드된 preload 파일 경로
    contextIsolation: true,
    nodeIntegration: false,
  },
});
```

### 1.2 TypeScript 타입 정의 (선택사항)

렌더러 프로세스에서 타입 안정성을 위해:

```typescript
// src/renderer/types/electron.d.ts
interface ElectronAPI {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
```

### 2. 인증 서비스 구현

가장 단순한 형태의 인증 서비스입니다:

```typescript
// src/services/authService.ts
import Store from "electron-store";

interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  email: string;
}

class AuthService {
  private store: Store;
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
    this.store = new Store({ name: "auth" });
  }

  // OTP 코드 전송
  async sendOTP(email: string) {
    const res = await fetch(`${this.apiUrl}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return res.ok ? { success: true } : { success: false, error: data.error };
  }

  // OTP 코드 인증
  async verifyOTP(email: string, token: string) {
    const res = await fetch(`${this.apiUrl}/api/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token }),
    });
    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error };
    }

    // 세션 저장
    if (data.session) {
      const session: Session = {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
        email: data.user?.email || email,
      };
      this.store.set("session", session);
      return { success: true, session };
    }

    return { success: false, error: "No session returned" };
  }

  // 로그아웃
  async signOut() {
    const session = this.getSession();
    this.store.delete("session"); // 로컬 세션 먼저 삭제

    if (session) {
      try {
        await fetch(`${this.apiUrl}/api/auth/signout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
      } catch {
        // 네트워크 에러는 무시 (로컬 세션은 이미 삭제됨)
      }
    }

    return { success: true };
  }

  // 현재 세션 가져오기
  getSession(): Session | null {
    const session = this.store.get("session") as Session | undefined;
    if (!session) return null;

    // 만료 확인
    if (session.expiresAt && Date.now() / 1000 > session.expiresAt) {
      this.store.delete("session");
      return null;
    }

    return session;
  }

  // 인증 상태 확인
  isAuthenticated(): boolean {
    return this.getSession() !== null;
  }

  // 사용자 이메일 가져오기
  getEmail(): string | null {
    return this.getSession()?.email || null;
  }
}

export default AuthService;
```

### 3. IPC 핸들러 설정

```typescript
// src/main/ipc/authHandlers.ts
import { ipcMain } from "electron";
import AuthService from "../services/authService";

export function setupAuthHandlers(authService: AuthService) {
  ipcMain.handle("auth:sendOTP", (_, email: string) => authService.sendOTP(email));

  ipcMain.handle("auth:verifyOTP", (_, email: string, token: string) => authService.verifyOTP(email, token));

  ipcMain.handle("auth:signOut", () => authService.signOut());

  ipcMain.handle("auth:getSession", () => ({
    isAuthenticated: authService.isAuthenticated(),
    email: authService.getEmail(),
  }));
}
```

### 4. 메인 프로세스에서 초기화

```typescript
// src/main/index.ts
import { app, BrowserWindow } from "electron";
import AuthService from "./services/authService";
import { setupAuthHandlers } from "./ipc/authHandlers";

// API URL 설정
// 프로덕션: 실제 서버 URL로 변경
// 개발: http://localhost:3000 또는 실제 개발 서버 URL
const API_URL = process.env.API_URL || "https://your-domain.com";

// 인증 서비스 초기화
const authService = new AuthService(API_URL);

// IPC 핸들러 등록 (app.whenReady() 이후에 호출)
app.whenReady().then(() => {
  setupAuthHandlers(authService);

  // ... 나머지 앱 초기화 코드
});
```

### 5. 렌더러 프로세스에서 사용

```typescript
// src/renderer/auth.ts
export const authAPI = {
  sendOTP: (email: string) => window.electronAPI.invoke("auth:sendOTP", email),

  verifyOTP: (email: string, token: string) => window.electronAPI.invoke("auth:verifyOTP", email, token),

  signOut: () => window.electronAPI.invoke("auth:signOut"),

  getSession: () => window.electronAPI.invoke("auth:getSession"),
};
```

### 6. UI 구현 예제

```typescript
// src/renderer/components/LoginForm.tsx
import { useState } from "react";
import { authAPI } from "../auth";

export function LoginForm() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOTP = async () => {
    setLoading(true);
    setError("");
    const result = await authAPI.sendOTP(email);
    if (result.success) {
      setStep("otp");
    } else {
      setError(result.error || "OTP 전송 실패");
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setError("");
    const result = await authAPI.verifyOTP(email, otp);
    if (result.success) {
      // 로그인 성공 - 메인 화면으로 이동
      window.location.href = "/main";
    } else {
      setError(result.error || "인증 실패");
    }
    setLoading(false);
  };

  if (step === "email") {
    return (
      <div>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" />
        <button onClick={handleSendOTP} disabled={loading}>
          {loading ? "전송 중..." : "인증 코드 전송"}
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <input
        type="text"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="6자리 코드"
        maxLength={6}
      />
      <button onClick={handleVerifyOTP} disabled={loading}>
        {loading ? "인증 중..." : "인증하기"}
      </button>
      <button onClick={() => setStep("email")}>이메일 다시 입력</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
```

## API 요청 시 인증 토큰 사용

다른 API를 호출할 때는 저장된 세션의 `accessToken`을 Authorization 헤더에 포함하세요:

```typescript
// 예제: 인증이 필요한 API 호출
const session = authService.getSession();
if (!session) {
  // 로그인 필요
  return;
}

const response = await fetch(`${API_URL}/api/some-endpoint`, {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.accessToken}`,
  },
});
```

## 환경 변수 설정

일렉트론 앱에서 사용할 API URL을 환경 변수로 설정하세요:

```bash
# .env 파일
API_URL=https://altalt.io
# 또는 개발 환경
API_URL=http://localhost:3000
```

## 에러 처리

### 네트워크 에러 처리

인증 서비스에서 네트워크 에러가 발생할 수 있습니다. 필요시 더 상세한 에러 처리를 추가하세요:

```typescript
// AuthService 개선 예제
async sendOTP(email: string) {
  try {
    const res = await fetch(`${this.apiUrl}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        error: data.error || `HTTP ${res.status}: ${res.statusText}`
      };
    }

    const data = await res.json();
    return { success: true };
  } catch (error) {
    // 네트워크 에러, 타임아웃 등
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error"
    };
  }
}
```

### 타임아웃 설정

필요시 fetch 요청에 타임아웃을 추가할 수 있습니다:

```typescript
// 타임아웃 헬퍼 함수
function fetchWithTimeout(url: string, options: RequestInit, timeout = 10000) {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) => setTimeout(() => reject(new Error("Request timeout")), timeout)),
  ]);
}
```

## 보안 고려사항

1. **토큰 저장**: `electron-store`는 기본적으로 암호화되지 않습니다. 민감한 정보를 저장할 때는 암호화를 고려하세요.
2. **HTTPS 사용**: 프로덕션에서는 반드시 HTTPS를 사용하세요.
3. **환경 변수**: API URL은 환경 변수로 관리하고, 코드에 하드코딩하지 마세요.

## 서버 측 상태

✅ **완료된 작업**

- `/api/auth/verify` 엔드포인트가 세션 토큰을 반환하도록 수정됨
- `/api/auth/session` 엔드포인트 추가됨 (선택사항)
- `/api/auth/signout`이 Authorization 헤더를 지원함

## FAQ

### Q: API URL은 어디서 확인하나요?

A: 프로젝트 관리자에게 문의하거나, 배포된 웹사이트의 도메인을 사용하세요. 예: `https://your-domain.com`

### Q: Preload script를 설정하지 않으면 어떻게 되나요?

A: `window.electronAPI`가 정의되지 않아 렌더러 프로세스에서 IPC 호출이 실패합니다. 반드시 preload script를 설정해야 합니다.

### Q: 세션 토큰이 만료되면 어떻게 하나요?

A: `getSession()` 메서드가 자동으로 만료된 세션을 삭제합니다. 만료 시 사용자에게 다시 로그인하도록 안내하세요.

### Q: 네트워크가 연결되지 않을 때는?

A: 현재 구현은 기본적인 에러만 반환합니다. 필요시 재시도 로직이나 오프라인 모드를 추가할 수 있습니다.

## 구현 체크리스트

### 일렉트론 앱 측

- [ ] `electron-store` 패키지 설치
- [ ] Preload script 설정 (`window.electronAPI` 노출)
- [ ] TypeScript 타입 정의 (선택사항)
- [ ] `AuthService` 클래스 구현
- [ ] IPC 핸들러 설정
- [ ] 메인 프로세스에서 초기화
- [ ] 렌더러 프로세스 API 래퍼 생성
- [ ] 로그인/회원가입 UI 구현
- [ ] 인증 상태에 따른 라우팅 처리
- [ ] API URL 환경 변수 설정

### 테스트 항목

- [ ] OTP 코드 전송 테스트
- [ ] OTP 코드 인증 테스트
- [ ] 로그아웃 테스트
- [ ] 세션 만료 처리 테스트
- [ ] 네트워크 오류 처리 테스트

## 요약

이 가이드는 **API 호출 방식**만 다룹니다. 이 방식의 장점:

- ✅ 구현이 단순함
- ✅ 서버가 세션을 관리하므로 클라이언트 코드가 간단함
- ✅ 웹과 일렉트론 앱이 동일한 API를 사용
- ✅ 유지보수가 쉬움

핵심은:

1. API를 호출하여 인증
2. 받은 토큰을 `electron-store`에 저장
3. 이후 요청에 Authorization 헤더로 토큰 포함

이렇게 하면 웹과 일렉트론 앱 간 사용자 데이터가 공유됩니다.
