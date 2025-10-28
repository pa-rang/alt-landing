import {
  TOMATO_COLS,
  TOMATO_ROWS,
  generateValues,
  computeSelectedIndicesFromRect,
  formatTime,
} from "../src/lib/apple-game";
// tsx 실행 시에도 확장자 명시가 안전합니다.

function assert(condition: any, message: string) {
  if (!condition) {
    throw new Error("Test failed: " + message);
  }
}

async function main() {
  // Test 1: Board generation
  for (let i = 0; i < 50; i++) {
    const values = generateValues();
    assert(values.length === TOMATO_ROWS * TOMATO_COLS, "Board length must be 170");
    const sum = values.reduce((a, b) => a + b, 0);
    assert(sum % 10 === 0, "Sum must be a multiple of 10");
    assert(
      values.every((v) => v >= 1 && v <= 9),
      "Values must be between 1 and 9"
    );
  }

  // Test 2: Rectangle selection mapping
  const W = 1700;
  const H = 1000;
  // Select first 2 rows and first 3 columns (indices 0..2 and 17..19)
  const inds = computeSelectedIndicesFromRect(
    W,
    H,
    0,
    0,
    (W / TOMATO_COLS) * 3 - 1,
    (H / TOMATO_ROWS) * 2 - 1,
    TOMATO_ROWS,
    TOMATO_COLS
  );
  const expected = new Set([0, 1, 2, 17, 18, 19]);
  assert(inds.length === expected.size, "Selection size must be 6");
  inds.forEach((i) => assert(expected.has(i), `Unexpected index ${i}`));

  // Test 3: formatTime
  assert(formatTime(120) === "2:00", "formatTime(120) should be 2:00");
  assert(formatTime(65) === "1:05", "formatTime(65) should be 1:05");
  assert(formatTime(9) === "0:09", "formatTime(9) should be 0:09");

  console.log("All tomato-game tests passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
