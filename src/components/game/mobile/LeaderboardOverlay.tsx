"use client";

import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { LeaderboardBox } from "../LeaderboardBox";

type LeaderboardOverlayProps = {
  dictionary: Dictionary["game"];
  submittedData: {
    nickname: string;
    organization: string;
    rank: number;
  } | null;
  refreshTrigger: number;
  onClose: () => void;
};

export function LeaderboardOverlay({
  dictionary,
  submittedData,
  refreshTrigger,
  onClose,
}: LeaderboardOverlayProps) {
  return createPortal(
    <div className="fixed inset-0 bg-zinc-900 z-9999 flex flex-col">
      <div className="relative px-4 py-3 text-center border-b border-zinc-700 shrink-0">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-200"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-zinc-200">{dictionary.leaderboardTitle}</h2>
      </div>
      <div className="flex-1 overflow-hidden min-h-0">
        <LeaderboardBox
          dictionary={dictionary}
          userEmail={submittedData ? `${submittedData.nickname} (${submittedData.organization})` : undefined}
          userOrganization={submittedData?.organization}
          refreshTrigger={refreshTrigger}
          fullScreen
        />
      </div>
    </div>,
    document.body
  );
}

