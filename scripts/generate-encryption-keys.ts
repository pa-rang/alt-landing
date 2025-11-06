/**
 * RSA 키 쌍 생성 스크립트
 * 
 * 사용법:
 * 1. 이 파일을 실행하여 RSA 키 쌍을 생성합니다
 * 2. 생성된 개인키를 환경변수 ENCRYPTION_PRIVATE_KEY에 저장합니다
 * 3. 공개키는 자동으로 서버에서 생성되므로 별도 저장이 필요 없습니다
 * 
 * 실행: npm run generate-keys
 */

import * as nodeCrypto from "crypto";

function generateKeyPair() {
  const { publicKey, privateKey } = nodeCrypto.generateKeyPairSync("rsa", {
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

  console.log("\n=== RSA 개인키 (환경변수 ENCRYPTION_PRIVATE_KEY에 저장하세요) ===\n");
  console.log(privateKey);
  console.log("\n=== 위의 개인키를 .env.local 파일에 다음과 같이 저장하세요 ===\n");
  console.log("ENCRYPTION_PRIVATE_KEY=`");
  console.log(privateKey);
  console.log("`\n");
  console.log("또는 한 줄로:");
  console.log(`ENCRYPTION_PRIVATE_KEY="${privateKey.replace(/\n/g, "\\n")}"\n`);
  
  console.log("\n=== 공개키 (참고용, 공개키는 자동으로 서버에서 생성됩니다) ===\n");
  console.log(publicKey);
  console.log("\n");
}

generateKeyPair();

