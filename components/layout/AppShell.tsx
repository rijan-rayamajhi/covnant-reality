"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const pathname = usePathname();
    const isAgentRoute = pathname?.startsWith("/agent");
    const isDashboardRoute = pathname?.startsWith("/dashboard");
    const isBuilderRoute = pathname?.startsWith("/builder");
    const isAdminRoute = pathname?.startsWith("/admin");
    const isOwnerRoute = pathname?.startsWith("/owner");
    const isDedicatedLayout = isAgentRoute || isDashboardRoute || isBuilderRoute || isAdminRoute || isOwnerRoute;

    return (
        <div className="flex flex-col min-h-svh">
            {!isDedicatedLayout && <Header />}

            {/* Scrollable main content */}
            <main className="flex-1">
                {children}
            </main>

            {!isDedicatedLayout && <Footer />}

            {/* {!isDedicatedLayout && <BottomNav />} */}
        </div>
    );
}
