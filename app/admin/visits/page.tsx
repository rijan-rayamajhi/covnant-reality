"use client";

import { useEffect, useState, useCallback } from "react";
import {
    CalendarDays,
    AlertCircle,
    RefreshCcw,
    Loader2,
    Search,
    User,
    MapPin,
    Phone,
    CheckCircle2,
    XCircle,
    Eye,
} from "lucide-react";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { fetchAdminVisits, updateAdminVisitStatus, type AdminVisit } from "@/lib/supabase/admin";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
    { value: "", label: "All Statuses" },
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "visited", label: "Visited" },
    { value: "closed", label: "Closed" },
];

function getStatusBadge(status: string) {
    switch (status) {
        case "new":
            return "bg-amber-100 text-amber-700";
        case "contacted":
            return "bg-blue-100 text-blue-700";
        case "visited":
            return "bg-green-100 text-green-700";
        case "closed":
            return "bg-slate-100 text-slate-600";
        default:
            return "bg-slate-100 text-slate-700";
    }
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function AdminVisitsPage() {
    const [visits, setVisits] = useState<AdminVisit[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchData = useCallback(
        async (pageNum: number, status: string) => {
            setLoading(true);
            setError(null);
            const offset = pageNum * PAGE_SIZE;
            const { data, totalCount: tc, error: err } = await fetchAdminVisits({
                limit: PAGE_SIZE,
                offset,
                status,
            });
            if (err) setError(err);
            else {
                setVisits(data ?? []);
                setTotalCount(tc);
            }
            setLoading(false);
        },
        []
    );

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            const offset = page * PAGE_SIZE;
            const { data, totalCount: tc, error: err } = await fetchAdminVisits({
                limit: PAGE_SIZE,
                offset,
                status: statusFilter,
            });
            if (!isMounted) return;
            if (err) setError(err);
            else {
                setVisits(data ?? []);
                setTotalCount(tc);
            }
            setLoading(false);
        };
        init();
        return () => {
            isMounted = false;
        };
    }, [page, statusFilter]);

    const handleRefresh = useCallback(async () => {
        await fetchData(page, statusFilter);
    }, [fetchData, page, statusFilter]);

    const handleStatusChange = async (visitId: string, newStatus: string) => {
        setUpdatingId(visitId);
        const { error: err } = await updateAdminVisitStatus(visitId, newStatus);
        if (err) {
            setError(err);
        } else {
            setVisits((prev) =>
                prev.map((v) => (v.id === visitId ? { ...v, status: newStatus } : v))
            );
        }
        setUpdatingId(null);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleFilterChange = (newStatus: string) => {
        setStatusFilter(newStatus);
        setPage(0);
    };

    const filteredVisits = visits.filter((v) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            v.buyer_name?.toLowerCase().includes(q) ||
            v.property_title?.toLowerCase().includes(q) ||
            v.buyer_phone?.includes(q) ||
            v.name?.toLowerCase().includes(q) ||
            v.phone?.includes(q)
        );
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                        Site Visit Requests
                    </h1>
                    <p className="text-text-muted mt-1 text-sm">
                        Manage site visit bookings from buyers.
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="self-start sm:self-auto inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                >
                    <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {/* Error banner */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-xl border border-border flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5" />
                        Search
                    </label>
                    <input
                        type="text"
                        placeholder="Search by name, phone, or property..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
                    />
                </div>
                <div className="min-w-[180px]">
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" />
                        Status
                    </label>
                    <select
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white hover:bg-slate-50 cursor-pointer appearance-none"
                        value={statusFilter}
                        onChange={(e) => handleFilterChange(e.target.value)}
                    >
                        {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="bg-white border border-border rounded-xl shadow-sm p-8">
                    <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-text-muted">Loading site visit requests…</p>
                    </div>
                </div>
            ) : filteredVisits.length === 0 ? (
                <div className="bg-white border border-border rounded-xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <CalendarDays className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary">No site visit requests found</h3>
                    <p className="text-text-secondary mt-1">
                        {searchQuery || statusFilter
                            ? "Try adjusting your filters."
                            : "No site visit bookings have been submitted yet."}
                    </p>
                </div>
            ) : (
                <>
                    {/* Desktop/Tablet Table View */}
                    <div className="hidden md:block bg-white border border-border rounded-xl shadow-sm overflow-hidden overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-border">
                                    <th className="px-6 py-4 font-semibold text-text-secondary text-sm">
                                        Visitor
                                    </th>
                                    <th className="px-6 py-4 font-semibold text-text-secondary text-sm">
                                        Property
                                    </th>
                                    <th className="px-6 py-4 font-semibold text-text-secondary text-sm">
                                        Requested On
                                    </th>
                                    <th className="px-6 py-4 font-semibold text-text-secondary text-sm">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 font-semibold text-text-secondary text-sm text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredVisits.map((visit) => (
                                    <tr
                                        key={visit.id}
                                        className="hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-text-secondary shrink-0">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-text-primary text-sm line-clamp-1">
                                                        {visit.buyer_name || visit.name || "Unknown"}
                                                    </p>
                                                    <p className="text-xs text-text-muted flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        {visit.buyer_phone || visit.phone || "No phone"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-2 max-w-[200px]">
                                                <MapPin className="w-4 h-4 mt-0.5 text-text-muted shrink-0" />
                                                <span className="text-text-primary font-medium text-sm line-clamp-2">
                                                    {visit.property_title || "Unknown Property"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-text-primary text-sm font-medium">
                                                <CalendarDays className="w-4 h-4 text-text-muted" />
                                                {formatDate(visit.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-md ${getStatusBadge(visit.status)}`}
                                            >
                                                {visit.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end">
                                                <VisitActions
                                                    visit={visit}
                                                    updatingId={updatingId}
                                                    onStatusChange={handleStatusChange}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {filteredVisits.map((visit) => {
                            const displayName = visit.buyer_name || visit.name || "Unknown";
                            const displayPhone = visit.buyer_phone || visit.phone || "No phone";
                            return (
                                <div
                                    key={visit.id}
                                    className="bg-white p-4 rounded-xl border border-border shadow-sm space-y-4"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-text-secondary shrink-0">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-text-primary text-sm line-clamp-1">
                                                    {displayName}
                                                </p>
                                                <p className="text-xs text-text-muted flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {displayPhone}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-md shrink-0 ${getStatusBadge(visit.status)}`}
                                        >
                                            {visit.status}
                                        </span>
                                    </div>

                                    <div className="space-y-2 pb-1">
                                        <div className="flex items-start gap-2 text-text-primary">
                                            <MapPin className="w-4 h-4 mt-0.5 text-text-muted shrink-0" />
                                            <span className="text-sm font-medium">
                                                {visit.property_title || "Unknown Property"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-text-secondary">
                                            <CalendarDays className="w-4 h-4 text-text-muted shrink-0" />
                                            <span className="text-xs">{formatDate(visit.created_at)}</span>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-border flex justify-end">
                                        <VisitActions
                                            visit={visit}
                                            updatingId={updatingId}
                                            onStatusChange={handleStatusChange}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <AdminPagination
                        page={page}
                        pageSize={PAGE_SIZE}
                        totalCount={totalCount}
                        onPageChange={handlePageChange}
                        loading={loading}
                    />
                </>
            )}
        </div>
    );
}

interface VisitActionsProps {
    visit: AdminVisit;
    updatingId: string | null;
    onStatusChange: (visitId: string, newStatus: string) => Promise<void>;
}

function VisitActions({ visit, updatingId, onStatusChange }: VisitActionsProps) {
    if (updatingId === visit.id) {
        return <Loader2 className="w-5 h-5 animate-spin text-primary ml-auto" />;
    }

    return (
        <div className="flex items-center justify-end gap-2">
            {visit.status === "new" && (
                <>
                    <button
                        onClick={() => onStatusChange(visit.id, "contacted")}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5"
                        title="Mark as Contacted"
                    >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Contact</span>
                    </button>
                    <button
                        onClick={() => onStatusChange(visit.id, "closed")}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Close Lead"
                    >
                        <XCircle className="w-4 h-4" />
                    </button>
                </>
            )}
            {visit.status === "contacted" && (
                <>
                    <button
                        onClick={() => onStatusChange(visit.id, "visited")}
                        className="px-3 py-1.5 text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-1.5"
                        title="Mark as Visited"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Visited</span>
                    </button>
                    <button
                        onClick={() => onStatusChange(visit.id, "closed")}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Close Lead"
                    >
                        <XCircle className="w-4 h-4" />
                    </button>
                </>
            )}
            {visit.status === "visited" && (
                <button
                    onClick={() => onStatusChange(visit.id, "closed")}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
                >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Close Lead</span>
                </button>
            )}
        </div>
    );
}

