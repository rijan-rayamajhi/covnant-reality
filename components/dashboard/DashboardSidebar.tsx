"use client";

import {
    Heart,
    Search,
    UserCircle,
    LogOut,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthContext";
import type { DashboardTabId } from "./types";

interface SidebarItem {
    id: DashboardTabId;
    label: string;
    icon: typeof Heart;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
    { id: "saved", label: "Saved", icon: Heart },
    { id: "searches", label: "Searches", icon: Search },
    /* { id: "visits", label: "Visits", icon: CalendarDays },
    { id: "alerts", label: "Alerts", icon: BellRing },
    { id: "bookings", label: "Bookings", icon: CalendarCheck }, */
];

interface DashboardSidebarProps {
    activeTab: DashboardTabId;
    onTabChange: (tab: DashboardTabId) => void;
    isOpen?: boolean;
    onClose?: () => void;
}

export function DashboardSidebar({ 
    activeTab, 
    onTabChange,
    isOpen,
    onClose
}: DashboardSidebarProps) {
    const { signOut } = useAuth();

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
                    onClick={onClose}
                />
            )}

            <aside className={cn(
                "fixed top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-border transition-transform duration-300 ease-in-out flex flex-col",
                "lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:z-0",
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                {/* Brand area */}
                <div className="p-6 border-b border-border/50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Buyer / Tenant</h2>
                        <p className="text-xs text-text-secondary mt-0.5">Manage your account</p>
                    </div>
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="lg:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
                            aria-label="Close menu"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Nav Items */}
                <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
                    {SIDEBAR_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.id === activeTab;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onTabChange(item.id);
                                    onClose?.();
                                }}
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
                        onClick={() => {
                            onTabChange("profile");
                            onClose?.();
                        }}
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
                        onClick={() => {
                            signOut();
                            onClose?.();
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left"
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
