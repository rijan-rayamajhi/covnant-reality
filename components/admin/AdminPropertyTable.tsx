"use client";

import { useState } from "react";
import { MoreVertical, Check, X, MapPin, Loader2, Trash2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminProperty } from "@/lib/supabase/admin";

interface AdminPropertyTableProps {
    properties: AdminProperty[];
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onDelete?: (id: string) => void;
    onViewDetails?: (property: AdminProperty) => void;
    actionLoading: string | null;
}

const getStatusBadge = (status: AdminProperty["status"]) => {
    switch (status) {
        case "approved":
            return "bg-green-100 text-green-700";
        case "rejected":
            return "bg-red-100 text-red-700";
        case "pending":
            return "bg-amber-100 text-amber-700";
        case "sold":
            return "bg-blue-100 text-blue-700";
        case "rented":
            return "bg-purple-100 text-purple-700";
        default:
            return "bg-slate-100 text-slate-700";
    }
};

const getStatusLabel = (status: AdminProperty["status"]) => {
    switch (status) {
        case "pending": return "Pending";
        case "approved": return "Approved";
        case "rejected": return "Rejected";
        case "sold": return "Sold";
        case "rented": return "Rented";
        default: return status;
    }
};

const getRoleBadge = (role: string | null) => {
    switch (role) {
        case "builder":
            return "bg-blue-50 text-blue-700";
        case "agent":
            return "bg-purple-50 text-purple-700";
        case "owner":
            return "bg-teal-50 text-teal-700";
        default:
            return "bg-slate-100 text-slate-700";
    }
};

const formatPrice = (price: number) => {
    if (price >= 10000000) {
        return `₹${(price / 10000000).toFixed(2)} Cr`;
    }
    if (price >= 100000) {
        return `₹${(price / 100000).toFixed(1)} L`;
    }
    return `₹${price.toLocaleString("en-IN")}`;
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

export function AdminPropertyTable({
    properties,
    onApprove,
    onReject,
    onDelete,
    onViewDetails,
    actionLoading,
}: AdminPropertyTableProps) {
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    const toggleDropdown = (id: string) => {
        setOpenDropdownId(openDropdownId === id ? null : id);
    };

    const handleAction = (id: string, action: string) => {
        setOpenDropdownId(null);
        if (action === "approve") {
            onApprove(id);
        } else if (action === "reject") {
            onReject(id);
        } else if (action === "delete" && onDelete) {
            onDelete(id);
        }
    };

    const isLoading = (id: string) => actionLoading === id;

    return (
        <div className="bg-white border border-border rounded-xl shadow-sm text-sm">
            {/* Mobile / Tablet View: Card Layout */}
            <div className="lg:hidden divide-y divide-border">
                {properties.length > 0 ? (
                    properties.map((property) => (
                        <div key={property.id} className="p-4 flex flex-col gap-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => onViewDetails?.(property)}
                                    className="font-semibold text-text-primary text-sm line-clamp-1 text-left hover:text-primary transition-colors"
                                >
                                    {property.title}
                                </button>
                                <div className="flex items-center text-text-muted text-xs">
                                    <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
                                    <span className="truncate">{property.address}, {property.city}</span>
                                </div>
                                <span className="text-primary font-semibold text-xs mt-1">
                                    {formatPrice(property.price)} · {property.property_type}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                                <div>
                                    <span className="text-text-muted block mb-0.5">Posted By</span>
                                    <span className="font-semibold text-text-primary block">{property.owner_name ?? "Unknown"}</span>
                                </div>
                                <div>
                                    <span className="text-text-muted block mb-0.5">Role</span>
                                    <span className={cn(
                                        "px-2 py-0.5 text-[10px] font-semibold tracking-wider rounded-md inline-block capitalize",
                                        getRoleBadge(property.owner_role)
                                    )}>
                                        {property.owner_role ?? "N/A"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-text-muted block mb-0.5">City</span>
                                    <span className="font-medium text-text-primary block">{property.city}</span>
                                </div>
                                <div>
                                    <span className="text-text-muted block mb-0.5">Submitted</span>
                                    <span className="text-text-primary block">{formatDate(property.created_at)}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-border mt-1">
                                <span className={cn(
                                    "inline-flex items-center justify-center px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-full shrink-0",
                                    getStatusBadge(property.status)
                                )}>
                                    {getStatusLabel(property.status)}
                                </span>

                                <div className="flex gap-2">
                                    {isLoading(property.id) ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    ) : (
                                        <>
                                            {(property.status === "pending" || property.status === "rejected") && (
                                                <button
                                                    onClick={() => handleAction(property.id, "approve")}
                                                    className="p-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
                                                    aria-label="Approve"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                            )}
                                            {(property.status === "pending" || property.status === "approved") && (
                                                <button
                                                    onClick={() => handleAction(property.id, "reject")}
                                                    className="p-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
                                                    aria-label="Reject"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-12 text-center text-text-muted">
                        No properties found in this category.
                    </div>
                )}
            </div>

            {/* Desktop View: Table Layout */}
            <div className="hidden lg:block overflow-x-auto min-h-[400px] w-full pb-32">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-border">
                            <th className="px-6 py-4 font-semibold text-text-secondary w-1/3 min-w-[320px]">Property Listing</th>
                            <th className="px-6 py-4 font-semibold text-text-secondary whitespace-nowrap">Posted By</th>
                            <th className="px-6 py-4 font-semibold text-text-secondary whitespace-nowrap">Type</th>
                            <th className="px-6 py-4 font-semibold text-text-secondary whitespace-nowrap">City</th>
                            <th className="px-6 py-4 font-semibold text-text-secondary whitespace-nowrap">Submitted</th>
                            <th className="px-6 py-4 font-semibold text-text-secondary whitespace-nowrap">Status</th>
                            <th className="px-6 py-4 font-semibold text-text-secondary text-right whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {properties.length > 0 ? (
                            properties.map((property) => (
                                <tr key={property.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col min-w-0 py-0.5">
                                            <button
                                                onClick={() => onViewDetails?.(property)}
                                                className="font-semibold text-text-primary text-sm line-clamp-1 text-left hover:text-primary transition-colors"
                                                title={property.title}
                                            >
                                                {property.title}
                                            </button>
                                            <div className="flex items-center text-text-muted text-xs mt-1">
                                                <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
                                                <span className="truncate">{property.address}, {property.city}</span>
                                            </div>
                                            <div className="text-primary font-semibold text-xs mt-1.5 flex items-center gap-2">
                                                {formatPrice(property.price)}
                                                <span className="w-1 h-1 rounded-full bg-border" />
                                                <span className="text-text-secondary font-medium capitalize">{property.property_type}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-semibold text-text-primary block">{property.owner_name ?? "Unknown"}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2.5 py-1 text-[11px] font-semibold tracking-wider rounded-md capitalize",
                                            getRoleBadge(property.owner_role)
                                        )}>
                                            {property.owner_role ?? "N/A"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-text-primary">
                                        {property.city}
                                    </td>
                                    <td className="px-6 py-4 text-text-muted">
                                        {formatDate(property.created_at)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "inline-flex items-center justify-center px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-full shrink-0",
                                            getStatusBadge(property.status)
                                        )}>
                                            {getStatusLabel(property.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {isLoading(property.id) ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-primary ml-auto" />
                                        ) : (
                                            <div className="relative inline-block text-left">
                                                <button
                                                    onClick={() => toggleDropdown(property.id)}
                                                    className="p-1.5 rounded-md hover:bg-slate-100 text-text-secondary transition-colors"
                                                    aria-label="Actions"
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>

                                                {openDropdownId === property.id && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setOpenDropdownId(null)}
                                                        />
                                                        <div className="absolute right-0 z-20 mt-1 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden text-left">
                                                            <div className="py-1">
                                                                <button
                                                                    onClick={() => { setOpenDropdownId(null); onViewDetails?.(property); }}
                                                                    className="flex items-center w-full px-4 py-2.5 text-sm text-text-primary hover:bg-slate-50 font-medium"
                                                                >
                                                                    <ExternalLink className="mr-2 h-4 w-4 text-primary" />
                                                                    View Details
                                                                </button>
                                                                {(property.status === "pending" || property.status === "rejected") && (
                                                                    <button
                                                                        onClick={() => handleAction(property.id, "approve")}
                                                                        className="flex items-center w-full px-4 py-2.5 text-sm text-text-primary hover:bg-slate-50 font-medium"
                                                                    >
                                                                        <Check className="mr-2 h-4 w-4 text-green-600" />
                                                                        Approve
                                                                    </button>
                                                                )}
                                                                {(property.status === "pending" || property.status === "approved") && (
                                                                    <button
                                                                        onClick={() => handleAction(property.id, "reject")}
                                                                        className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium"
                                                                    >
                                                                        <X className="mr-2 h-4 w-4" />
                                                                        Reject
                                                                    </button>
                                                                )}
                                                                {onDelete && (
                                                                    <button
                                                                        onClick={() => handleAction(property.id, "delete")}
                                                                        className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-border mt-1 font-medium"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete Permanently
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                                    No properties found in this category.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
