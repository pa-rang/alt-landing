"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type TabSwitcherProps<T extends string> = {
  tabs: { key: T; label: string }[];
  activeTab: T;
  onTabChange: (key: T) => void;
  className?: string;
};

export function TabSwitcher<T extends string>({ tabs, activeTab, onTabChange, className }: TabSwitcherProps<T>) {
  return (
    <div className={cn("flex p-0.5 bg-zinc-800 rounded-lg relative", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "relative flex-1 px-2 py-1 text-sm font-medium transition-colors z-10",
              isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-zinc-950 rounded-md shadow-sm"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
