import crypto from "crypto";

/**
 * 서버 측에서 점수를 복호화하는 함수
 * Node.js crypto 모듈을 사용하여 RSA-OAEP 복호화를 수행합니다.
 */
let privateKey: crypto.KeyObject | null = null;

function getPrivateKey(): crypto.KeyObject {
  if (!privateKey) {
    // 환경변수에서 개인키를 가져오거나, 기본 키 사용 (개발용)
    const keyString = process.env.ENCRYPTION_PRIVATE_KEY || generateDefaultKeyPair().privateKey;
    
    try {
      // PEM 형식의 개인키를 파싱
      privateKey = crypto.createPrivateKey(keyString);
    } catch {
      // 환경변수가 없으면 기본 키 쌍 생성 및 사용
      const keyPair = generateDefaultKeyPair();
      privateKey = crypto.createPrivateKey(keyPair.privateKey);
      console.warn("Using default encryption key pair. Set ENCRYPTION_PRIVATE_KEY in production!");
    }
  }
  return privateKey;
}

function generateDefaultKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });
  
  return { publicKey, privateKey };
}

/**
 * 공개키를 반환합니다 (클라이언트에 제공용)
 */
export function getPublicKey(): string {
  const privateKeyObj = getPrivateKey();
  const publicKeyObj = crypto.createPublicKey(privateKeyObj);
  return publicKeyObj.export({
    type: "spki",
    format: "pem",
  }) as string;
}

/**
 * 공개키를 Base64로 인코딩하여 반환합니다 (클라이언트에 제공용)
 */
export function getPublicKeyBase64(): string {
  const pem = getPublicKey();
  // PEM 헤더/푸터 제거 및 Base64 인코딩
  const base64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
    .replace(/-----END PUBLIC KEY-----/g, "")
    .replace(/\s/g, "");
  return base64;
}

/**
 * 암호화된 점수를 복호화합니다
 */
export function decryptScore(encryptedScore: string): number {
  try {
    const privateKeyObj = getPrivateKey();
    
    // Base64 디코딩
    const ciphertext = Buffer.from(encryptedScore, "base64");
    
    // RSA-OAEP로 복호화
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKeyObj,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      ciphertext
    );
    
    // 숫자로 변환하여 반환
    const scoreString = decrypted.toString("utf-8");
    const score = parseInt(scoreString, 10);
    
    if (isNaN(score)) {
      throw new Error("Invalid decrypted score");
    }
    
    return score;
  } catch (error) {
    console.error("Failed to decrypt score:", error);
    throw new Error("Invalid encrypted score format");
  }
}
