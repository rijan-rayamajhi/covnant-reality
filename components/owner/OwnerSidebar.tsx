"use client";

import {
    LayoutDashboard,
    Home,
    PlusCircle,
    Users,
    CalendarDays,
    UserCircle,
    LogOut,
    FileKey,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthContext";
import type { OwnerDashboardTabId } from "./types";

interface SidebarItem {
    id: OwnerDashboardTabId;
    label: string;
    icon: typeof LayoutDashboard;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "properties", label: "My Properties", icon: Home },
    { id: "add-property", label: "Add Property", icon: PlusCircle },
    { id: "leads", label: "Leads", icon: Users },
    { id: "visits", label: "Site Visits", icon: CalendarDays },
    { id: "floor-plan-requests", label: "Floor Plan Requests", icon: FileKey },
];

interface OwnerSidebarProps {
    activeTab: OwnerDashboardTabId;
    onTabChange: (tab: OwnerDashboardTabId) => void;
}

export function OwnerSidebar({ activeTab, onTabChange }: OwnerSidebarProps) {
    const { signOut } = useAuth();
    return (
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen bg-white border-r border-border overflow-y-auto">
            {/* Brand area */}
            <div className="p-6 border-b border-border/50">
                <h2 className="text-lg font-bold text-text-primary">Owner Dashboard</h2>
                <p className="text-xs text-text-secondary mt-0.5">Manage your listings</p>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 p-4 flex flex-col gap-1">
                {SIDEBAR_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.id === activeTab;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            aria-label={`Go to ${item.label}`}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-text-secondary hover:bg-slate-50 hover:text-text-primary"
                            )}
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-border/50 flex flex-col gap-1">
                <button
                    onClick={() => onTabChange("profile")}
                    aria-label="Go to Profile"
                    aria-current={activeTab === "profile" ? "page" : undefined}
                    className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                        activeTab === "profile"
                            ? "bg-primary/10 text-primary"
                            : "text-text-secondary hover:bg-slate-50 hover:text-text-primary"
                    )}
                >
                    <UserCircle className="w-5 h-5 shrink-0" />
                    <span>Profile</span>
                </button>
                <button
                    onClick={signOut}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left"
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
