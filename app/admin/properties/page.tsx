"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, RefreshCcw, Loader2 } from "lucide-react";
import Link from "next/link";
import { AdminPropertyTable } from "@/components/admin/AdminPropertyTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import {
    fetchAdminProperties,
    approveProperty,
    rejectProperty,
    deleteAdminProperty,
    type AdminProperty,
} from "@/lib/supabase/admin";
import { PropertyDetailModal } from "@/components/admin/PropertyDetailModal";

type TabType = "all" | "pending" | "approved" | "rejected";

const PAGE_SIZE = 20;

export default function PropertyModerationPage() {
    const [activeTab, setActiveTab] = useState<TabType>("all");
    const [properties, setProperties] = useState<AdminProperty[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedProperty, setSelectedProperty] = useState<AdminProperty | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const tabs = [
        { id: "all", label: "All Properties" },
        { id: "pending", label: "Pending Approval" },
        { id: "approved", label: "Approved" },
        { id: "rejected", label: "Rejected" },
    ] as const;

    const fetchData = useCallback(async (pageNum: number) => {
        setLoading(true);
        setError(null);
        const offset = pageNum * PAGE_SIZE;
        const { data, totalCount: tc, error: err } = await fetchAdminProperties({
            limit: PAGE_SIZE,
            offset,
        });
        if (err) {
            setError(err);
        } else {
            setProperties(data ?? []);
            setTotalCount(tc);
        }
        setLoading(false);
    }, []);

    const handleRefresh = useCallback(async () => {
        await fetchData(page);
    }, [fetchData, page]);

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            const offset = page * PAGE_SIZE;
            const { data, totalCount: tc, error: err } = await fetchAdminProperties({
                limit: PAGE_SIZE,
                offset,
            });
            if (!isMounted) return;
            if (err) setError(err);
            else {
                setProperties(data ?? []);
                setTotalCount(tc);
            }
            setLoading(false);
        };
        init();
        return () => { isMounted = false; };
    }, [page]);

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        const { error: err } = await approveProperty(id);
        setActionLoading(null);
        if (err) {
            setError(err);
            return;
        }
        await fetchData(page);
    };

    const handleReject = async (id: string) => {
        setActionLoading(id);
        const { error: err } = await rejectProperty(id);
        setActionLoading(null);
        if (err) {
            setError(err);
            return;
        }
        await fetchData(page);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to permanently delete this property? This action cannot be undone.")) return;
        
        setActionLoading(id);
        const { error: err } = await deleteAdminProperty(id);
        setActionLoading(null);
        
        if (err) {
            setError(err);
            return;
        }
        await fetchData(page);
    };

    const handleViewDetails = (property: AdminProperty) => {
        setSelectedProperty(property);
        setIsDetailModalOpen(true);
    };

    const filteredProperties = properties.filter((property) => {
        if (activeTab === "all") return true;
        if (activeTab === "pending" && property.status === "pending") return true;
        if (activeTab === "approved" && property.status === "approved") return true;
        if (activeTab === "rejected" && property.status === "rejected") return true;
        return false;
    });

    return (
        <div className="p-4 md:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-text-primary">Property Moderation</h1>
                    <p className="text-text-muted text-sm max-w-2xl">
                        Review and manage property listings submitted by agents and individual sellers.
                    </p>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto">
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                    >
                        <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
                        Refresh
                    </button>
                    <Link
                        href="/post-property"
                        className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                    >
                        Post Property
                    </Link>
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Tabs Navigation */}
            <div className="border-b border-border">
                <nav className="flex space-x-6 overflow-x-auto no-scrollbar" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={cn(
                                "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors",
                                activeTab === tab.id
                                    ? "border-primary text-primary"
                                    : "border-transparent text-text-muted hover:text-text-primary hover:border-slate-300"
                            )}
                            aria-current={activeTab === tab.id ? "page" : undefined}
                        >
                            {tab.label}
                            {tab.id === "pending" && (
                                <span className={cn(
                                    "ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
                                    activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-slate-100 text-text-secondary"
                                )}>
                                    {properties.filter(p => p.status === "pending").length}
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
                        <p className="text-sm text-text-muted">Loading properties…</p>
                    </div>
                </div>
            ) : (
                <>
                    <AdminPropertyTable
                        properties={filteredProperties}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onDelete={handleDelete}
                        onViewDetails={handleViewDetails}
                        actionLoading={actionLoading}
                    />
                    <AdminPagination
                        page={page}
                        pageSize={PAGE_SIZE}
                        totalCount={totalCount}
                        onPageChange={handlePageChange}
                        loading={loading}
                    />
                </>
            )}

            <PropertyDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                property={selectedProperty}
            />
        </div>
    );
}
