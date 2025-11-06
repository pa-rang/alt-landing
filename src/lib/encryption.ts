/**
 * 클라이언트 측에서 점수를 암호화하는 함수
 * 서버에서 제공한 공개키를 사용하여 RSA-OAEP 암호화를 수행합니다.
 */
export async function encryptScore(score: number): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("encryptScore can only be used in the browser");
  }
  
  // 서버에서 공개키 받아오기
  const response = await fetch("/api/game/encryption-key");
  if (!response.ok) {
    throw new Error("Failed to get encryption key");
  }
  const { publicKey } = await response.json();
  
  // Base64로 인코딩된 공개키를 ArrayBuffer로 변환
  const keyData = Uint8Array.from(atob(publicKey), (c) => c.charCodeAt(0));
  
  // 공개키를 가져옵니다
  const cryptoKey = await window.crypto.subtle.importKey(
    "spki",
    keyData,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"]
  );
  
  // 점수를 문자열로 변환하여 암호화
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(score.toString());
  
  // RSA-OAEP로 암호화 (최대 214바이트까지 암호화 가능)
  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    cryptoKey,
    plaintext
  );
  
  // Base64로 인코딩하여 반환
  return btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
}
