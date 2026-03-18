"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Maximize2, Lock, Unlock, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";
import type { Property } from "@/types";
import { useAuth } from "@/components/AuthContext";
import {
    getFloorPlanRequestStatus,
    requestFloorPlanAccess,
    type FloorPlanRequestStatus,
} from "@/lib/supabase/floor-plan-requests";

interface FloorPlanSectionProps {
    property: Property;
}

export function FloorPlanSection({ property }: FloorPlanSectionProps) {
    const { bedrooms, area, type, id: propertyId } = property;
    const { user, userRole } = useAuth();

    const [requestStatus, setRequestStatus] = useState<FloorPlanRequestStatus | null | "loading">("loading");
    const [submitting, setSubmitting] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [fullscreenOpen, setFullscreenOpen] = useState(false);

    const hasFloorPlan =
        property.floorPlans &&
        property.floorPlans.length > 0 &&
        property.floorPlans[0] &&
        property.floorPlans[0].trim() !== "";

    const isOwnerOrAdmin =
        userRole === "admin" ||
        (user && property.ownerId && user.id === property.ownerId);

    // ── Fetch request status ────────────────────────────────────────────
    const fetchStatus = useCallback(async () => {
        if (!user || isOwnerOrAdmin || type === "plot") {
            setRequestStatus(null);
            return;
        }
        const status = await getFloorPlanRequestStatus(propertyId);
        setRequestStatus(status);
    }, [user, isOwnerOrAdmin, type, propertyId]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchStatus();
    }, [fetchStatus]);

    // Hide section if it's a plot
    if (type === "plot") return null;

    const label = bedrooms > 0 ? `${bedrooms} BHK` : type.charAt(0).toUpperCase() + type.slice(1);

    // ── Request handler ─────────────────────────────────────────────────
    const handleRequestAccess = async () => {
        if (!user) {
            window.location.href = `/login?next=/property/${propertyId}`;
            return;
        }
        setSubmitting(true);
        const result = await requestFloorPlanAccess(propertyId);
        if (result.success) {
            setRequestStatus("pending");
        } else {
            alert(result.error || "Failed to submit request.");
        }
        setSubmitting(false);
    };

    // ── Determine if floor plan should be visible ───────────────────────
    const isUnlocked = isOwnerOrAdmin || requestStatus === "approved";

    return (
        <section className="py-6 border-b border-border bg-bg-card">
            <h3 className="text-lg font-bold text-text-primary mb-4">Floor Plan</h3>

            <div className="border border-border rounded-2xl p-4 bg-bg-card">
                <h4 className="font-semibold text-text-primary mb-1">
                    {label}{area > 0 ? ` • ${area.toLocaleString()} sq.ft.` : ""}
                </h4>
                <p className="text-sm text-text-muted mb-4">Super Built-up Area</p>

                <div className="relative w-full aspect-[4/3] bg-bg-card border border-border rounded-xl overflow-hidden mb-4 flex items-center justify-center group">
                    {hasFloorPlan && isUnlocked && !imageError ? (
                        <>
                            <Image
                                src={property.floorPlans[0]}
                                alt={`${label} Floor Plan`}
                                fill
                                className="object-contain p-2"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                onError={() => setImageError(true)}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                            <button
                                onClick={() => setFullscreenOpen(true)}
                                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                aria-label="View fullscreen"
                            >
                                <div className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
                                    <Maximize2 className="w-4 h-4 text-text-primary" />
                                </div>
                            </button>
                        </>
                    ) : !isUnlocked ? (
                        /* ── LOCKED STATE ── */
                        <LockedOverlay
                            requestStatus={requestStatus}
                            submitting={submitting}
                            onRequest={handleRequestAccess}
                        />
                    ) : (
                        /* ── NO FLOOR PLAN UPLOADED ── */
                        <NoFloorPlanPlaceholder />
                    )}
                </div>

                {/* Status badge below the image */}
                {isOwnerOrAdmin ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 border border-slate-100 p-3 rounded-xl mt-2">
                        <Lock className="w-4 h-4 text-slate-400" />
                        <span>Floor plan is locked for public viewing. You have access as {userRole === "admin" ? "an Admin" : "the Owner"}.</span>
                    </div>
                ) : requestStatus && requestStatus !== "loading" ? (
                    <StatusBadge status={requestStatus as FloorPlanRequestStatus} />
                ) : null}
            </div>

            {/* Fullscreen Modal */}
            {fullscreenOpen && hasFloorPlan && (
                <FullscreenModal
                    src={property.floorPlans[0]}
                    alt={`${label} Floor Plan`}
                    onClose={() => setFullscreenOpen(false)}
                />
            )}
        </section>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function LockedOverlay({
    requestStatus,
    submitting,
    onRequest,
}: {
    requestStatus: FloorPlanRequestStatus | null | "loading";
    submitting: boolean;
    onRequest: () => void;
}) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200/80">
            {/* Blurred grid background */}
            <div className="absolute inset-0 opacity-30">
                <div className="w-full h-full grid grid-cols-6 grid-rows-4">
                    {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="border-[0.5px] border-slate-300" />
                    ))}
                </div>
            </div>

            {/* Lock icon + CTA */}
            <div className="relative z-10 flex flex-col items-center gap-3 px-4 text-center">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center mb-1">
                    <Lock className="w-6 h-6 text-slate-500" />
                </div>

                <p className="text-sm font-semibold text-slate-700">Floor Plan is Locked</p>
                <p className="text-xs text-slate-500 max-w-[220px]">
                    Request access to view the detailed floor plan of this property
                </p>

                {requestStatus === "loading" ? (
                    <div className="mt-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                ) : requestStatus === "pending" ? (
                    <div className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        Request Pending
                    </div>
                ) : requestStatus === "rejected" ? (
                    <div className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                        <XCircle className="w-4 h-4" />
                        Request Denied
                    </div>
                ) : (
                    <button
                        onClick={onRequest}
                        disabled={submitting}
                        className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-primary/90 active:scale-[0.97] transition-all disabled:opacity-60"
                    >
                        {submitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Unlock className="w-4 h-4" />
                        )}
                        {submitting ? "Requesting…" : "Request Floor Plan"}
                    </button>
                )}
            </div>
        </div>
    );
}

function NoFloorPlanPlaceholder() {
    return (
        <>
            <div className="absolute inset-0 bg-bg" />
            <div className="absolute inset-0 border-[0.5px] border-primary/10 grid grid-cols-6 grid-rows-4">
                {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="border-[0.5px] border-primary/10" />
                ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-bg-card/90 rounded-full shadow-sm flex items-center justify-center text-text-primary">
                    <Maximize2 className="w-5 h-5" />
                </div>
            </div>
            <div className="absolute bottom-3 left-0 right-0 text-center">
                <span className="text-xs text-text-muted bg-bg-card/80 px-3 py-1 rounded-full">
                    Floor plan not uploaded
                </span>
            </div>
        </>
    );
}

function StatusBadge({ status }: { status: FloorPlanRequestStatus }) {
    if (status === "approved") {
        return (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">Floor plan access granted</span>
            </div>
        );
    }
    if (status === "pending") {
        return (
            <div className="flex items-center gap-2 text-sm text-amber-600">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Awaiting owner approval</span>
            </div>
        );
    }
    if (status === "rejected") {
        return (
            <div className="flex items-center gap-2 text-sm text-red-500">
                <XCircle className="w-4 h-4" />
                <span className="font-medium">Access request was denied</span>
            </div>
        );
    }
    return null;
}

function FullscreenModal({
    src,
    alt,
    onClose,
}: {
    src: string;
    alt: string;
    onClose: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="relative max-w-4xl max-h-[90vh] w-full"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute -top-10 right-0 text-white text-sm font-medium hover:text-white/80 transition-colors"
                >
                    ✕ Close
                </button>
                <div className="relative w-full aspect-[4/3] bg-white rounded-2xl overflow-hidden">
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        className="object-contain p-4"
                        sizes="(max-width: 768px) 100vw, 80vw"
                    />
                </div>
            </div>
        </div>
    );
}
