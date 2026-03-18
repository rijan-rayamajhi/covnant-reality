"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { fetchCategoryCounts } from "@/lib/supabase/homepage";
import { useCity } from "@/components/CityContext";

interface Category {
    id: string;
    label: string;
    type: string;
    count: string;
    image: string;
}

const initialCategories: Category[] = [
    {
        id: "cat-1",
        label: "Apartments",
        type: "apartment",
        count: "...",
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop",
    },
    {
        id: "cat-2",
        label: "Villas",
        type: "villa",
        count: "...",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop",
    },
    {
        id: "cat-3",
        label: "Plots",
        type: "plot",
        count: "...",
        image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop",
    },
    {
        id: "cat-4",
        label: "Commercial",
        type: "commercial",
        count: "...",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop",
    },
    {
        id: "cat-5",
        label: "PG / Co-living",
        type: "pg",
        count: "...",
        image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=800&auto=format&fit=crop",
    },
];

export function CategoryScroll() {
    const { selectedCity } = useCity();
    const [categories, setCategories] = useState(initialCategories);

    useEffect(() => {
        let isMounted = true;
        fetchCategoryCounts(selectedCity || undefined)
            .then((counts) => {
                if (isMounted) {
                    setCategories((prev) =>
                        prev.map((cat) => {
                            const baseCount = counts[cat.type] || 0;
                            let displayCount = baseCount;
                            // Merge house count into apartments for UI
                            if (cat.type === "apartment") {
                                displayCount += (counts["house"] || 0);
                            }
                            return {
                                ...cat,
                                count: displayCount.toLocaleString(),
                            };
                        })
                    );
                }
            })
            .catch((err) => console.error("[CategoryScroll] count error:", err));

        return () => {
            isMounted = false;
        };
    }, [selectedCity]);

    return (
        <section className="py-12 lg:py-20 bg-white">
            <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-text-primary">
                        Explore Categories
                    </h2>
                    <p className="text-sm md:text-base text-slate-500 mt-1">
                        Browse properties by your preferred type
                    </p>
                </div>
            </div>

            {/* Mobile: Horizontal scroll | Desktop: 5-column grid */}
            <div
                className={cn(
                    "flex lg:grid lg:grid-cols-5 gap-6",
                    "overflow-x-auto lg:overflow-visible snap-x snap-mandatory scrollbar-hide",
                    "px-4 sm:px-6 lg:px-8 pb-4 lg:pb-0 max-w-7xl mx-auto"
                )}
            >
                {categories.map((cat) => (
                    <Link
                        key={cat.id}
                        href={`/search?category=${encodeURIComponent(cat.type)}`}
                        className={cn(
                            "group relative overflow-hidden rounded-2xl cursor-pointer",
                            "min-w-[45%] sm:min-w-[30%] lg:min-w-0 snap-center first:pl-4 last:pr-4 lg:first:pl-0 lg:last:pr-0",
                            "aspect-square sm:aspect-[4/3] lg:h-40 lg:aspect-auto",
                            "shadow-sm hover:shadow-md transition-shadow duration-300 flex-shrink-0"
                        )}
                    >
                        {/* Background Image */}
                        <div className="absolute inset-x-0 inset-y-0 w-full h-full">
                            <Image
                                src={cat.image}
                                alt={cat.label}
                                fill
                                className="object-cover transition-transform duration-500 lg:group-hover:scale-105"
                            />
                        </div>

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Text Content */}
                        <div className="absolute bottom-0 left-0 p-4 w-full">
                            <h3 className="text-base sm:text-lg font-semibold text-white truncate drop-shadow-md">
                                {cat.label}
                            </h3>
                            <p className="text-xs sm:text-sm text-white/90 mt-0.5 font-medium drop-shadow-md">
                                {cat.count} {cat.count === "1" ? "Property" : "Properties"}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
