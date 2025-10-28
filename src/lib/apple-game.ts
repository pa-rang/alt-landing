export const TOMATO_ROWS = 10;
export const TOMATO_COLS = 17;
export const TOMATO_TOTAL_CELLS = TOMATO_ROWS * TOMATO_COLS;
export const GAME_SECONDS = 120;

function getRandomInt1to9(): number {
  return Math.floor(Math.random() * 9) + 1;
}

export function generateValues(rows: number = TOMATO_ROWS, cols: number = TOMATO_COLS): number[] {
  const total = rows * cols;
  const values: number[] = Array.from({ length: total }, () => getRandomInt1to9());
  const sum = values.reduce((a, b) => a + b, 0);
  const remainder = sum % 10;

  if (remainder !== 0) {
    const deltaAdd = (10 - remainder) % 10; // 1..9
    const deltaSub = remainder; // 1..9

    let idx = values.findIndex((v) => v + deltaAdd <= 9);
    if (idx !== -1) {
      values[idx] += deltaAdd;
    } else {
      idx = values.findIndex((v) => v - deltaSub >= 1);
      if (idx !== -1) {
        values[idx] -= deltaSub;
      } else {
        // Fallback: small adjustments until divisible by 10
        let guard = 0;
        while (values.reduce((a, b) => a + b, 0) % 10 !== 0 && guard < 1000) {
          const need = (10 - (values.reduce((a, b) => a + b, 0) % 10)) % 10;
          if (need === 0) break;
          let adjusted = false;
          if (need > 0) {
            for (let i = 0; i < values.length; i++) {
              if (values[i] < 9) {
                values[i] += 1;
                adjusted = true;
                break;
              }
            }
          }
          if (!adjusted) {
            for (let i = 0; i < values.length; i++) {
              if (values[i] > 1) {
                values[i] -= 1;
                break;
              }
            }
          }
          guard++;
        }
      }
    }
  }
  return values;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString();
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function computeSelectedIndicesFromRect(
  boardWidth: number,
  boardHeight: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rows: number = TOMATO_ROWS,
  cols: number = TOMATO_COLS,
  removedMask?: boolean[]
): number[] {
  if (boardWidth <= 0 || boardHeight <= 0) return [];
  const left = Math.min(x1, x2);
  const right = Math.max(x1, x2);
  const top = Math.min(y1, y2);
  const bottom = Math.max(y1, y2);

  const cellWidth = boardWidth / cols;
  const cellHeight = boardHeight / rows;

  const colStart = Math.max(0, Math.min(cols - 1, Math.floor(left / cellWidth)));
  const colEnd = Math.max(0, Math.min(cols - 1, Math.floor(right / cellWidth)));
  const rowStart = Math.max(0, Math.min(rows - 1, Math.floor(top / cellHeight)));
  const rowEnd = Math.max(0, Math.min(rows - 1, Math.floor(bottom / cellHeight)));

  const indices: number[] = [];
  for (let r = Math.min(rowStart, rowEnd); r <= Math.max(rowStart, rowEnd); r++) {
    for (let c = Math.min(colStart, colEnd); c <= Math.max(colStart, colEnd); c++) {
      const idx = r * cols + c;
      if (!removedMask || removedMask[idx] !== true) indices.push(idx);
    }
  }
  return indices;
}
