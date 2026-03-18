"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GallerySection } from "@/components/property/detail/GallerySection";
import { PriceSection } from "@/components/property/detail/PriceSection";
import { OverviewSection } from "@/components/property/detail/OverviewSection";
import { EmiCalculatorSection } from "@/components/property/detail/EmiCalculatorSection";
import { AmenitiesSection } from "@/components/property/detail/AmenitiesSection";
import { FloorPlanSection } from "@/components/property/detail/FloorPlanSection";
import { MapSection } from "@/components/property/detail/MapSection";
import { NearbySection } from "@/components/property/detail/NearbySection";
import { ProjectSection } from "@/components/property/detail/ProjectSection";
import { BuilderSection } from "@/components/property/detail/BuilderSection";
import { ReviewsSection } from "@/components/property/detail/ReviewsSection";
import { SimilarPropertiesSection } from "@/components/property/detail/SimilarPropertiesSection";
import { StickyBottomCta } from "@/components/property/detail/StickyBottomCta";
import { DesktopSidebar } from "@/components/property/detail/DesktopSidebar";
import { useAuth } from "@/components/AuthContext";
import { Search, ArrowLeft, Loader2 } from "lucide-react";
import { recordPropertyView } from "@/lib/supabase/property-views";
import { fetchPropertyById } from "@/lib/supabase/homepage";
import { DescriptionSection } from "@/components/property/detail/DescriptionSection";
import type { Property } from "@/types";
import { AreaUnit } from "@/utils/areaConversion";
import { useRouter } from "next/navigation";

// ─── View-tracking deduplication ────────────────────────────────────────────
const VIEW_COOLDOWN_MS = 10 * 60 * 1000;
const pendingViews = new Set<string>();

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const trackedRef = useRef(false);

    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [displayUnit, setDisplayUnit] = useState<AreaUnit>("Sq ft");

    // ── Fetch property from Supabase ───────────────────────────────────────
    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        // setLoading(true); // Removed to avoid lint error; loading is true by default
        fetchPropertyById(id).then((data) => {
            if (!cancelled) {
                setProperty(data);
                if (data?.area_unit) {
                    setDisplayUnit(data.area_unit as AreaUnit);
                }
                setLoading(false);
            }
        });
        return () => {
            cancelled = true;
            // Reset state for next ID to ensure loader shows if it changes
            setProperty(null);
            setLoading(true);
        };
    }, [id]);

    // ── Record property view on mount ──────────────────────────────────────
    useEffect(() => {
        if (!id) return;
        if (trackedRef.current) return;
        if (pendingViews.has(id)) return;

        const storageKey = `pv_${id}`;
        try {
            const prev = sessionStorage.getItem(storageKey);
            if (prev && Date.now() - Number(prev) < VIEW_COOLDOWN_MS) return;
        } catch { /* proceed */ }

        pendingViews.add(id);
        trackedRef.current = true;
        try { sessionStorage.setItem(storageKey, String(Date.now())); } catch { /* no-op */ }

        recordPropertyView(id, user?.id ?? null);
        return () => { pendingViews.delete(id); };
    }, [id, user?.id]);

    // ── Redirect if not logged in ──────────────────────────────────────────
    useEffect(() => {
        if (!authLoading && !user) {
            router.push(`/login?next=/property/${id}`);
        }
    }, [user, authLoading, router, id]);

    // ── Loading ────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <main className="bg-bg min-h-screen flex items-center justify-center px-4">
                <div className="flex flex-col items-center gap-3 text-text-muted">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-sm font-medium">Loading property details…</p>
                </div>
            </main>
        );
    }

    // ── Not found ──────────────────────────────────────────────────────────
    if (!property) {
        return (
            <main className="bg-bg min-h-screen flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-bg flex items-center justify-center">
                        <Search className="w-10 h-10 text-text-muted" />
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary mb-2">Property Not Found</h1>
                    <p className="text-sm text-text-secondary mb-6">
                        The property you are looking for does not exist or has been removed.
                    </p>
                    <Link
                        href="/search"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Search
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="bg-bg min-h-screen">
            <div className="max-w-screen-sm md:max-w-3xl lg:max-w-6xl mx-auto bg-bg-card lg:bg-transparent min-h-screen relative pb-24 lg:pb-8">
                <div className="lg:grid lg:grid-cols-12 lg:gap-10 lg:pt-6">
                    {/* Left Column */}
                    <div className="lg:col-span-8 lg:bg-bg-card lg:rounded-2xl lg:overflow-hidden lg:shadow-sm">
                        <GallerySection images={property.images} videos={property.videos} verified={property.verified} propertyId={property.id} />

                        <div className="px-4 md:px-6 lg:px-8 py-4 space-y-6 md:space-y-8">
                            <PriceSection property={property} displayUnit={displayUnit} setDisplayUnit={setDisplayUnit} />
                            <OverviewSection property={property} displayUnit={displayUnit} />
                            <DescriptionSection description={property.description} />
                            <EmiCalculatorSection price={property.price} listingType={property.listingType} />
                            <AmenitiesSection property={property} />
                            <FloorPlanSection property={property} />
                            <MapSection property={property} />
                            <NearbySection latitude={property.latitude} longitude={property.longitude} />
                            <ProjectSection property={property} />
                            <BuilderSection property={property} />
                            <ReviewsSection propertyId={property.id} />
                            <SimilarPropertiesSection currentId={property.id} propertyType={property.type} city={property.city} />
                        </div>
                    </div>

                    {/* Right Column – Desktop Sidebar */}
                    <div className="hidden lg:block lg:col-span-4">
                        <DesktopSidebar property={property} />
                    </div>
                </div>

                <StickyBottomCta property={property} />
            </div>
        </main>
    );
}
