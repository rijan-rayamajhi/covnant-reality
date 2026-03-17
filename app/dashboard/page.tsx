"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
    DashboardSidebar,
    DashboardTabs,
    SavedSection,
    SearchesSection,
    VisitsSection,
    AlertsSection,
    BookingsSection,
    ProfileSection,
    DashboardSkeleton,
} from "@/components/dashboard";
import {
    fetchSavedProperties,
    fetchSavedSearches,
    fetchSiteVisits,
    fetchAlerts,
    fetchProfile,
} from "@/lib/supabase/dashboard";
import type { DashboardTabId } from "@/components/dashboard/types";
import type {
    SavedPropertyRow,
    SavedSearch,
    SiteVisitRow,
    AlertRow,
    UserProfile,
} from "@/components/dashboard/types";

const VALID_TABS: DashboardTabId[] = ["saved", "searches", "visits", "alerts", "bookings", "profile"];

function getTabFromParam(param: string | null): DashboardTabId {
    return VALID_TABS.includes(param as DashboardTabId) ? (param as DashboardTabId) : "saved";
}

function DashboardContent() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const urlTab = getTabFromParam(tabParam);

    const [activeTab, setActiveTab] = useState<DashboardTabId>(urlTab);
    const [lastTabParam, setLastTabParam] = useState(tabParam);

    // ─── Data state ─────────────────────────────────────────────────────────
    const [savedProperties, setSavedProperties] = useState<SavedPropertyRow[]>([]);
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    const [siteVisits, setSiteVisits] = useState<SiteVisitRow[]>([]);
    const [alerts, setAlerts] = useState<AlertRow[]>([]);
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
                case "visits": {
                    const data = await fetchSiteVisits();
                    setSiteVisits(data);
                    break;
                }
                case "alerts": {
                    const data = await fetchAlerts();
                    setAlerts(data);
                    break;
                }
                case "bookings": {
                    // Bookings are site visits filtered to upcoming
                    const data = await fetchSiteVisits();
                    setSiteVisits(data);
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

    // ─── Derived data ───────────────────────────────────────────────────────
    // Bookings = site visits that are not completed/cancelled
    const upcomingBookings = siteVisits.filter(
        (v) => v.status === "requested" || v.status === "confirmed"
    );

    return (
        <>
            {/* Desktop Sidebar — rendered outside Container at the flex root */}
            <DashboardSidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {/* Main content area */}
            <div className="flex-1 min-w-0 flex flex-col">
                {/* Mobile / Tablet Tabs */}
                <div className="lg:hidden border-b border-border bg-bg-card">
                    <div className="px-4 sm:px-6">
                        <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 lg:py-10">
                    {activeTab === "saved" && (
                        <SavedSection properties={savedProperties} loading={loading.saved} />
                    )}
                    {activeTab === "searches" && (
                        <SearchesSection searches={savedSearches} loading={loading.searches} />
                    )}
                    {activeTab === "visits" && (
                        <VisitsSection visits={siteVisits} loading={loading.visits} />
                    )}
                    {activeTab === "alerts" && (
                        <AlertsSection alerts={alerts} loading={loading.alerts} />
                    )}
                    {activeTab === "bookings" && (
                        <BookingsSection bookings={upcomingBookings} loading={loading.bookings} />
                    )}
                    {activeTab === "profile" && (
                        <ProfileSection profile={profile} loading={loading.profile} />
                    )}
                </div>
            </div>
        </>
    );
}

export default function BuyerDashboardPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center flex-1"><DashboardSkeleton /></div>}>
            <DashboardContent />
        </Suspense>
    );
}
