"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  Users,
  Headset,
  BarChart3,
  User,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthContext";

const SIDEBAR_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/agent/dashboard" },
  { label: "Listings", icon: Building2, href: "/agent/listings" },
  { label: "Leads", icon: Users, href: "/agent/leads" },
  { label: "CRM", icon: Headset, href: "/agent/crm" },
  { label: "Performance", icon: BarChart3, href: "/agent/performance" },
];

interface AgentDashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AgentDashboardSidebar({ isOpen, onClose }: AgentDashboardSidebarProps) {
  const pathname = usePathname();
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
        <div className="p-6 border-b border-border/50 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Agent Panel</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Manage your business
            </p>
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
            const isActive =
              item.href === "/agent" || item.href === "/agent/dashboard"
                ? pathname === "/agent" || pathname === "/agent/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => onClose?.()}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:bg-slate-50 hover:text-text-primary",
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-border/50 flex flex-col gap-1 shrink-0">
          <Link
            href="/agent/profile"
            onClick={() => onClose?.()}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-slate-50 hover:text-text-primary transition-colors"
          >
            <User className="w-5 h-5 shrink-0" />
            <span>Profile</span>
          </Link>
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
