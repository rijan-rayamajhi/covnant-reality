"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
    DashboardSidebar,
    SavedSection,
    SearchesSection,
    ProfileSection,
    DashboardSkeleton,
} from "@/components/dashboard";
import { Menu } from "lucide-react";
import {
    fetchSavedProperties,
    fetchSavedSearches,
    fetchProfile,
} from "@/lib/supabase/dashboard";
import type { DashboardTabId } from "@/components/dashboard/types";
import type {
    SavedPropertyRow,
    SavedSearch,
    UserProfile,
} from "@/components/dashboard/types";

const VALID_TABS: DashboardTabId[] = ["saved", "searches", /* "visits", "alerts", "bookings", */ "profile"];

function getTabFromParam(param: string | null): DashboardTabId {
    return VALID_TABS.includes(param as DashboardTabId) ? (param as DashboardTabId) : "saved";
}
function DashboardContent() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const urlTab = getTabFromParam(tabParam);

    const [activeTab, setActiveTab] = useState<DashboardTabId>(urlTab);
    const [lastTabParam, setLastTabParam] = useState(tabParam);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // ─── Data state ─────────────────────────────────────────────────────────
    const [savedProperties, setSavedProperties] = useState<SavedPropertyRow[]>([]);
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    // Removed unused variables
    const [profile, setProfile] = useState<UserProfile | null>(null);

    // ─── Loading state per tab ──────────────────────────────────────────────
    const [loading, setLoading] = useState<Record<DashboardTabId, boolean>>({
        saved: true,
        searches: true,
        visits: true,
        alerts: true,
        bookings: true,
        profile: true,
    });

    // Track which tabs have been fetched to avoid re-fetching
    const fetched = useRef<Set<DashboardTabId>>(new Set());

    // Sync URL tab param to state
    if (tabParam !== lastTabParam) {
        setLastTabParam(tabParam);
        const newTab = getTabFromParam(tabParam);
        if (newTab !== activeTab) {
            setActiveTab(newTab);
        }
    }

    // ─── Fetch data for the active tab ──────────────────────────────────────
    const fetchTabData = useCallback(async (tab: DashboardTabId) => {
        if (fetched.current.has(tab)) return;
        fetched.current.add(tab);

        setLoading((prev) => ({ ...prev, [tab]: true }));

        try {
            switch (tab) {
                case "saved": {
                    const data = await fetchSavedProperties();
                    setSavedProperties(data);
                    break;
                }
                case "searches": {
                    const data = await fetchSavedSearches();
                    setSavedSearches(data);
                    break;
                }
                case "profile": {
                    const data = await fetchProfile();
                    setProfile(data);
                    break;
                }
            }
        } catch (err) {
            console.error(`[Dashboard] Error fetching ${tab}:`, err);
        } finally {
            setLoading((prev) => ({ ...prev, [tab]: false }));
        }
    }, []);

    // Fetch data when activeTab changes
    useEffect(() => {
        fetchTabData(activeTab);
    }, [activeTab, fetchTabData]);

    // Removed upcoming bookings

    return (
        <div className="flex flex-1 min-h-screen bg-bg relative">
            {/* Sidebar */}
            <DashboardSidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main content area */}
            <div className="flex-1 min-w-0 flex flex-col">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-border sticky top-0 z-30">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-text-secondary hover:text-text-primary transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-text-primary">Dashboard</span>
                    <div className="w-10"></div> {/* Spacer for symmetry */}
                </header>

                {/* Tab Content */}
                <div className="flex-1 px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 lg:py-10">
                    {activeTab === "saved" && (
                        <SavedSection properties={savedProperties} loading={loading.saved} />
                    )}
                    {activeTab === "searches" && (
                        <SearchesSection searches={savedSearches} loading={loading.searches} />
                    )}
                    {activeTab === "profile" && (
                        <ProfileSection profile={profile} loading={loading.profile} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default function BuyerDashboardPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center flex-1"><DashboardSkeleton /></div>}>
            <DashboardContent />
        </Suspense>
    );
}
