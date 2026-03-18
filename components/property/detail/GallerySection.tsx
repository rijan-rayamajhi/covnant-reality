"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { BadgeCheck, Heart } from "lucide-react";
import { usePropertyContext } from "@/components/PropertyContext";
import { useAuth } from "@/components/AuthContext";

interface GallerySectionProps {
    images: string[];
    videos?: string[];
    verified?: boolean;
    propertyId?: string;
}

export function GallerySection({ images, videos = [], verified, propertyId }: GallerySectionProps) {
    const allMedia = [
        ...images.map(src => ({ src, type: 'image' as const })),
        ...videos.map(src => ({ src, type: 'video' as const }))
    ];

    const displayMedia = allMedia.length > 0
        ? allMedia
        : [{ src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800", type: 'image' as const }];

    const [activeIndex, setActiveIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // ── Wishlist wired to Supabase via PropertyContext ───────────────────────
    const { savedProperties, toggleSave } = usePropertyContext();
    const { userRole } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isSaved = propertyId ? savedProperties.includes(propertyId) : false;

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollPosition = container.scrollLeft;
            const itemWidth = container.offsetWidth;
            const newIndex = Math.round(scrollPosition / itemWidth);
            if (newIndex !== activeIndex && newIndex >= 0 && newIndex < displayMedia.length) {
                setActiveIndex(newIndex);
            }
        };

        let timeoutId: NodeJS.Timeout;
        const debouncedScroll = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(handleScroll, 50);
        };

        container.addEventListener("scroll", debouncedScroll);
        return () => {
            container.removeEventListener("scroll", debouncedScroll);
            clearTimeout(timeoutId);
        };
    }, [activeIndex, displayMedia.length]);

    return (
        <section className="relative w-full aspect-[4/3] max-h-[300px] md:max-h-[380px] lg:max-h-[450px] bg-bg group lg:rounded-t-2xl overflow-hidden">
            {/* Horizontal Scroll Container */}
            <div
                ref={scrollContainerRef}
                className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide overscroll-x-contain"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {displayMedia.map((media, idx) => (
                    <div
                        key={idx}
                        className="w-full h-full flex-shrink-0 snap-center snap-always relative"
                    >
                        {media.type === 'image' ? (
                            <Image
                                src={media.src}
                                alt={`Property image ${idx + 1}`}
                                fill
                                className="object-cover"
                                priority={idx === 0}
                            />
                        ) : (
                            <video
                                src={media.src}
                                controls
                                className="w-full h-full object-cover"
                                poster={images[0]} // Use first image as poster for videos
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Top Left: Verified Badge */}
            {verified && (
                <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-accent/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-medium shadow-sm">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    <span>Verified</span>
                </div>
            )}

            {/* Top Right: Save Icon */}
            <button
                onClick={() => {
                    if (!propertyId) return;
                    if (!userRole) {
                        localStorage.setItem("pendingSaveProperty", propertyId);
                        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
                    } else {
                        toggleSave(propertyId);
                    }
                }}
                className="absolute top-4 right-4 z-10 p-2.5 bg-white/90 backdrop-blur-sm shadow-sm rounded-full transition-colors active:scale-95"
                aria-label={isSaved ? "Unsave property" : "Save property"}
            >
                <Heart
                    className={`w-5 h-5 transition-colors ${isSaved ? "fill-danger text-danger" : "text-text-secondary"}`}
                    fill={isSaved ? "currentColor" : "none"}
                />
            </button>

            {/* Bottom Right: Number Indicator */}
            {displayMedia.length > 1 && (
                <div className="absolute bottom-4 right-4 z-10 px-2.5 py-1 bg-black/40 backdrop-blur-sm rounded-full border border-white/20 text-white text-[10px] font-bold tracking-widest tabular-nums">
                    {activeIndex + 1} / {displayMedia.length}
                </div>
            )}

            {/* Bottom Center: Indicator Dots */}
            {displayMedia.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-1.5 pointer-events-none">
                    {displayMedia.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-300 ${activeIndex === idx ? "bg-white w-6 opacity-100" : "bg-white/40 w-1.5 opacity-50"}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
