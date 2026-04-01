"use client";

import { useState } from "react";
import { OwnerSidebar } from "@/components/owner/OwnerSidebar";
import type { OwnerDashboardTabId } from "@/components/owner/types";

import { OwnerDashboardOverview } from "@/components/owner/OwnerDashboardOverview";
import { OwnerPropertiesView } from "@/components/owner/OwnerPropertiesView";
import { OwnerAddPropertyView } from "@/components/owner/OwnerAddPropertyView";
import { OwnerLeadsView } from "@/components/owner/OwnerLeadsView";
import { OwnerVisitsView } from "@/components/owner/OwnerVisitsView";
import { OwnerFloorPlanRequestsView } from "@/components/owner/OwnerFloorPlanRequestsView";
import { OwnerProfileView } from "@/components/owner/OwnerProfileView";


import { Menu } from "lucide-react";

export default function OwnerPage() {
    const [activeTab, setActiveTab] = useState<OwnerDashboardTabId>("dashboard");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-bg relative overflow-x-hidden">
            <OwnerSidebar 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            <main className="flex-1 w-full lg:max-w-[calc(100vw-256px)] bg-slate-50 relative pb-20 lg:pb-0 min-h-screen flex flex-col">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-border sticky top-0 z-30">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-text-secondary hover:text-text-primary transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-text-primary">Owner Panel</span>
                    <div className="w-10"></div>
                </header>

                <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 w-full max-w-full overflow-x-hidden flex-1">
                    {/* Header based on tab */}
                    <header className="mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-2xl md:text-3xl font-bold text-text-primary capitalize flex items-center gap-3">
                            {activeTab.replace("-", " ")}
                        </h1>
                        <p className="text-sm md:text-base text-text-secondary mt-1 max-w-2xl">
                            {activeTab === "dashboard" && "Welcome back! Here is an overview of your properties."}
                            {activeTab === "properties" && "Manage your property listings."}
                            {activeTab === "add-property" && "List a new property on the market."}
                            {activeTab === "leads" && "View leads generated from your listings."}
                            {activeTab === "visits" && "Manage site visits requested by buyers."}
                            {activeTab === "floor-plan-requests" && "Manage floor plan access requests from potential buyers."}
                            {activeTab === "profile" && "Update your personal and company details."}
                        </p>
                    </header>

                    {/* Content Area */}
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 w-full overflow-x-hidden">
                        {activeTab === "dashboard" && <OwnerDashboardOverview onTabChange={setActiveTab} />}
                        {activeTab === "properties" && <OwnerPropertiesView />}
                        {activeTab === "add-property" && <OwnerAddPropertyView onSuccess={() => setActiveTab("properties")} />}
                        {activeTab === "leads" && <OwnerLeadsView />}
                        {activeTab === "visits" && <OwnerVisitsView />}
                        {activeTab === "floor-plan-requests" && <OwnerFloorPlanRequestsView />}
                        {activeTab === "profile" && <OwnerProfileView />}
                    </div>
                </div>
            </main>
        </div>
    );
}
