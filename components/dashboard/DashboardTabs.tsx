"use client";

import { cn } from "@/lib/utils";
import type { DashboardTabId } from "./types";

interface TabDef {
    id: DashboardTabId;
    label: string;
}

const TABS: TabDef[] = [
    { id: "saved", label: "Saved" },
    { id: "searches", label: "Searches" },
    /* { id: "visits", label: "Visits" },
    { id: "alerts", label: "Alerts" },
    { id: "bookings", label: "Bookings" }, */
    { id: "profile", label: "Profile" },
];

interface DashboardTabsProps {
    activeTab: DashboardTabId;
    onTabChange: (tab: DashboardTabId) => void;
}

export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
    return (
        <nav
            className="lg:hidden overflow-x-auto scrollbar-hide border-b border-border bg-bg-card"
            aria-label="Dashboard tabs"
        >
            <div className="flex gap-1 md:justify-center min-w-max">
                {TABS.map((tab) => {
                    const isActive = tab.id === activeTab;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            aria-label={`Switch to ${tab.label}`}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                                "relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-200",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-t-lg",
                                isActive
                                    ? "text-primary font-semibold"
                                    : "text-text-secondary hover:text-text-primary"
                            )}
                        >
                            {tab.label}
                            {isActive && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
