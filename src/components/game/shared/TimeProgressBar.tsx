"use client";

import { cn } from "@/lib/utils";

type TimeProgressBarProps = {
  timeLeft: number;
  totalTime: number;
  className?: string;
};

export function TimeProgressBar({ timeLeft, totalTime, className }: TimeProgressBarProps) {
  const percentage = (timeLeft / totalTime) * 100;

  return (
    <div className={cn("flex-1 h-2 bg-gray-200 rounded-full overflow-hidden relative min-w-[80px]", className)}>
      <div
        className={cn(
          "h-full transition-all duration-300 ease-linear",
          timeLeft > 30 ? "bg-emerald-500" : timeLeft > 10 ? "bg-yellow-500" : "bg-red-500"
        )}
        style={{
          width: `${percentage}%`,
        }}
      />
    </div>
  );
}
