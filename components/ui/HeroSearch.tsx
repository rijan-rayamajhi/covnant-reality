"use client";

import { Search, ChevronDown, MapPin, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthContext";
import { SearchLocationResult, searchLocations } from "@/lib/api/locations";
import { SearchCategory } from "@/types";
import { fetchSearchCategories } from "@/lib/supabase/homepage";

type PrimaryTab = "buy" | "rent" | "sell";

// ─── Portal helpers ───────────────────────────────────────────────────────────

/** Calculates fixed position of a dropdown relative to an anchor button,
 *  and flips horizontally if it would overflow the right edge of the screen. */
function useDropdownStyle(
    anchorRef: React.RefObject<HTMLButtonElement | null>,
    open: boolean,
    dropdownWidth: number
) {
    const [style, setStyle] = useState<React.CSSProperties>({});

    const recalc = useCallback(() => {
        if (!open || !anchorRef.current) return;
        const rect = anchorRef.current.getBoundingClientRect();
        const vw = window.innerWidth;
        const top = rect.bottom + 8;
        // Default: align left edge of dropdown with left edge of button
        let left = rect.left;
        // Flip: if dropdown would overflow right edge, align right edges instead
        if (left + dropdownWidth > vw - 8) {
            left = Math.max(8, rect.right - dropdownWidth);
        }
        setStyle({ position: "fixed", top, left, zIndex: 9999, width: dropdownWidth });
    }, [open, anchorRef, dropdownWidth]);

    useEffect(() => {
        recalc();
        if (!open) return;
        window.addEventListener("scroll", recalc, true);
        window.addEventListener("resize", recalc);
        return () => {
            window.removeEventListener("scroll", recalc, true);
            window.removeEventListener("resize", recalc);
        };
    }, [open, recalc]);

    return style;
}

// ─── Category Dropdown ────────────────────────────────────────────────────────

interface CategoryDropdownProps {
    label: string;
    subtypes: readonly string[];
    isActive: boolean;
    onToggle: () => void;
    selectedSub: string | null;
    onSubSelect: (sub: string) => void;
    onClear: () => void;
}

function CategoryDropdown({
    label,
    subtypes,
    isActive,
    onToggle,
    selectedSub,
    onSubSelect,
    onClear,
}: CategoryDropdownProps) {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function handler(e: MouseEvent) {
            const target = e.target as Node;
            if (
                buttonRef.current?.contains(target) ||
                dropdownRef.current?.contains(target)
            ) return;
            setOpen(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        function handler(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open]);

    const dropdownStyle = useDropdownStyle(buttonRef, open && isActive, 256);

    const handleClick = () => {
        onToggle();
        setOpen((p) => !p);
    };

    return (
        <div>
            <button
                ref={buttonRef}
                type="button"
                onClick={handleClick}
                aria-haspopup="listbox"
                aria-expanded={open && isActive}
                className={cn(
                    "flex items-center gap-1.5 shrink-0 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl",
                    "text-sm font-medium transition-all select-none",
                    "min-h-[40px] touch-manipulation",
                    isActive
                        ? "bg-primary/20 text-primary ring-2 ring-primary/40 brightness-95"
                        : "bg-slate-200/80 text-slate-800 hover:bg-slate-300 hover:text-slate-950 font-bold"
                )}
            >
                <span className="truncate max-w-[96px] sm:max-w-none">
                    {label}
                    {selectedSub && isActive && (
                        <span className="text-xs opacity-60 ml-1 hidden sm:inline">
                            · {selectedSub}
                        </span>
                    )}
                </span>
                <ChevronDown
                    className={cn(
                        "h-4 w-4 shrink-0 transition-transform duration-200",
                        open && isActive ? "rotate-180" : ""
                    )}
                />
            </button>

            {open && isActive && typeof document !== "undefined" &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        style={dropdownStyle}
                        role="listbox"
                        aria-label={`${label} type`}
                        className="bg-white border border-slate-200 rounded-2xl shadow-2xl py-2
                                   animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 mb-1">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                {label} Type
                            </span>
                            {selectedSub && (
                                <button
                                    type="button"
                                    onClick={() => { onClear(); setOpen(false); }}
                                    className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-0.5 transition-colors"
                                >
                                    <X className="h-3 w-3" /> Clear
                                </button>
                            )}
                        </div>

                        {/* Options */}
                        <div className="max-h-64 overflow-y-auto overscroll-contain">
                            {subtypes.map((sub) => (
                                <button
                                    key={sub}
                                    type="button"
                                    role="option"
                                    aria-selected={selectedSub === sub}
                                    onClick={() => { onSubSelect(sub); setOpen(false); }}
                                    className={cn(
                                        "w-full text-left px-4 py-2.5 text-sm transition-colors",
                                        "min-h-[40px] touch-manipulation",
                                        selectedSub === sub
                                            ? "bg-primary/5 text-primary font-medium"
                                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    {sub}
                                </button>
                            ))}
                        </div>
                    </div>,
                    document.body
                )
            }
        </div>
    );
}



// ─── Main HeroSearch ──────────────────────────────────────────────────────────

export function HeroSearch() {
    const router = useRouter();
    const { user, userRole } = useAuth();
    const canPostProperty = userRole !== "buyer" && userRole !== "tenant";
    const visibleTabs = useMemo(
        () => canPostProperty ? [
            { label: "Buy", value: "buy" },
            { label: "Rent", value: "rent" },
            { label: "Sell", value: "sell" },
        ] : [
            { label: "Buy", value: "buy" },
            { label: "Rent", value: "rent" },
        ],
        [canPostProperty]
    );
    const [activeTab, setActiveTab] = useState<PrimaryTab>("buy");
    const [categories, setCategories] = useState<SearchCategory[]>([]);
    const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);
    const [selectedSubtypes, setSelectedSubtypes] = useState<Record<string, string | null>>({});

    useEffect(() => {
        fetchSearchCategories().then(setCategories);
    }, []);

    // Autocomplete State
    const [location, setLocation] = useState("");
    const [suggestions, setSuggestions] = useState<SearchLocationResult[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<SearchLocationResult | null>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchSuggestions = async () => {
            // If user just selected an item, don't re-fetch
            if (selectedLocation) return;
            if (location.trim().length < 2) {
                setSuggestions([]);
                setIsDropdownOpen(false);
                return;
            }
            setLoadingSuggestions(true);
            const res = await searchLocations(location);
            setSuggestions(res);
            setIsDropdownOpen(true);
            setLoadingSuggestions(false);
        };
        const timeoutId = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [location, selectedLocation]);

    const handleSearch = () => {
        if (activeTab === "sell") {
            if (!user) {
                router.push("/login?next=/post-property");
            } else {
                router.push("/post-property");
            }
            return;
        }
        const params = new URLSearchParams();
        params.set("type", activeTab === "buy" ? "sell" : "rent");
        if (activeCategorySlug) params.set("category", activeCategorySlug);
        const sub = activeCategorySlug ? selectedSubtypes[activeCategorySlug] : null;
        if (sub) params.set("subtype", sub.toLowerCase().replace(/[/&,\s]+/g, "-"));

        if (selectedLocation) {
            if (selectedLocation.type === 'city') {
                params.set("cityId", selectedLocation.id);
                params.set("location", selectedLocation.name.toLowerCase());
            } else {
                params.set("localityId", selectedLocation.id);
                params.set("location", selectedLocation.name.toLowerCase());
            }
        } else if (location.trim()) {
            params.set("location", location.trim().toLowerCase());
        }

        router.push(`/search?${params.toString()}`);
    };

    const handleSelectLocation = (loc: SearchLocationResult) => {
        setSelectedLocation(loc);
        if (loc.type === 'locality') {
            setLocation(`${loc.name}, ${loc.parentName}`);
        } else {
            setLocation(`${loc.name}, ${loc.stateName}`);
        }
        setIsDropdownOpen(false);
    };

    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocation(e.target.value);
        setSelectedLocation(null);
    };

    return (
        <section
            className="relative w-full flex flex-col justify-center min-h-[85vh] sm:min-h-[700px] overflow-hidden pb-16"
            aria-label="Property search"
        >
            {/* Background */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage:
                        'url("/hero-bg-blue.png")',
                }}
                aria-hidden="true"
            />
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900/80" aria-hidden="true" />

            {/* Content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center pt-24 sm:pt-28">

                {/* Heading */}
                <div className="max-w-4xl text-center mb-8 sm:mb-12">
                    <p className="text-lg sm:text-xl text-slate-100 max-w-2xl mx-auto drop-shadow-lg font-medium opacity-90 leading-relaxed">
                        Discover premium apartments, modern villas, and luxury plots in your favorite city.
                    </p>
                </div>

                {/* Search Card */}
                <div className="w-full max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] p-4 sm:p-6 lg:p-8 border border-white/20">

                        {/* ── Row 1: Buy / Rent / Sell ── */}
                        <div className="flex items-center gap-2 mb-3 sm:mb-4" role="tablist" aria-label="Listing type">
                            {visibleTabs.map((tab) => (
                                <button
                                    key={tab.value}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeTab === tab.value}
                                    onClick={() => setActiveTab(tab.value as PrimaryTab)}
                                    className={cn(
                                        "px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-sm sm:text-base font-semibold transition-all",
                                        "min-h-[40px] touch-manipulation",
                                        activeTab === tab.value
                                            ? "bg-primary text-white shadow-xl ring-4 ring-primary/10 scale-105"
                                            : "bg-slate-200/80 text-slate-800 hover:bg-slate-300 hover:text-slate-950 font-bold"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-slate-100 mb-3 sm:mb-4" />

                        {/* ── Row 2: Dynamic Categories ── */}
                        <div className="flex items-center gap-2 mb-4 sm:mb-6 flex-wrap" role="group" aria-label="Property category">
                            {categories.map((cat) => (
                                <CategoryDropdown
                                    key={cat.id}
                                    label={cat.name}
                                    subtypes={cat.subtypes.map(s => s.name)}
                                    isActive={activeCategorySlug === cat.slug}
                                    onToggle={() =>
                                        setActiveCategorySlug((p) => p === cat.slug ? null : cat.slug)
                                    }
                                    selectedSub={selectedSubtypes[cat.slug] || null}
                                    onSubSelect={(sub) => {
                                        setSelectedSubtypes(p => ({ ...p, [cat.slug]: sub }));
                                        setActiveCategorySlug(cat.slug);
                                    }}
                                    onClear={() => setSelectedSubtypes(p => ({ ...p, [cat.slug]: null }))}
                                />
                            ))}
                            {categories.length === 0 && (
                                <div className="animate-pulse flex gap-2">
                                    <div className="h-10 w-24 bg-slate-100 rounded-xl"></div>
                                    <div className="h-10 w-24 bg-slate-100 rounded-xl"></div>
                                </div>
                            )}
                        </div>

                        {/* ── Row 3: Inputs ── */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Location */}
                            <div className="relative flex-1 group" ref={searchRef}>
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none">
                                    <MapPin className="h-5 w-5" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by locality, city, or pincode"
                                    value={location}
                                    onChange={handleLocationChange}
                                    onFocus={() => { if (suggestions.length > 0) setIsDropdownOpen(true); }}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    aria-label="Search location"
                                    className={cn(
                                        "w-full h-12 sm:h-14 pl-11 pr-4 text-sm sm:text-base",
                                        "bg-slate-50 border border-slate-200 rounded-xl",
                                        "placeholder:text-slate-400",
                                        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30",
                                        "transition-all duration-200"
                                    )}
                                />
                                {loadingSuggestions && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block"></span>
                                    </div>
                                )}
                                {isDropdownOpen && suggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="max-h-72 overflow-y-auto overscroll-contain py-2">
                                            {suggestions.map((loc) => (
                                                <button
                                                    key={loc.id}
                                                    type="button"
                                                    onClick={() => handleSelectLocation(loc)}
                                                    className="w-full text-left pl-3 pr-4 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between group/item"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover/item:bg-primary/10 group-hover/item:text-primary transition-colors flex-shrink-0">
                                                            <MapPin className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-slate-800 text-sm">{loc.name}</span>
                                                            <span className="text-xs text-slate-500">
                                                                {loc.type === 'locality' ? `${loc.parentName}, ${loc.stateName}` : loc.stateName}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className={cn(
                                                        "text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full",
                                                        loc.type === 'city'
                                                            ? "bg-blue-50 text-blue-600"
                                                            : "bg-emerald-50 text-emerald-600"
                                                    )}>
                                                        {loc.type}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Search Button */}
                            <Button
                                size="lg"
                                onClick={handleSearch}
                                aria-label={activeTab === "sell" ? "Post Property" : "Search Properties"}
                                className="w-full sm:w-auto h-12 sm:h-14 text-sm sm:text-base font-semibold rounded-xl px-5 sm:px-8 whitespace-nowrap"
                            >
                                <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-2 shrink-0" />
                                {activeTab === "sell" ? "Post Property" : "Search"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-12 sm:mt-16 flex flex-wrap justify-center gap-6 sm:gap-16 text-white/90">
                    {[
                        { value: "10K+", label: "Properties" },
                        { value: "150+", label: "Cities" },
                        { value: "1M+", label: "Happy Users" },
                    ].map((stat, i) => (
                        <div key={stat.label} className="flex items-center gap-6 sm:gap-16">
                            {i > 0 && <div className="w-px h-8 sm:h-12 bg-white/20 hidden sm:block" />}
                            <div className="flex flex-col items-center">
                                <span className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                                    {stat.value}
                                </span>
                                <span className="text-xs sm:text-base text-white/70 font-medium mt-1">
                                    {stat.label}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
