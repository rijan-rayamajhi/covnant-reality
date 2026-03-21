"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthContext";
import {
    Menu,
    X,
    LayoutDashboard,
    Users,
    Building2,
    Target,
    CalendarDays,
    CreditCard,
    BarChart,
    Briefcase,
    LogOut,
    MapPin,
    User,
    FileKey
} from "lucide-react";

interface AdminLayoutProps {
    children: React.ReactNode;
}

const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "User Management", href: "/admin/users", icon: Users },
    { label: "Property Moderation", href: "/admin/properties", icon: Building2 },
    { label: "Floor Plan Requests", href: "/admin/floor-plan-requests", icon: FileKey },
    { label: "Location Management", href: "/admin/locations", icon: MapPin },
    { label: "Lead Monitoring", href: "/admin/leads", icon: Target },
    { label: "Site Visits", href: "/admin/visits", icon: CalendarDays },
    { label: "Payments", href: "/admin/payments", icon: CreditCard },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart },
    { label: "Sales CRM", href: "/admin/sales", icon: Briefcase },
    { label: "Profile", href: "/admin/profile", icon: User },
];

export function AdminLayout({ children }: AdminLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();
    const { signOut } = useAuth();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="min-h-screen bg-white text-text-primary flex flex-col lg:flex-row">
            {/* Mobile Top Bar */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-border sticky top-0 bg-white z-40">
                <span className="font-bold text-lg text-primary">Admin Panel</span>
                <button
                    onClick={toggleSidebar}
                    className="p-2 -mr-2 text-text-secondary hover:text-text-primary transition-colors"
                    aria-label="Toggle Sidebar"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Sidebar Overlay (Mobile) */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Component */}
            <aside
                className={cn(
                    "fixed top-0 left-0 bottom-0 z-50 w-[260px] bg-white border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen flex flex-col shadow-sm lg:shadow-none",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="p-6 flex items-center justify-between lg:justify-start border-b border-border h-[72px]">
                    <span className="font-bold text-xl text-primary tracking-tight">Admin Panel</span>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-2 -mr-2 text-text-secondary hover:text-text-primary transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm group",
                                    isActive
                                        ? "bg-primary text-white shadow-sm"
                                        : "text-text-secondary hover:bg-slate-50 hover:text-text-primary"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-white" : "text-text-muted group-hover:text-primary")} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-border mt-auto bg-slate-50/50">
                    <button
                        onClick={() => signOut()}
                        className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                        <LogOut className="w-5 h-5 opacity-80" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 min-h-screen">
                {children}
            </main>
        </div>
    );
}
