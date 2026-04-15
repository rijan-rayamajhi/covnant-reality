'use client';

import { ArrowLeft, SlidersHorizontal, ArrowUpDown, SearchX, AlertTriangle, Bookmark, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePropertySearch } from '@/hooks/usePropertySearch';
import { FilterDrawer } from '@/components/ui/FilterDrawer';
import { FilterContent } from '@/components/ui/FilterContent';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SearchProperty, SearchFilters } from '@/types';

// ─── Property Card for search results ───────────────────────────────────────

const SESSION_NOW = Date.now();

function SearchPropertyCard({ property }: { property: SearchProperty }) {
    const [imgError, setImgError] = useState(false);
    const hasImage = !!property.image_url && !imgError;
    const formatPrice = (price: number) => {
        if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)}Cr`;
        if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
        return `₹${price.toLocaleString('en-IN')}`;
    };

    const timeAgo = (dateStr: string) => {
        const diff = SESSION_NOW - new Date(dateStr).getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;
        return `${Math.floor(days / 30)}mo ago`;
    };

    return (
        <Link
            href={`/property/${property.id}`}
            className="group bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
        >
            {/* Property Image */}
            <div className="relative h-48 md:h-52 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                {hasImage ? (
                    <Image
                        src={property.image_url!}
                        alt={property.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={() => setImgError(true)}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
                        </svg>
                    </div>
                )}
                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                    {property.is_verified && (
                        <span className="px-2.5 py-1 bg-green-500 text-white text-xs font-semibold rounded-lg shadow-sm">
                            Verified
                        </span>
                    )}
                    <span className="px-2.5 py-1 bg-primary/90 text-white text-xs font-semibold rounded-lg shadow-sm capitalize">
                        {property.listing_type === 'sell' ? 'Buy' : 'Rent'}
                    </span>
                </div>
                <div className="absolute bottom-3 right-3">
                    <span className="text-xs text-white/90 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md">
                        {timeAgo(property.created_at)}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-text-primary text-base line-clamp-1 group-hover:text-primary transition-colors">
                    {property.title}
                </h3>
                <p className="text-sm text-text-secondary mt-1 line-clamp-1">
                    {property.address}, {property.city}
                </p>

                <div className="flex items-center gap-3 mt-3 text-xs text-text-secondary">
                    {property.bedrooms > 0 && (
                        <span className="flex items-center gap-1">
                            <span className="font-medium text-text-primary">{property.bedrooms}</span> BHK
                        </span>
                    )}
                    {property.bathrooms > 0 && (
                        <span className="flex items-center gap-1">
                            <span className="font-medium text-text-primary">{property.bathrooms}</span> Bath
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <span className="font-medium text-text-primary">{property.area_sqft.toLocaleString('en-IN')}</span> sq.ft
                    </span>
                </div>

                <div className="mt-auto pt-3 border-t border-border/50 mt-3">
                    <span className="text-lg font-bold text-primary">
                        {formatPrice(property.price)}
                    </span>
                    {property.listing_type === 'rent' && (
                        <span className="text-xs text-text-secondary">/mo</span>
                    )}
                </div>
            </div>
        </Link>
    );
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────

function PropertyCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm animate-pulse">
            <div className="h-48 md:h-52 bg-slate-200" />
            <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
                <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
                <div className="flex gap-3 mt-3">
                    <div className="h-3 bg-slate-100 rounded w-12" />
                    <div className="h-3 bg-slate-100 rounded w-12" />
                    <div className="h-3 bg-slate-100 rounded w-16" />
                </div>
                <div className="pt-3 border-t border-border/50">
                    <div className="h-5 bg-slate-200 rounded-lg w-24" />
                </div>
            </div>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="flex flex-col space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 md:gap-6 lg:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
            ))}
        </div>
    );
}

// ─── Sort Dropdown ──────────────────────────────────────────────────────────

const SORT_OPTIONS = [
    { label: 'Newest First', value: 'newest' as const },
    { label: 'Price: Low to High', value: 'price_low' as const },
    { label: 'Price: High to Low', value: 'price_high' as const },
];

function SortDropdown({ value, onChange }: { value: string; onChange: (v: 'newest' | 'price_low' | 'price_high') => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentLabel = SORT_OPTIONS.find((o) => o.value === value)?.label || 'Sort By';

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-bg-card hover:bg-border/50 transition-colors text-sm font-medium text-text-primary"
                aria-label="Sort properties"
            >
                <ArrowUpDown className="w-4 h-4" />
                {currentLabel}
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-border rounded-xl shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    {SORT_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => {
                                onChange(opt.value);
                                setOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${value === opt.value
                                ? 'bg-primary/5 text-primary font-medium'
                                : 'text-text-secondary hover:bg-bg-card hover:text-text-primary'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Pagination ─────────────────────────────────────────────────────────────

function Pagination({
    page,
    totalPages,
    onPageChange,
}: {
    page: number;
    totalPages: number;
    onPageChange: (p: number) => void;
}) {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
        const pages: (number | 'ellipsis')[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 0; i < totalPages; i++) pages.push(i);
        } else {
            pages.push(0);
            if (page > 2) pages.push('ellipsis');
            for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) {
                pages.push(i);
            }
            if (page < totalPages - 3) pages.push('ellipsis');
            pages.push(totalPages - 1);
        }
        return pages;
    };

    return (
        <div className="flex items-center justify-center gap-2 mt-10">
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 0}
                className="p-2 rounded-lg border border-border text-text-secondary hover:bg-bg-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>

            {getVisiblePages().map((p, i) =>
                p === 'ellipsis' ? (
                    <span key={`e-${i}`} className="px-2 text-text-secondary">…</span>
                ) : (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === p
                            ? 'bg-primary text-white shadow-sm'
                            : 'border border-border text-text-secondary hover:bg-bg-card hover:text-text-primary'
                            }`}
                    >
                        {p + 1}
                    </button>
                )
            )}

            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-lg border border-border text-text-secondary hover:bg-bg-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

// ─── Save Search ────────────────────────────────────────────────────────────

function SaveSearchButton({ filters }: { filters: SearchFilters }) {
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Please log in to save searches');
                return;
            }

            // Build a human-readable label
            const labelParts: string[] = [];
            if (filters.city) labelParts.push(String(filters.city));
            if (filters.listing_type) labelParts.push(filters.listing_type === 'sell' ? 'Buy' : 'Rent');
            const label = labelParts.length > 0 ? labelParts.join(' · ') : 'Search';

            const { error } = await supabase
                .from('saved_searches')
                .insert({
                    user_id: user.id,
                    filters: filters,
                    label: label,
                });

            if (error) throw error;
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            alert('Failed to save search. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-all ${saved
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'border-border bg-bg-card hover:bg-border/50 text-text-primary'
                } disabled:opacity-70`}
            aria-label="Save search"
        >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-green-500' : ''}`} />
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Search'}
        </button>
    );
}

// ─── Main SearchContent ─────────────────────────────────────────────────────

export function SearchContent() {
    const {
        results,
        totalCount,
        loading,
        error,
        filters,
        page,
        totalPages,
        updateFilter,
        setPage,
        retry,
    } = usePropertySearch();

    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const displayLocationParts = [
        filters.city ? filters.city.charAt(0).toUpperCase() + filters.city.slice(1) : 'All Locations'
    ];
    
    if (filters.city && filters.include_connected !== false) {
        displayLocationParts.push(' + nearby areas');
    }
    
    const displayLocation = displayLocationParts.join('');
    return (
        <div className="min-h-screen bg-bg relative">
            {/* Sticky Top Bar */}
            <div className="sticky top-[56px] z-40 bg-white border-b border-border shadow-sm">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 md:h-16 lg:h-[72px] flex items-center justify-between">

                    {/* Mobile/Tablet Header Left */}
                    <div className="flex items-center gap-3 lg:hidden">
                        <Link
                            href="/"
                            className="p-2 -ml-2 rounded-full hover:bg-bg-card transition-colors text-text-secondary hover:text-text-primary"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                        </Link>
                        <h1 className="text-base md:text-lg font-semibold text-text-primary">
                            {displayLocation}
                        </h1>
                    </div>

                    {/* Desktop Header Left (Aligned with Sidebar) */}
                    <div className="hidden lg:flex w-[280px] shrink-0 items-center">
                        <h2 className="text-xl font-bold text-text-primary">Filters</h2>
                    </div>

                    {/* Desktop Header Right (Aligned with Grid) */}
                    <div className="hidden lg:flex flex-1 items-center justify-between pl-8">
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-text-primary">{displayLocation}</h1>
                            <span className="text-sm text-text-secondary font-medium">
                                {loading ? 'Searching…' : `${totalCount} Properties Found`}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <SaveSearchButton filters={filters} />
                            <SortDropdown
                                value={filters.sort_by || 'newest'}
                                onChange={(v) => updateFilter({ sort_by: v })}
                            />
                        </div>
                    </div>

                    {/* Mobile/Tablet Header Right */}
                    <div className="flex items-center gap-2 lg:hidden">
                        <SortDropdown
                            value={filters.sort_by || 'newest'}
                            onChange={(v) => updateFilter({ sort_by: v })}
                        />
                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className="flex items-center justify-center p-2 rounded-full hover:bg-bg-card transition-colors text-text-secondary hover:text-text-primary relative"
                            aria-label="Open filters"
                        >
                            <SlidersHorizontal className="w-5 h-5 md:w-6 md:h-6" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
                {/* Mobile/Tablet Search Results Heading */}
                <div className="lg:hidden mb-4 md:mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-text-primary hidden md:block mb-2">
                                Search Results
                            </h2>
                            <span className="text-text-secondary font-medium text-sm md:text-base">
                                {loading ? 'Searching…' : `${totalCount} Properties Found`}
                            </span>
                        </div>
                        <div className="md:hidden">
                            <SaveSearchButton filters={filters} />
                        </div>
                    </div>
                </div>

                {/* Active Filters / Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                    {filters.listing_type && (
                        <span className="px-3.5 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full capitalize border border-primary/20">
                            {filters.listing_type === 'sell' ? 'Buy' : 'Rent'}
                        </span>
                    )}
                    {filters.city && (
                        <span className="px-3.5 py-1.5 bg-white text-text-secondary text-sm font-medium rounded-full capitalize border border-border shadow-sm">
                            {filters.city}
                        </span>
                    )}

                    {filters.bedrooms != null && (
                        <span className="px-3.5 py-1.5 bg-white text-text-secondary text-sm font-medium rounded-full border border-border shadow-sm">
                            {filters.bedrooms}+ BHK
                        </span>
                    )}
                    {filters.is_verified && (
                        <span className="px-3.5 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-200 shadow-sm">
                            Verified Only
                        </span>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-8">
                    {/* Desktop Sidebar Filters */}
                    <aside className="hidden lg:block w-[280px] shrink-0 sticky top-[calc(56px+72px+2rem)] h-[calc(100vh-128px-4rem)] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                            <FilterContent filters={filters} onFilterChange={updateFilter} />
                        </div>
                    </aside>

                    {/* Property Grid */}
                    <div className="flex-1 w-full">
                        {/* Loading State */}
                        {loading && <LoadingSkeleton />}

                        {/* Error State */}
                        {!loading && error && (
                            <div className="flex flex-col items-center justify-center p-8 bg-white border border-red-200 rounded-2xl shadow-sm text-center min-h-[400px]">
                                <div className="w-16 h-16 bg-red-50 flex items-center justify-center rounded-full mb-4">
                                    <AlertTriangle className="w-8 h-8 text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-text-primary mb-2">Something Went Wrong</h3>
                                <p className="text-text-secondary mb-6 max-w-md">
                                    {error}
                                </p>
                                <button
                                    onClick={retry}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Try Again
                                </button>
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && !error && results.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-8 bg-white border border-border rounded-2xl shadow-sm text-center min-h-[400px]">
                                <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-full mb-4">
                                    <SearchX className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-bold text-text-primary mb-2">No Properties Found</h3>
                                <p className="text-text-secondary mb-6 max-w-md">
                                    We couldn&apos;t find any properties matching your current filters. Try relaxing your search criteria.
                                </p>
                                <Link
                                    href="/search"
                                    className="px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
                                >
                                    Reset Filters
                                </Link>
                            </div>
                        )}

                        {/* Results Grid */}
                        {!loading && !error && results.length > 0 && (
                            <>
                                <div className="flex flex-col space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 md:gap-6 lg:gap-8">
                                    {results.map((property) => (
                                        <SearchPropertyCard key={property.id} property={property} />
                                    ))}
                                </div>
                                <Pagination
                                    page={page}
                                    totalPages={totalPages}
                                    onPageChange={setPage}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Render Bottom Sheet FilterDrawer for Mobile/Tablet */}
            <div className="lg:hidden">
                <FilterDrawer
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                    filters={filters}
                    onFilterChange={updateFilter}
                />
            </div>
        </div>
    );
}
