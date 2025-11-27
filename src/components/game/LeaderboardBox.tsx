"use client";

import { useState, useEffect } from "react";
import { RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameLeaderboard } from "./Leaderboard";
import type { Dictionary } from "@/lib/i18n/dictionary";

type LeaderboardBoxProps = {
  dictionary: Dictionary["game"];
  userEmail?: string;
  userOrganization?: string;
  refreshTrigger?: number;
  fullScreen?: boolean;
};

type LeaderboardTabType = "personal" | "organization";

export function LeaderboardBox({
  dictionary,
  userEmail,
  userOrganization,
  refreshTrigger,
  fullScreen,
}: LeaderboardBoxProps) {
  const [activeTab, setActiveTab] = useState<LeaderboardTabType>("organization");
  const [personalRefreshTrigger, setPersonalRefreshTrigger] = useState<number>(0);
  const [organizationRefreshTrigger, setOrganizationRefreshTrigger] = useState<number>(0);

  // 외부에서 전달된 refreshTrigger가 변경되면 두 탭 모두 새로고침
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      setPersonalRefreshTrigger((prev) => prev + 1);
      setOrganizationRefreshTrigger((prev) => prev + 1);
    }
  }, [refreshTrigger]);

  const handleRefresh = () => {
    if (activeTab === "personal") {
      setPersonalRefreshTrigger((prev) => prev + 1);
    } else {
      setOrganizationRefreshTrigger((prev) => prev + 1);
    }
  };

  return (
    <div className={cn("bg-white flex flex-col h-full", fullScreen ? "" : "rounded-lg border shadow-sm")}>
      {!fullScreen && (
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold text-lg">{dictionary.leaderboardTitle}</h3>
        </div>
      )}

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
        <button
          onClick={handleRefresh}
          className="px-3 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          aria-label="새로고침"
          title="새로고침"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* 리더보드 컨텐츠 - 두 탭 모두 렌더링하되 보이지 않는 탭은 숨김 */}
      <div className="overflow-auto flex-1 relative">
        <div className={cn("absolute inset-0 overflow-auto", activeTab === "personal" ? "block" : "hidden")}>
          <GameLeaderboard
            type="personal"
            dictionary={dictionary.leaderboard}
            userEmail={userEmail}
            refreshTrigger={personalRefreshTrigger}
          />
        </div>
        <div className={cn("absolute inset-0 overflow-auto", activeTab === "organization" ? "block" : "hidden")}>
          <GameLeaderboard
            type="organization"
            dictionary={dictionary.leaderboard}
            userOrganization={userOrganization}
            refreshTrigger={organizationRefreshTrigger}
          />
        </div>
      </div>
    </div>
  );
}
