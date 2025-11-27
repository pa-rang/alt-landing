"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { LeaderboardEntry, OrganizationLeaderboardEntry } from "@/lib/validation/game-score";
import Image from "next/image";
import { Button } from "@/components/ui/button";

type LeaderboardType = "personal" | "organization" | "all";

interface RecentPlay {
  nickname: string;
  organization: string;
  score: number;
  created_at: string;
}

type GameLeaderboardProps = {
  type: LeaderboardType;
  dictionary: Dictionary["game"]["leaderboard"];
  gameDictionary: Dictionary["game"];
  userEmail?: string;
  userOrganization?: string;
  refreshTrigger?: number;
  onTabChange?: (tab: "personal" | "organization") => void;
};

type AllLeaderboardData = {
  organization: OrganizationLeaderboardEntry[];
  personal: LeaderboardEntry[];
  recent: RecentPlay[];
};

type LeaderboardState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "success";
      data: (LeaderboardEntry | OrganizationLeaderboardEntry)[];
      type: "personal" | "organization";
    }
  | {
      status: "success_all";
      data: AllLeaderboardData;
      type: "all";
    };

function formatTimeAgo(dateString: string, timeAgoDict: Dictionary["game"]["leaderboard"]["timeAgo"]): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return timeAgoDict.secondsAgo.replace("{{seconds}}", String(diffInSeconds));
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return timeAgoDict.minutesAgo.replace("{{minutes}}", String(diffInMinutes));
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return timeAgoDict.hoursAgo.replace("{{hours}}", String(diffInHours));
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return timeAgoDict.daysAgo.replace("{{days}}", String(diffInDays));
  }
  const diffInWeeks = Math.floor(diffInDays / 7);
  return timeAgoDict.weeksAgo.replace("{{weeks}}", String(diffInWeeks));
}

export function GameLeaderboard({
  type,
  dictionary,
  gameDictionary,
  userEmail,
  userOrganization,
  refreshTrigger,
  onTabChange,
}: GameLeaderboardProps) {
  const [state, setState] = useState<LeaderboardState>({ status: "loading" });

  useEffect(() => {
    let mounted = true;

    async function fetchLeaderboard() {
      setState({ status: "loading" });
      try {
        if (type === "all") {
          const [orgRes, personalRes, recentRes] = await Promise.all([
            fetch(`/api/game/leaderboard?type=organization&limit=5`),
            fetch(`/api/game/leaderboard?type=personal&limit=5`),
            fetch(`/api/game/recent?limit=5`),
          ]);

          if (!mounted) return;

          const orgData = await orgRes.json();
          const personalData = await personalRes.json();
          const recentData = await recentRes.json();

          if (orgData.ok && personalData.ok && recentData.ok) {
            setState({
              status: "success_all",
              data: {
                organization: orgData.leaderboard,
                personal: personalData.leaderboard,
                recent: recentData.plays,
              },
              type: "all",
            });
          } else {
            setState({ status: "error", message: dictionary.error });
          }
        } else {
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
  }, [type, dictionary.error, refreshTrigger, gameDictionary]);

  if (state.status === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-zinc-400">{dictionary.loading}</div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-400">{state.message}</div>
      </div>
    );
  }

  if (state.status === "success_all" && state.type === "all") {
    return (
      <div className="flex flex-col gap-8 p-3">
        {/* Organization Top 5 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
              {dictionary.organization} {dictionary.top5}
            </h3>
            {onTabChange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTabChange("organization")}
                className="text-xs text-zinc-400 hover:text-zinc-400 hover:bg-zinc-900 h-auto py-1 px-2"
              >
                {dictionary.viewAll}
              </Button>
            )}
          </div>
          <div className="bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-700">
            <table className="w-full text-sm">
              <tbody>
                {state.data.organization.map((entry) => {
                  const isCurrentUser =
                    userOrganization && "organization" in entry && entry.organization === userOrganization;
                  const rank = Number(entry.rank);
                  return (
                    <tr
                      key={entry.organization}
                      className={cn(
                        "border-b border-zinc-700 last:border-0 text-zinc-200",
                        isCurrentUser && "bg-blue-900/20 font-semibold"
                      )}
                    >
                      <td className="px-3 py-2.5 w-12">
                        {rank === 1 ? (
                          <Image src="/icons/🥇 gold_medal.svg" alt="1등" width={20} height={20} className="shrink-0" />
                        ) : rank === 2 ? (
                          <Image
                            src="/icons/🥈 silver_medal.svg"
                            alt="2등"
                            width={20}
                            height={20}
                            className="shrink-0"
                          />
                        ) : rank === 3 ? (
                          <Image
                            src="/icons/🥉 bronze_medal.svg"
                            alt="3등"
                            width={20}
                            height={20}
                            className="shrink-0"
                          />
                        ) : (
                          <span className="text-zinc-500 pl-1">{rank}</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5">
                        {entry.organization}
                        {isCurrentUser && <span className="ml-2 text-xs text-blue-400">({dictionary.you})</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-zinc-300">
                        {entry.total_score.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
                {state.data.organization.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-zinc-500 text-xs">
                      {dictionary.empty}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Personal Top 5 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
              {dictionary.personal} {dictionary.top5}
            </h3>
            {onTabChange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTabChange("personal")}
                className="text-xs text-zinc-400 hover:text-zinc-400 hover:bg-zinc-900 h-auto py-1 px-2"
              >
                {dictionary.viewAll}
              </Button>
            )}
          </div>
          <div className="bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-700">
            <table className="w-full text-sm">
              <tbody>
                {state.data.personal.map((entry) => {
                  const isCurrentUser = userEmail && "email" in entry && entry.email === userEmail;
                  const rank = Number(entry.rank);
                  return (
                    <tr
                      key={entry.email}
                      className={cn(
                        "border-b border-zinc-700 last:border-0 text-zinc-200",
                        isCurrentUser && "bg-blue-900/20 font-semibold"
                      )}
                    >
                      <td className="px-3 py-2.5 w-12">
                        {rank === 1 ? (
                          <Image
                            src="/icons/🥇 gold_medal.svg"
                            alt={dictionary.rankLabels.first}
                            width={20}
                            height={20}
                            className="shrink-0"
                          />
                        ) : rank === 2 ? (
                          <Image
                            src="/icons/🥈 silver_medal.svg"
                            alt={dictionary.rankLabels.second}
                            width={20}
                            height={20}
                            className="shrink-0"
                          />
                        ) : rank === 3 ? (
                          <Image
                            src="/icons/🥉 bronze_medal.svg"
                            alt={dictionary.rankLabels.third}
                            width={20}
                            height={20}
                            className="shrink-0"
                          />
                        ) : (
                          <span className="text-zinc-500 pl-1">{rank}</span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <span>{entry.nickname}</span>
                          {entry.organization && <span className="text-xs text-zinc-500">{entry.organization}</span>}
                          {isCurrentUser && <span className="text-xs text-blue-400">({dictionary.you})</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-zinc-300">{entry.score.toLocaleString()}</td>
                    </tr>
                  );
                })}
                {state.data.personal.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-zinc-500 text-xs">
                      {dictionary.empty}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Plays */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider px-2">
            {dictionary.recentPlays}
          </h3>
          <div className="bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-700">
            <div className="flex flex-col">
              {state.data.recent.map((play, index) => (
                <div
                  key={`${play.nickname}-${play.created_at}-${index}`}
                  className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-700 last:border-0 text-sm"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Image
                      src="/icons/🎮️ game_light.svg"
                      alt="game"
                      width={14}
                      height={14}
                      className="shrink-0 opacity-50"
                    />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-medium text-zinc-300 truncate">{play.nickname}</span>
                      <span className="text-zinc-600 text-xs">·</span>
                      <span className="text-zinc-500 text-xs truncate">{play.organization}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2 flex-nowrap">
                    <span className="font-mono text-emerald-500 font-medium">{play.score}</span>
                    <span className="text-xs text-zinc-600 shrink-0 whitespace-nowrap text-right">
                      {formatTimeAgo(play.created_at, dictionary.timeAgo)}
                    </span>
                  </div>
                </div>
              ))}
              {state.data.recent.length === 0 && (
                <div className="px-4 py-4 text-center text-zinc-500 text-xs">{dictionary.empty}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Existing table render for single types
  if (state.status === "success" && state.data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-zinc-400">{dictionary.empty}</div>
      </div>
    );
  }

  if (state.status === "success" && (state.type === "personal" || state.type === "organization")) {
    return (
      <div className="h-full overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-zinc-800 border-b border-zinc-700 z-10">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-zinc-200">{dictionary.rank}</th>
              {type === "personal" ? (
                <>
                  <th className="px-4 py-2 text-left font-semibold text-zinc-200">{dictionary.nickname}</th>
                  <th className="px-4 py-2 text-right font-semibold text-zinc-200">{dictionary.score}</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-2 text-left font-semibold text-zinc-200">{dictionary.organization}</th>
                  <th className="px-4 py-2 text-right font-semibold text-zinc-200">{dictionary.totalScore}</th>
                  <th className="px-4 py-2 text-right font-semibold text-zinc-200">{dictionary.members}</th>
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
                    "border-b border-zinc-700 last:border-0 hover:bg-zinc-800 transition-colors text-zinc-200",
                    isCurrentUser && "bg-blue-900/30 hover:bg-blue-900/40 font-semibold"
                  )}
                >
                  <td className="px-4 py-2">
                    {rank === 1 ? (
                      <Image
                        src="/icons/🥇 gold_medal.svg"
                        alt={dictionary.rankLabels.first}
                        width={24}
                        height={24}
                        className="shrink-0"
                      />
                    ) : rank === 2 ? (
                      <Image
                        src="/icons/🥈 silver_medal.svg"
                        alt={dictionary.rankLabels.second}
                        width={24}
                        height={24}
                        className="shrink-0"
                      />
                    ) : rank === 3 ? (
                      <Image
                        src="/icons/🥉 bronze_medal.svg"
                        alt={dictionary.rankLabels.third}
                        width={24}
                        height={24}
                        className="shrink-0"
                      />
                    ) : (
                      <span>{rank}</span>
                    )}
                  </td>
                  {type === "personal" && "nickname" in entry ? (
                    <>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span>{entry.nickname}</span>
                          {entry.organization && <span className="text-xs text-zinc-400">{entry.organization}</span>}
                          {isCurrentUser && <span className="text-xs text-blue-400">({dictionary.you})</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right font-mono">{entry.score}</td>
                    </>
                  ) : "organization" in entry && "total_score" in entry ? (
                    <>
                      <td className="px-4 py-2">
                        {entry.organization}
                        {isCurrentUser && <span className="ml-2 text-xs text-blue-400">({dictionary.you})</span>}
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

  return null;
}
