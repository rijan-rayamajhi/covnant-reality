"use client";

import { AgentDashboardSidebar } from "@/components/agent/AgentDashboardSidebar";
import { Container } from "@/components/layout/Container";
import { RoleGuard } from "@/components/RoleGuard";

import { Menu } from "lucide-react";
import { useState } from "react";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <RoleGuard allowedRoles={["agent"]}>
            <div className="flex min-h-screen bg-bg relative">
                <AgentDashboardSidebar 
                    isOpen={isSidebarOpen} 
                    onClose={() => setIsSidebarOpen(false)} 
                />
                
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
                        <span className="font-bold text-text-primary text-sm sm:text-base">Agent Panel</span>
                        <div className="w-10"></div>
                    </header>

                    <Container className="py-6 sm:py-8 lg:py-10 flex-1">
                        {children}
                    </Container>

                    {/* Agent Footer */}
                    <footer className="border-t border-border bg-white mt-auto">
                        <Container className="py-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-xs text-text-secondary text-center sm:text-left">
                                <span>© {new Date().getFullYear()} Covnant Reality India PVT LTD.</span>
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
                                    <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
                                    <a href="/support" className="hover:text-primary transition-colors">Support</a>
                                </div>
                            </div>
                        </Container>
                    </footer>
                </div>
            </div>
        </RoleGuard>
    );
}
