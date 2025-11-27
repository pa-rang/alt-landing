// 데스크탑 전용 ScoreDisplay 컴포넌트
type ScoreDisplayProps = {
  gameState: "idle" | "running" | "ended";
  currentScore: number;
  bestScore: number;
  scoreLabel: string;
};

export function ScoreDisplay({ gameState, currentScore, bestScore, scoreLabel }: ScoreDisplayProps) {
  if (gameState === "idle") {
    // 게임 시작 전: BEST 점수만 표시
    return (
      <span className="px-3 py-1 rounded-md bg-blue-100 text-blue-800">
        BEST <b>{bestScore > 0 ? bestScore : 0}</b>
      </span>
    );
  }

  // 게임 진행 중: 현재 점수만 표시
  return (
    <span className="px-3 py-1 rounded-md bg-gray-100">
      {scoreLabel} <b>{currentScore}</b>
    </span>
  );
}
