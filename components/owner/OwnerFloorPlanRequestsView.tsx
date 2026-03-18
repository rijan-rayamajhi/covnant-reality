"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    FileKey,
    RefreshCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    fetchOwnerFloorPlanRequests,
    approveFloorPlanRequest,
    rejectFloorPlanRequest,
    type FloorPlanRequest,
} from "@/lib/supabase/floor-plan-requests";

type FilterTab = "all" | "pending" | "approved" | "rejected";

export function OwnerFloorPlanRequestsView() {
    const [requests, setRequests] = useState<FloorPlanRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

    const fetchData = useCallback(async () => {
        setLoading(true);
        const data = await fetchOwnerFloorPlanRequests();
        setRequests(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchData();
    }, [fetchData]);

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        const result = await approveFloorPlanRequest(id);
        setActionLoading(null);
        if (result.success) {
            await fetchData();
        }
    };

    const handleReject = async (id: string) => {
        setActionLoading(id);
        const result = await rejectFloorPlanRequest(id);
        setActionLoading(null);
        if (result.success) {
            await fetchData();
        }
    };

    const filtered = requests.filter((r) => {
        if (activeFilter === "all") return true;
        return r.status === activeFilter;
    });

    const pendingCount = requests.filter((r) => r.status === "pending").length;

    const tabs: { id: FilterTab; label: string }[] = [
        { id: "all", label: "All" },
        { id: "pending", label: `Pending (${pendingCount})` },
        { id: "approved", label: "Approved" },
        { id: "rejected", label: "Rejected" },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-text-muted">Loading floor plan requests…</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                        <FileKey className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Floor Plan Requests</h2>
                        <p className="text-sm text-text-muted">
                            Manage access requests for your property floor plans
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchData}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                    <RefreshCcw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="border-b border-border">
                <nav className="flex space-x-4" aria-label="Filter">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id)}
                            className={cn(
                                "whitespace-nowrap py-2.5 px-1 border-b-2 text-sm font-medium transition-colors",
                                activeFilter === tab.id
                                    ? "border-primary text-primary"
                                    : "border-transparent text-text-muted hover:text-text-primary hover:border-slate-300"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Empty state */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 text-text-muted">
                    <FileKey className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-text-secondary">No {activeFilter !== "all" ? activeFilter : ""} requests</p>
                    <p className="text-sm mt-1">
                        {activeFilter === "pending"
                            ? "No pending floor plan access requests at the moment."
                            : "No floor plan requests found."}
                    </p>
                </div>
            ) : (
                /* Request Cards */
                <div className="grid gap-3">
                    {filtered.map((req) => (
                        <RequestCard
                            key={req.id}
                            request={req}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            isLoading={actionLoading === req.id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Request Card ────────────────────────────────────────────────────────────

function RequestCard({
    request,
    onApprove,
    onReject,
    isLoading,
}: {
    request: FloorPlanRequest;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    isLoading: boolean;
}) {
    const statusConfig = {
        pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", label: "Pending" },
        approved: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", label: "Approved" },
        rejected: { icon: XCircle, color: "text-red-500", bg: "bg-red-50 border-red-200", label: "Rejected" },
    };

    const config = statusConfig[request.status as keyof typeof statusConfig];
    const StatusIcon = config.icon;

    return (
        <div className="bg-white border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-sm transition-shadow">
            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary text-sm truncate">
                    {request.property_title}
                </p>
                <p className="text-sm text-text-secondary mt-0.5">
                    Requested by <span className="font-medium text-text-primary">{request.requester_name}</span>
                    {request.requester_email && (
                        <span className="text-text-muted"> ({request.requester_email})</span>
                    )}
                </p>
                <p className="text-xs text-text-muted mt-1">
                    {new Date(request.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </p>
            </div>

            {/* Status + Actions */}
            <div className="flex items-center gap-3 shrink-0">
                {/* Status Badge */}
                <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold", config.bg, config.color)}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {config.label}
                </div>

                {/* Action Buttons (only for pending) */}
                {request.status === "pending" && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onApprove(request.id)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            Approve
                        </button>
                        <button
                            onClick={() => onReject(request.id)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
