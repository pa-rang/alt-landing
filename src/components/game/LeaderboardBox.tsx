"use client";

import { useState, useEffect } from "react";
import { RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameLeaderboard } from "./Leaderboard";
import { TabSwitcher } from "@/components/ui/tab-switcher";
import type { Dictionary } from "@/lib/i18n/dictionary";

type LeaderboardBoxProps = {
  dictionary: Dictionary["game"];
  userEmail?: string;
  userOrganization?: string;
  refreshTrigger?: number;
  fullScreen?: boolean;
};

type LeaderboardTabType = "all" | "personal" | "organization";

export function LeaderboardBox({
  dictionary,
  userEmail,
  userOrganization,
  refreshTrigger,
  fullScreen,
}: LeaderboardBoxProps) {
  const [activeTab, setActiveTab] = useState<LeaderboardTabType>("all");
  const [personalRefreshTrigger, setPersonalRefreshTrigger] = useState<number>(0);
  const [organizationRefreshTrigger, setOrganizationRefreshTrigger] = useState<number>(0);
  const [allRefreshTrigger, setAllRefreshTrigger] = useState<number>(0);

  // 외부에서 전달된 refreshTrigger가 변경되면 모든 탭 새로고침
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      setPersonalRefreshTrigger((prev) => prev + 1);
      setOrganizationRefreshTrigger((prev) => prev + 1);
      setAllRefreshTrigger((prev) => prev + 1);
    }
  }, [refreshTrigger]);

  const handleRefresh = () => {
    if (activeTab === "personal") {
      setPersonalRefreshTrigger((prev) => prev + 1);
    } else if (activeTab === "organization") {
      setOrganizationRefreshTrigger((prev) => prev + 1);
    } else {
      setAllRefreshTrigger((prev) => prev + 1);
    }
  };

  return (
    <div className={cn("bg-white/10 flex flex-col h-full", fullScreen ? "" : "rounded-lg shadow-sm")}>
      <div className="flex items-center justify-between px-3 py-3 shrink-0 min-h-[53px] bg-transparent">
        <TabSwitcher<LeaderboardTabType>
          tabs={[
            { key: "all", label: dictionary.tabs.all },
            { key: "organization", label: dictionary.tabs.organizationLeaderboard },
            { key: "personal", label: dictionary.tabs.personalLeaderboard },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <button
          onClick={handleRefresh}
          className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-full transition-colors"
          aria-label="새로고침"
          title="새로고침"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* 리더보드 컨텐츠 - 모든 탭 렌더링하되 보이지 않는 탭은 숨김 */}
      <div className="overflow-auto flex-1 relative">
        <div className={cn("absolute inset-0 overflow-auto", activeTab === "all" ? "block" : "hidden")}>
          <GameLeaderboard
            type="all"
            dictionary={dictionary.leaderboard}
            userEmail={userEmail}
            userOrganization={userOrganization}
            refreshTrigger={allRefreshTrigger}
            onTabChange={setActiveTab}
          />
        </div>
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
