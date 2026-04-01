"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PropertyCard } from "./PropertyCard";
import { PropertyCardSkeleton } from "./PropertyCardSkeleton";
import { fetchRecentProperties } from "@/lib/supabase/homepage";
import { useCity } from "@/components/CityContext";
import { HomepageEmptyState } from "./HomepageEmptyState";
import type { Property } from "@/types";

export function RecentlyAddedProperties() {
    const { selectedCity } = useCity();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [prevCity, setPrevCity] = useState(selectedCity);

    if (selectedCity !== prevCity) {
        setPrevCity(selectedCity);
        setLoading(true);
    }

    useEffect(() => {
        let cancelled = false;
        // setLoading(true); // Handled during rendering
        fetchRecentProperties(8, selectedCity || undefined)
            .then((data) => {
                if (!cancelled) setProperties(data);
            })
            .catch((err) => console.error("[RecentlyAdded] fetch error:", err))
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [selectedCity]);

    return (
        <section className="py-12 lg:py-20 bg-white">
            <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 lg:mb-10">
                <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
                        Recently Added
                    </h2>
                    <p className="text-sm sm:text-base lg:text-lg text-slate-500 font-medium">
                        Latest properties added{selectedCity ? ` in ${selectedCity}` : ""}
                    </p>
                </div>
                <Link
                    href="/search"
                    className="inline-flex items-center text-sm sm:text-base font-semibold text-blue-600 hover:text-blue-700 hover:translate-x-1 transition-all duration-200 group w-fit"
                    aria-label="Explore all recent properties"
                >
                    Explore All
                    <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>

            {/* Mobile: Horizontal Scroll | Desktop: Grid */}
            <div className="flex lg:grid lg:grid-cols-3 gap-6 overflow-x-auto lg:overflow-visible snap-x snap-mandatory scrollbar-hide px-4 sm:px-6 lg:px-8 pb-4 lg:pb-0 max-w-7xl mx-auto">
                {loading
                    ? [...Array(3)].map((_, i) => (
                        <PropertyCardSkeleton
                            key={i}
                            className="min-w-[85%] sm:min-w-[45%] lg:min-w-0 snap-center"
                        />
                    ))
                    : properties.map((property) => (
                        <PropertyCard
                            key={property.id}
                            property={property}
                            className="min-w-[85%] sm:min-w-[45%] lg:min-w-0 snap-center"
                        />
                    ))}
            </div>
            {!loading && properties.length === 0 && (
                <HomepageEmptyState variant="property" cityName={selectedCity} />
            )}
        </section>
    );
}
