"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Maximize2, Lock, Unlock, Loader2, CheckCircle2, Clock, XCircle, FileText, ExternalLink } from "lucide-react";
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

    const [dbStatus, setDbStatus] = useState<FloorPlanRequestStatus | null | "loading">("loading");
    const [submitting, setSubmitting] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [fullscreenOpen, setFullscreenOpen] = useState(false);

    const floorPlanUrl = property.floorPlans?.[0] || "";
    const hasFloorPlan = floorPlanUrl.trim() !== "";
    const isPdf = floorPlanUrl.toLowerCase().split('?')[0].endsWith('.pdf');

    const isOwnerOrAdmin =
        userRole === "admin" ||
        (user && property.ownerId && user.id === property.ownerId);

    const shouldFetchStatus = !!user && !isOwnerOrAdmin && type !== "plot";
    const requestStatus = shouldFetchStatus ? dbStatus : null;

    // ── Fetch request status ────────────────────────────────────────────
    useEffect(() => {
        if (!shouldFetchStatus) return;

        let isMounted = true;
        const fetchStatus = async () => {
            const status = await getFloorPlanRequestStatus(propertyId);
            if (isMounted) setDbStatus(status);
        };
        fetchStatus();
        return () => { isMounted = false; };
    }, [shouldFetchStatus, propertyId]);

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
            setDbStatus("pending");
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

            <div className="bg-bg rounded-xl p-5 border border-border">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                    <div>
                        <h4 className="font-bold text-text-primary text-base">
                            {label}
                        </h4>
                        <p className="text-sm text-text-muted mb-4">
                            {area > 0 ? `${area.toLocaleString()} sq.ft.` : ""} Super Built-up Area
                        </p>

                        {/* Status badge for non-admin/owner */}
                        {!isOwnerOrAdmin && requestStatus && requestStatus !== "loading" && (
                            <div className="mb-4 lg:mb-0">
                                <StatusBadge status={requestStatus as FloorPlanRequestStatus} />
                            </div>
                        )}

                        {/* Admin/Owner info */}
                        {isOwnerOrAdmin && (
                            <div className="flex items-start gap-2 text-xs text-text-muted bg-bg-card border border-border p-3 rounded-xl mb-4 lg:mb-0">
                                <Lock className="w-3.5 h-3.5 text-text-muted mt-0.5" />
                                <span>Floor plan is locked for public viewing. You have access as {userRole === "admin" ? "an Admin" : "the Owner"}.</span>
                            </div>
                        )}
                    </div>

                    <div className="relative w-full aspect-[16/10] bg-bg-card border border-border rounded-xl overflow-hidden flex items-center justify-center group shadow-sm transition-all hover:shadow-md">
                        {hasFloorPlan && isUnlocked ? (
                            <>
                                {isPdf ? (
                                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                                        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500 mb-1">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-bold text-text-primary">PDF Floor Plan</span>
                                        <p className="text-[10px] text-text-muted">Click to view or download</p>
                                    </div>
                                ) : !imageError ? (
                                    <Image
                                        src={floorPlanUrl}
                                        alt={`${label} Floor Plan`}
                                        fill
                                        className="object-contain p-2"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 30vw"
                                        onError={() => setImageError(true)}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                                        <FileText className="w-8 h-8 text-text-muted" />
                                        <span className="text-xs font-medium text-text-muted text-center px-4">Image could not be loaded. Click to try direct access.</span>
                                    </div>
                                )}
                                
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                                <button
                                    onClick={() => setFullscreenOpen(true)}
                                    className="absolute inset-0 w-full h-full cursor-pointer z-10"
                                    aria-label="View fullscreen"
                                />
                                <div className="absolute top-2 right-2 z-20 pointer-events-none">
                                    <div className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-border">
                                        {isPdf ? (
                                            <ExternalLink className="w-3.5 h-3.5 text-text-primary" />
                                        ) : (
                                            <Maximize2 className="w-3.5 h-3.5 text-text-primary" />
                                        )}
                                    </div>
                                </div>
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
                </div>
            </div>

            {/* Fullscreen Modal */}
            {fullscreenOpen && hasFloorPlan && (
                <FullscreenModal
                    src={floorPlanUrl}
                    alt={`${label} Floor Plan`}
                    isPdf={isPdf}
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
            <div className="relative z-10 flex flex-col items-center gap-2 px-4 text-center">
                <div className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center">
                    <Lock className="w-4 h-4 text-slate-500" />
                </div>

                <p className="text-xs font-bold text-slate-700">Floor Plan Locked</p>
                <p className="text-[10px] text-slate-500 max-w-[180px] leading-tight">
                    Request access to view the detailed floor plan
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
                        className="mt-1 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:bg-primary/90 active:scale-[0.97] transition-all disabled:opacity-60"
                    >
                        {submitting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <Unlock className="w-3 h-3" />
                        )}
                        {submitting ? "Requesting…" : "Request Access"}
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
    isPdf,
    onClose,
}: {
    src: string;
    alt: string;
    isPdf: boolean;
    onClose: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="relative max-w-5xl max-h-[90vh] w-full h-full"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute -top-10 right-0 text-white text-sm font-medium hover:text-white/80 transition-colors flex items-center gap-2"
                >
                    <Maximize2 className="w-4 h-4 rotate-45" />
                    ✕ Close
                </button>
                <div className="relative w-full h-full bg-white rounded-2xl overflow-hidden shadow-2xl">
                    {isPdf ? (
                        <iframe
                            src={`${src}#toolbar=0`}
                            className="w-full h-full border-none"
                            title={alt}
                        />
                    ) : (
                        <div className="relative w-full h-full">
                            <Image
                                src={src}
                                alt={alt}
                                fill
                                className="object-contain p-4"
                                sizes="90vw"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
