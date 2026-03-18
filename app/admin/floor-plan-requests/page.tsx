"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    FileKey,
    RefreshCcw,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    fetchAllFloorPlanRequests,
    approveFloorPlanRequest,
    rejectFloorPlanRequest,
    type FloorPlanRequest,
} from "@/lib/supabase/floor-plan-requests";

type FilterTab = "all" | "pending" | "approved" | "rejected";

export default function AdminFloorPlanRequestsPage() {
    const [requests, setRequests] = useState<FloorPlanRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAllFloorPlanRequests();
            setRequests(data);
        } catch {
            setError("Failed to fetch floor plan requests.");
        }
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
        } else {
            setError(result.error || "Failed to approve request.");
        }
    };

    const handleReject = async (id: string) => {
        setActionLoading(id);
        const result = await rejectFloorPlanRequest(id);
        setActionLoading(null);
        if (result.success) {
            await fetchData();
        } else {
            setError(result.error || "Failed to reject request.");
        }
    };

    const filtered = requests.filter((r) => {
        if (activeFilter === "all") return true;
        return r.status === activeFilter;
    });

    const pendingCount = requests.filter((r) => r.status === "pending").length;

    const tabs: { id: FilterTab; label: string }[] = [
        { id: "all", label: "All Requests" },
        { id: "pending", label: "Pending" },
        { id: "approved", label: "Approved" },
        { id: "rejected", label: "Rejected" },
    ];

    return (
        <div className="p-4 md:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-text-primary">
                        Floor Plan Requests
                    </h1>
                    <p className="text-text-muted text-sm max-w-2xl">
                        Review and manage floor plan access requests from buyers across all properties.
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50 self-start sm:self-auto"
                >
                    <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
                    Refresh
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-border">
                <nav className="flex space-x-6 overflow-x-auto no-scrollbar" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id)}
                            className={cn(
                                "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors",
                                activeFilter === tab.id
                                    ? "border-primary text-primary"
                                    : "border-transparent text-text-muted hover:text-text-primary hover:border-slate-300"
                            )}
                        >
                            {tab.label}
                            {tab.id === "pending" && (
                                <span
                                    className={cn(
                                        "ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
                                        activeFilter === tab.id
                                            ? "bg-primary/10 text-primary"
                                            : "bg-slate-100 text-text-secondary"
                                    )}
                                >
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            {loading ? (
                <div className="bg-white border border-border rounded-xl shadow-sm p-8">
                    <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-text-muted">Loading floor plan requests…</p>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white border border-border rounded-xl shadow-sm p-12 text-center">
                    <FileKey className="w-12 h-12 mx-auto mb-3 text-text-muted/30" />
                    <p className="font-semibold text-text-secondary">
                        No {activeFilter !== "all" ? activeFilter : ""} requests
                    </p>
                    <p className="text-sm text-text-muted mt-1">
                        {activeFilter === "pending"
                            ? "All floor plan requests have been addressed."
                            : "No floor plan requests found."}
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
                    {/* Table Header */}
                    <div className="hidden md:grid md:grid-cols-[1fr_1fr_140px_140px_120px] gap-4 px-5 py-3 bg-slate-50 border-b border-border text-xs font-semibold text-text-muted uppercase tracking-wider">
                        <span>Property</span>
                        <span>Requested By</span>
                        <span>Date</span>
                        <span>Status</span>
                        <span className="text-right">Actions</span>
                    </div>

                    {/* Rows */}
                    {filtered.map((req) => (
                        <RequestRow
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

// ─── Request Row ─────────────────────────────────────────────────────────────

function RequestRow({
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
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_140px_140px_120px] gap-2 md:gap-4 px-5 py-4 border-b border-border last:border-b-0 hover:bg-slate-50/50 transition-colors items-center">
            {/* Property */}
            <div className="min-w-0">
                <p className="font-semibold text-sm text-text-primary truncate">{request.property_title}</p>
            </div>

            {/* Requester */}
            <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{request.requester_name}</p>
                {request.requester_email && (
                    <p className="text-xs text-text-muted truncate">{request.requester_email}</p>
                )}
            </div>

            {/* Date */}
            <div className="text-xs text-text-muted">
                {new Date(request.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                })}
            </div>

            {/* Status Badge */}
            <div>
                <span
                    className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold",
                        config.bg,
                        config.color
                    )}
                >
                    <StatusIcon className="w-3.5 h-3.5" />
                    {config.label}
                </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 justify-end">
                {request.status === "pending" ? (
                    <>
                        <button
                            onClick={() => onApprove(request.id)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Approve
                        </button>
                        <button
                            onClick={() => onReject(request.id)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                        </button>
                    </>
                ) : (
                    <span className="text-xs text-text-muted">—</span>
                )}
            </div>
        </div>
    );
}
