"use client";

import { useState, useEffect } from "react";
import { MapPin, Search, ChevronLeft, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStates, getCitiesByState, getLocalitiesByCity, State, City, Locality } from "@/lib/api/locations";
import { SelectedLocation } from "@/components/LocationContext";

interface LocationSelectorProps {
    isOpen: boolean;
    selectedLocation: SelectedLocation;
    onSelect: (location: SelectedLocation) => void;
    onClose: () => void;
}

type Step = "STATE" | "CITY" | "LOCALITY";

export function LocationSelector({
    isOpen,
    selectedLocation,
    onSelect,
    onClose,
}: LocationSelectorProps) {
    const [visible, setVisible] = useState(false);
    const [animating, setAnimating] = useState(false);

    const [step, setStep] = useState<Step>("STATE");
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [states, setStates] = useState<State[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [localities, setLocalities] = useState<Locality[]>([]);

    const [tempState, setTempState] = useState<State | undefined>(selectedLocation.state);
    const [tempCity, setTempCity] = useState<City | undefined>(selectedLocation.city);

    // Initial load for states
    useEffect(() => {
        const loadStates = async () => {
            if (isOpen && states.length === 0) {
                setIsLoading(true);
                try {
                    const data = await getStates();
                    setStates(data);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        loadStates();
    }, [isOpen, states.length]);

    // Update steps based on temp selection
    useEffect(() => {
        if (isOpen) {
            // Using a microtask to avoid synchronous setState warning
            queueMicrotask(() => setSearch(""));
        }
    }, [step, isOpen]);

    // Handle open/close animation lifecycle
    useEffect(() => {
        if (isOpen) {
            queueMicrotask(() => {
                setStep("STATE");
                setTempState(selectedLocation.state);
                setTempCity(selectedLocation.city);
            });

            setVisible(true);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setAnimating(true));
            });
        } else {
            setAnimating(false);
            const timer = setTimeout(() => {
                setVisible(false);
                setSearch("");
                setStep("STATE");
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, selectedLocation]);

    const handleSelectState = async (state: State) => {
        setTempState(state);
        setTempCity(undefined);
        setIsLoading(true);
        const stateCities = await getCitiesByState(state.id);
        setCities(stateCities);
        setIsLoading(false);
        setStep("CITY");
    };

    const handleSelectCity = async (city: City) => {
        setTempCity(city);
        setIsLoading(true);
        const cityLocalities = await getLocalitiesByCity(city.id);
        setLocalities(cityLocalities);
        setIsLoading(false);
        setStep("LOCALITY");
    };

    const handleSelectLocality = (locality: Locality) => {
        if (tempState && tempCity) {
            onSelect({
                state: tempState,
                city: tempCity,
                locality: locality
            });
        }
    };

    const handleBack = () => {
        if (step === "CITY") setStep("STATE");
        if (step === "LOCALITY") setStep("CITY");
    };

    let listData: { id: string; name: string; subtitle?: string; original: State | City | Locality }[] = [];
    if (step === "STATE") {
        listData = states.map(s => ({ id: s.id, name: s.name, original: s }));
    } else if (step === "CITY") {
        listData = cities.map(c => ({ id: c.id, name: c.name, original: c }));
    } else if (step === "LOCALITY") {
        listData = localities.map(l => ({ id: l.id, name: l.name, subtitle: l.pincode, original: l }));
    }

    const filteredData = listData.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.subtitle && item.subtitle.includes(search))
    );

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                className={cn(
                    "absolute inset-0 bg-black/40 transition-opacity duration-300",
                    animating ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Drawer / Modal */}
            <div
                className={cn(
                    "relative w-full max-w-[28rem] bg-white rounded-t-3xl md:rounded-2xl shadow-2xl",
                    "transition-all duration-300 ease-out flex flex-col",
                    "max-h-[85vh] md:max-h-[80vh]",
                    "safe-area-bottom md:pb-0 px-2",
                    animating
                        ? "translate-y-0 opacity-100 md:scale-100"
                        : "translate-y-full md:translate-y-4 md:opacity-0 md:scale-95"
                )}
            >
                {/* Mobile Handle bar */}
                <div className="flex items-center justify-between px-4 pt-3 pb-2 md:hidden">
                    <div className="flex-1">
                        {step !== "STATE" && (
                            <button onClick={handleBack} className="p-1 -ml-1 text-slate-500 hover:text-slate-800 transition">
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                    <div className="w-12 h-1.5 rounded-full bg-slate-200" />
                    <div className="flex-1 flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-slate-100 transition-colors text-slate-500"
                            aria-label="Close city selector"
                        >
                            <X className="h-4.5 w-4.5" />
                        </button>
                    </div>
                </div>

                {/* Desktop Header */}
                <div className="hidden md:flex items-center justify-between px-5 pt-5 pb-2">
                    {step !== "STATE" ? (
                        <button onClick={handleBack} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                            <ChevronLeft className="h-4.5 w-4.5 mr-1" /> Back
                        </button>
                    ) : <div />}
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-slate-100 transition-colors text-slate-500 z-10"
                        aria-label="Close selector"
                    >
                        <X className="h-4.5 w-4.5" />
                    </button>
                </div>

                {/* Title */}
                <div className="px-5 pb-3 md:pt-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-text-primary">
                            {step === "STATE" && "Select State"}
                            {step === "CITY" && `Select City in ${tempState?.name}`}
                            {step === "LOCALITY" && `Select Locality in ${tempCity?.name}`}
                        </h2>
                        {Object.keys(selectedLocation).length > 0 && (
                            <button
                                onClick={() => {
                                    onSelect({});
                                    onClose();
                                }}
                                className="text-xs font-medium text-primary hover:text-primary-hover underline underline-offset-2 transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-text-muted mt-0.5">
                        {step === "STATE" && "Choose your preferred state from available regions."}
                        {step === "CITY" && "Choose a city to explore properties."}
                        {step === "LOCALITY" && "Select a locality or search by pincode."}
                    </p>
                </div>

                {/* Search */}
                <div className="px-5 pb-4">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder={step === "LOCALITY" ? "Search locality or pincode..." : "Search..."}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={cn(
                                "w-full h-11 pl-10 pr-10 text-sm bg-slate-50 border border-slate-200 rounded-xl",
                                "placeholder:text-slate-400",
                                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30",
                                "transition-all duration-200"
                            )}
                            autoFocus
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto px-5 pb-6 overscroll-contain min-h-[50vh] md:min-h-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Loader2 className="h-6 w-6 animate-spin mb-3 text-primary" />
                            <p className="text-sm font-medium">Loading...</p>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <MapPin className="h-8 w-8 mb-3 opacity-20" />
                            <p className="text-sm font-medium">No results found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {filteredData.map((item) => {
                                const isSelected =
                                    (step === "STATE" && tempState?.id === item.id) ||
                                    (step === "CITY" && tempCity?.id === item.id) ||
                                    (step === "LOCALITY" && selectedLocation.locality?.id === item.id);

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            if (step === "STATE") handleSelectState(item.original as State);
                                            else if (step === "CITY") handleSelectCity(item.original as City);
                                            else handleSelectLocality(item.original as Locality);
                                        }}
                                        className={cn(
                                            "flex flex-col items-center gap-1 py-3.5 px-2 rounded-xl transition-all duration-200",
                                            "text-sm font-medium min-h-[80px] justify-center",
                                            isSelected
                                                ? "bg-primary/10 text-primary ring-1 ring-primary/30 shadow-sm"
                                                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                                        )}
                                    >
                                        <MapPin
                                            className={cn(
                                                "h-5 w-5 transition-colors shrink-0",
                                                isSelected
                                                    ? "text-primary"
                                                    : "text-slate-400"
                                            )}
                                        />
                                        <span className="truncate w-full text-center" title={item.name}>
                                            {item.name}
                                        </span>
                                        {item.subtitle && (
                                            <span className="text-xs font-normal text-slate-400 mt-0.5">
                                                {item.subtitle}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
