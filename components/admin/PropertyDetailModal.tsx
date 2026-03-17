"use client";

import { X, MapPin, Ruler, Bed, Bath, User, Calendar, ShieldCheck, ExternalLink } from "lucide-react";
import { useEffect } from "react";
import type { AdminProperty } from "@/lib/supabase/admin";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PropertyDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: AdminProperty | null;
}

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
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getStatusBadge = (status: AdminProperty["status"]) => {
    switch (status) {
        case "approved":
            return "bg-green-100 text-green-700";
        case "rejected":
            return "bg-red-100 text-red-700";
        case "pending":
            return "bg-amber-100 text-amber-700";
        default:
            return "bg-slate-100 text-slate-700";
    }
};

export function PropertyDetailModal({ isOpen, onClose, property }: PropertyDetailModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen || !property) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold text-slate-900 line-clamp-1">{property.title}</h2>
                        <div className="flex items-center gap-3">
                            <span className={cn(
                                "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                getStatusBadge(property.status)
                            )}>
                                {property.status}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">ID: {property.id.slice(0, 8)}...</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Summary Section */}
                        <div className="space-y-6">
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Quick Summary</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[11px] text-slate-400 font-bold uppercase">Price</span>
                                        <span className="text-lg font-bold text-primary">{formatPrice(property.price)}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[11px] text-slate-400 font-bold uppercase">Listing Type</span>
                                        <span className="text-sm font-semibold text-slate-700 capitalize">{property.listing_type}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[11px] text-slate-400 font-bold uppercase">Property Type</span>
                                        <span className="text-sm font-semibold text-slate-700 capitalize">{property.property_type}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[11px] text-slate-400 font-bold uppercase">Area</span>
                                        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                                            <Ruler className="w-4 h-4 text-slate-400" />
                                            {property.area_sqft} sq.ft
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                            <Bed className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium">{property.bedrooms ?? "N/A"} Beds</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                            <Bath className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium">{property.bathrooms ?? "N/A"} Baths</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Verification & RERA</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-500">RERA Registered</span>
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold",
                                            property.rera_number ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                                        )}>
                                            {property.rera_number ? <ShieldCheck className="w-3.5 h-3.5" /> : null}
                                            {property.rera_number ? "Yes" : "No"}
                                        </div>
                                    </div>
                                    {property.rera_number && (
                                        <div className="flex flex-col gap-1 px-3 py-2 bg-slate-50 rounded-xl">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">RERA Number</span>
                                            <span className="text-sm font-mono font-medium text-slate-700">{property.rera_number}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-500">Verified Listing</span>
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold",
                                            property.is_verified ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"
                                        )}>
                                            {property.is_verified ? "Verified" : "Unverified"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location & Owner Section */}
                        <div className="space-y-6">
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Location Details</h3>
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <MapPin className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-semibold text-slate-800">{property.address}</span>
                                        <span className="text-xs text-slate-500">{property.locality}, {property.city}, {property.state}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Owner / Poster</h3>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                                        <User className="w-6 h-6 text-slate-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900">{property.owner_name ?? "Private Owner"}</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">{property.owner_role ?? "user"}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span className="text-xs text-slate-400">Owner ID: {property.owner_id.slice(0, 6)}...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 shadow-sm flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[11px] text-blue-400 font-bold uppercase leading-none">Submission Date</span>
                                    <div className="flex items-center gap-2 text-sm font-bold text-blue-900">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(property.created_at)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description Area */}
                    <div className="mt-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Property Description</h3>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {property.description ?? "No description provided for this property."}
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-5 border-t border-slate-100 bg-white shrink-0 flex items-center justify-between gap-4">
                    <Link
                        href={`/property/${property.id}`}
                        target="_blank"
                        className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-hover transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        View Public Page
                    </Link>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-2xl bg-slate-100 text-slate-900 text-sm font-bold hover:bg-slate-200 transition-all active:scale-95"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
