"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { GameLeaderboard } from "./Leaderboard";
import type { Dictionary } from "@/lib/i18n/dictionary";

type LeaderboardBoxProps = {
  dictionary: Dictionary["game"];
  userEmail?: string;
  userOrganization?: string;
  refreshTrigger?: number;
};

type LeaderboardTabType = "personal" | "organization";

export function LeaderboardBox({ dictionary, userEmail, userOrganization, refreshTrigger }: LeaderboardBoxProps) {
  const [activeTab, setActiveTab] = useState<LeaderboardTabType>("organization");

  return (
    <div className="bg-white rounded-lg border shadow-sm flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold text-lg">{dictionary.leaderboardTitle}</h3>
      </div>

      {/* 리더보드 탭 */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("organization")}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-colors",
            activeTab === "organization"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          {dictionary.tabs.organizationLeaderboard}
        </button>
        <button
          onClick={() => setActiveTab("personal")}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-colors",
            activeTab === "personal" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-gray-900"
          )}
        >
          {dictionary.tabs.personalLeaderboard}
        </button>
      </div>

      {/* 리더보드 컨텐츠 */}
      <div className="overflow-auto flex-1">
        {activeTab === "personal" && (
          <GameLeaderboard
            type="personal"
            dictionary={dictionary.leaderboard}
            userEmail={userEmail}
            refreshTrigger={refreshTrigger}
          />
        )}
        {activeTab === "organization" && (
          <GameLeaderboard
            type="organization"
            dictionary={dictionary.leaderboard}
            userOrganization={userOrganization}
            refreshTrigger={refreshTrigger}
          />
        )}
      </div>
    </div>
  );
}
