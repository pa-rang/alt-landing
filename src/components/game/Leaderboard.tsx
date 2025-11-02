"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { LeaderboardEntry, OrganizationLeaderboardEntry } from "@/lib/validation/game-score";

type LeaderboardType = "personal" | "organization";

type GameLeaderboardProps = {
  type: LeaderboardType;
  dictionary: Dictionary["game"]["leaderboard"];
  userEmail?: string;
  userOrganization?: string;
  refreshTrigger?: number;
};

type LeaderboardState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "success";
      data: (LeaderboardEntry | OrganizationLeaderboardEntry)[];
      type: LeaderboardType;
    };

export function GameLeaderboard({
  type,
  dictionary,
  userEmail,
  userOrganization,
  refreshTrigger,
}: GameLeaderboardProps) {
  const [state, setState] = useState<LeaderboardState>({ status: "loading" });

  useEffect(() => {
    let mounted = true;

    async function fetchLeaderboard() {
      setState({ status: "loading" });
      try {
        const response = await fetch(`/api/game/leaderboard?type=${type}&limit=100`);

        if (!mounted) return;

        if (!response.ok) {
          setState({ status: "error", message: dictionary.error });
          return;
        }

        const data = await response.json();

        if (data.ok) {
          setState({ status: "success", data: data.leaderboard, type: data.type });
        } else {
          setState({ status: "error", message: dictionary.error });
        }
      } catch (error) {
        if (!mounted) return;
        console.error("Failed to fetch leaderboard:", error);
        setState({ status: "error", message: dictionary.error });
      }
    }

    fetchLeaderboard();

    return () => {
      mounted = false;
    };
  }, [type, dictionary.error, refreshTrigger]);

  if (state.status === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">{dictionary.loading}</div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-500">{state.message}</div>
      </div>
    );
  }

  if (state.data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">{dictionary.empty}</div>
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-[400px]">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-2 text-left font-semibold">{dictionary.rank}</th>
            {type === "personal" ? (
              <>
                <th className="px-4 py-2 text-left font-semibold">{dictionary.nickname}</th>
                <th className="px-4 py-2 text-right font-semibold">{dictionary.score}</th>
              </>
            ) : (
              <>
                <th className="px-4 py-2 text-left font-semibold">{dictionary.organization}</th>
                <th className="px-4 py-2 text-right font-semibold">{dictionary.totalScore}</th>
                <th className="px-4 py-2 text-right font-semibold">{dictionary.members}</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {state.data.map((entry, index) => {
            const isCurrentUser =
              type === "personal"
                ? userEmail && "email" in entry && entry.email === userEmail
                : userOrganization && "organization" in entry && entry.organization === userOrganization;
            const rank = Number(entry.rank);

            return (
              <tr
                key={
                  type === "personal" && "email" in entry
                    ? entry.email
                    : "organization" in entry
                    ? entry.organization
                    : Number.isFinite(rank)
                    ? `rank-${rank}`
                    : `rank-${index}`
                }
                className={cn(
                  "border-b hover:bg-gray-50 transition-colors",
                  isCurrentUser && "bg-blue-50 hover:bg-blue-100 font-semibold"
                )}
              >
                <td className="px-4 py-2">
                  {rank === 1 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-white text-xs font-bold">
                      {rank}
                    </span>
                  ) : rank === 2 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-white text-xs font-bold">
                      {rank}
                    </span>
                  ) : rank === 3 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 text-white text-xs font-bold">
                      {rank}
                    </span>
                  ) : (
                    <span>{rank}</span>
                  )}
                </td>
                {type === "personal" && "nickname" in entry ? (
                  <>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span>{entry.nickname}</span>
                        {entry.organization && <span className="text-xs text-gray-500">{entry.organization}</span>}
                        {isCurrentUser && <span className="text-xs text-blue-600">({dictionary.you})</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right font-mono">{entry.score}</td>
                  </>
                ) : "organization" in entry && "total_score" in entry ? (
                  <>
                    <td className="px-4 py-2">
                      {entry.organization}
                      {isCurrentUser && <span className="ml-2 text-xs text-blue-600">({dictionary.you})</span>}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">{entry.total_score}</td>
                    <td className="px-4 py-2 text-right">{entry.member_count}</td>
                  </>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
