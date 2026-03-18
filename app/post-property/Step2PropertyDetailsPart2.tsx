import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2, Search, X } from "lucide-react";
import { FormData } from "./PostPropertyContent";
import { getStates, getCitiesByState, getLocalitiesByCity, State, City, Locality } from "@/lib/api/locations";

interface Step2PropertyDetailsPart2Props {
    formData: FormData;
    updateFormData: (data: Partial<FormData>) => void;
}

const FACING_OPTIONS = [
    "North",
    "East",
    "South",
    "West",
    "North-East",
    "North-West",
    "South-East",
    "South-West",
];

const FURNISHING_OPTIONS = [
    "Unfurnished",
    "Semi-Furnished",
    "Fully-Furnished",
];

const AGE_OPTIONS = [
    "Under Construction",
    "New (Ready to Move)",
    "1 - 5 Years",
    "5 - 10 Years",
    "10+ Years",
];

const POSSESSION_OPTIONS = [
    "Immediate",
    "Within 1 Month",
    "Within 3 Months",
    "Within 6 Months",
    "More than 6 Months",
];

export function Step2PropertyDetailsPart2({ formData, updateFormData }: Step2PropertyDetailsPart2Props) {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [states, setStates] = useState<State[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [localities, setLocalities] = useState<Locality[]>([]);

    const [loadingStates, setLoadingStates] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingLocalities, setLoadingLocalities] = useState(false);

    useEffect(() => {
        const loadInitialStates = async () => {
            setLoadingStates(true);
            try {
                const data = await getStates();
                setStates(data);
            } finally {
                setLoadingStates(false);
            }
        };
        loadInitialStates();
    }, []);

    useEffect(() => {
        const loadCities = async () => {
            if (formData.stateId) {
                setLoadingCities(true);
                try {
                    const data = await getCitiesByState(formData.stateId);
                    setCities(data);
                } finally {
                    setLoadingCities(false);
                }
            } else {
                setCities([]);
            }
        };
        loadCities();
    }, [formData.stateId]);

    useEffect(() => {
        const loadLocalities = async () => {
            if (formData.cityId) {
                setLoadingLocalities(true);
                try {
                    const data = await getLocalitiesByCity(formData.cityId);
                    setLocalities(data);
                } finally {
                    setLoadingLocalities(false);
                }
            } else {
                setLocalities([]);
            }
        };
        loadLocalities();
    }, [formData.cityId]);

    const toggleDropdown = (dropdown: string) => {
        setOpenDropdown(openDropdown === dropdown ? null : dropdown);
        setSearchTerm("");
    };

    const handleSelectDropdown = (field: string, value: string) => {
        updateFormData({ [field]: value });
        setOpenDropdown(null);
    };

    const handleSelectState = (state: State) => {
        updateFormData({
            state: state.name,
            stateId: state.id,
            city: undefined,
            cityId: undefined,
            locality: undefined,
            localityId: undefined,
            pincode: undefined
        });
        setOpenDropdown(null);
    };

    const handleSelectCity = (city: City) => {
        updateFormData({
            city: city.name,
            cityId: city.id,
            locality: undefined,
            localityId: undefined,
            pincode: undefined
        });
        setOpenDropdown(null);
    };

    const handleSelectLocality = (locality: Locality) => {
        updateFormData({
            locality: locality.name,
            localityId: locality.id,
            pincode: locality.pincode
        });
        setOpenDropdown(null);
        setSearchTerm("");
    };

    const filteredStates = states.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredCities = cities.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredLocalities = localities.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.pincode.includes(searchTerm)
    );

    const DropdownSearch = ({ placeholder }: { placeholder: string }) => (
        <div className="sticky top-0 bg-white border-b border-border p-2 z-[60]">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                    type="text"
                    autoFocus
                    className="w-full h-9 pl-9 pr-8 bg-slate-50 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                />
                {searchTerm && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSearchTerm("");
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <X className="w-3 h-3 text-text-muted" />
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300 mt-2">
            <div className="flex flex-col gap-6 md:gap-8">

                {/* 6. Address */}
                <Input
                    label="Address / Property Location"
                    type="text"
                    placeholder="e.g., Flat 402, Green Valley Apts"
                    value={formData.address || ""}
                    onChange={(e) => updateFormData({ address: e.target.value })}
                />

                {/* State + City 2-col on md */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <div className="flex flex-col gap-2 relative z-50">
                        <label className="text-sm font-medium text-text-primary">
                            State *
                        </label>
                        <button
                            type="button"
                            onClick={() => toggleDropdown("state")}
                            className={cn(
                                "flex items-center justify-between w-full h-12 px-4 bg-white border rounded-xl text-left transition-colors",
                                openDropdown === "state" ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50",
                                !formData.state && "text-text-muted"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                {loadingStates && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                                {formData.state || "Select State"}
                            </span>
                            <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform", openDropdown === "state" && "rotate-180")} />
                        </button>
                        {openDropdown === "state" && !loadingStates && (
                            <div className="absolute top-[76px] left-0 w-full bg-white border border-border rounded-xl shadow-lg overflow-hidden z-50">
                                <DropdownSearch placeholder="Search state..." />
                                <div className="max-h-48 overflow-y-auto py-1">
                                    {filteredStates.length > 0 ? (
                                        filteredStates.map((st) => (
                                            <button
                                                key={st.id}
                                                type="button"
                                                onClick={() => {
                                                    handleSelectState(st);
                                                    setSearchTerm("");
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                                            >
                                                {st.name}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-text-muted text-center font-medium">
                                            No states found
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 relative z-[45]">
                        <label className="text-sm font-medium text-text-primary">
                            City *
                        </label>
                        <button
                            type="button"
                            onClick={() => toggleDropdown("city")}
                            disabled={!formData.stateId}
                            className={cn(
                                "flex items-center justify-between w-full h-12 px-4 border rounded-xl text-left transition-colors",
                                !formData.stateId ? "bg-slate-50 opacity-60 cursor-not-allowed" : "bg-white",
                                openDropdown === "city" ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50",
                                !formData.city && "text-text-muted"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                {loadingCities && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                                {formData.city || "Select City"}
                            </span>
                            <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform", openDropdown === "city" && "rotate-180")} />
                        </button>
                        {openDropdown === "city" && !loadingCities && (
                            <div className="absolute top-[76px] left-0 w-full bg-white border border-border rounded-xl shadow-lg overflow-hidden z-[45]">
                                <DropdownSearch placeholder="Search city..." />
                                <div className="max-h-48 overflow-y-auto py-1">
                                    {filteredCities.length > 0 ? (
                                        filteredCities.map((ct) => (
                                            <button
                                                key={ct.id}
                                                type="button"
                                                onClick={() => {
                                                    handleSelectCity(ct);
                                                    setSearchTerm("");
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                                            >
                                                {ct.name}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-text-muted text-center font-medium">
                                            No cities found
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Locality + Pincode */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <div className="flex flex-col gap-2 relative z-[40]">
                        <label className="text-sm font-medium text-text-primary">
                            Locality / Sector *
                        </label>
                        <button
                            type="button"
                            onClick={() => toggleDropdown("locality")}
                            disabled={!formData.cityId}
                            className={cn(
                                "flex items-center justify-between w-full h-12 px-4 border rounded-xl text-left transition-colors",
                                !formData.cityId ? "bg-slate-50 opacity-60 cursor-not-allowed" : "bg-white",
                                openDropdown === "locality" ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50",
                                !formData.locality && "text-text-muted"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                {loadingLocalities && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                                {formData.locality || "Select Locality"}
                            </span>
                            <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform", openDropdown === "locality" && "rotate-180")} />
                        </button>
                        {openDropdown === "locality" && !loadingLocalities && (
                            <div className="absolute top-[76px] left-0 w-full bg-white border border-border rounded-xl shadow-lg overflow-hidden z-[40]">
                                <DropdownSearch placeholder="Search locality or pincode..." />
                                <div className="max-h-48 overflow-y-auto py-1">
                                    {filteredLocalities.length > 0 ? (
                                        filteredLocalities.map((loc) => (
                                            <button
                                                key={loc.id}
                                                type="button"
                                                onClick={() => {
                                                    handleSelectLocality(loc);
                                                    setSearchTerm("");
                                                }}
                                                className="w-full flex justify-between items-center px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors text-left"
                                            >
                                                <span>{loc.name}</span>
                                                <span className="text-slate-400 text-xs">{loc.pincode}</span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-text-muted text-center font-medium">
                                            No localities found
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <Input
                        label="Pincode"
                        type="text"
                        placeholder="Auto-filled from Locality"
                        value={formData.pincode || ""}
                        disabled
                        className="bg-slate-50 opacity-80"
                        onChange={() => { }} // Disabled read-only
                    />
                </div>

                {/* Landmark */}
                <Input
                    label="Landmark (Optional)"
                    type="text"
                    placeholder="e.g., Near City Mall"
                    value={formData.landmark || ""}
                    onChange={(e) => updateFormData({ landmark: e.target.value })}
                />

                {/* RERA Number (Optional) */}
                <Input
                    label="RERA Number (Optional)"
                    type="text"
                    placeholder="e.g., P52100012345"
                    value={formData.reraNumber || ""}
                    onChange={(e) => updateFormData({ reraNumber: e.target.value })}
                />

                {/* 9. Floor & 10. Total Floors */}
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                    <Input
                        label="Floor No."
                        type="number"
                        placeholder="e.g., 4"
                        min={0}
                        value={formData.floor || ""}
                        onChange={(e) => updateFormData({ floor: e.target.value })}
                        className="w-full"
                    />
                    <Input
                        label="Total Floors"
                        type="number"
                        placeholder="e.g., 10"
                        min={0}
                        value={formData.totalFloors || ""}
                        onChange={(e) => updateFormData({ totalFloors: e.target.value })}
                        className="w-full"
                    />
                </div>

                {/* 11. Facing + 12. Furnishing — 2-col on md */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {/* 11. Facing */}
                    <div className="flex flex-col gap-2 relative z-40">
                        <label className="text-sm font-medium text-text-primary">
                            Facing
                        </label>
                        <button
                            type="button"
                            onClick={() => toggleDropdown("facing")}
                            className={cn(
                                "flex items-center justify-between w-full h-12 px-4 bg-white border rounded-xl text-left transition-colors",
                                openDropdown === "facing" ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50",
                                !formData.facing && "text-text-muted"
                            )}
                        >
                            <span>{formData.facing || "Select facing direction"}</span>
                            <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform", openDropdown === "facing" && "rotate-180")} />
                        </button>
                        {openDropdown === "facing" && (
                            <div className="absolute top-[76px] left-0 w-full max-h-48 overflow-y-auto bg-white border border-border rounded-xl shadow-lg py-1 z-50">
                                {FACING_OPTIONS.map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => handleSelectDropdown("facing", opt)}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 12. Furnishing */}
                    <div className="flex flex-col gap-2 relative z-30">
                        <label className="text-sm font-medium text-text-primary">
                            Furnishing Status
                        </label>
                        <button
                            type="button"
                            onClick={() => toggleDropdown("furnishing")}
                            className={cn(
                                "flex items-center justify-between w-full h-12 px-4 bg-white border rounded-xl text-left transition-colors",
                                openDropdown === "furnishing" ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50",
                                !formData.furnishing && "text-text-muted"
                            )}
                        >
                            <span>{formData.furnishing || "Select furnishing status"}</span>
                            <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform", openDropdown === "furnishing" && "rotate-180")} />
                        </button>
                        {openDropdown === "furnishing" && (
                            <div className="absolute top-[76px] left-0 w-full bg-white border border-border rounded-xl shadow-lg overflow-hidden py-1 z-40">
                                {FURNISHING_OPTIONS.map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => handleSelectDropdown("furnishing", opt)}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div> {/* end Facing + Furnishing 2-col grid */}

                {/* 13. Age + 14. Possession — 2-col on md */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {/* 13. Age */}
                    <div className="flex flex-col gap-2 relative z-20">
                        <label className="text-sm font-medium text-text-primary">
                            Property Age
                        </label>
                        <button
                            type="button"
                            onClick={() => toggleDropdown("age")}
                            className={cn(
                                "flex items-center justify-between w-full h-12 px-4 bg-white border rounded-xl text-left transition-colors",
                                openDropdown === "age" ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50",
                                !formData.age && "text-text-muted"
                            )}
                        >
                            <span>{formData.age || "Select property age"}</span>
                            <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform", openDropdown === "age" && "rotate-180")} />
                        </button>
                        {openDropdown === "age" && (
                            <div className="absolute top-[76px] left-0 w-full bg-white border border-border rounded-xl shadow-lg overflow-hidden py-1 z-30">
                                {AGE_OPTIONS.map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => handleSelectDropdown("age", opt)}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 14. Possession Status */}
                    <div className="flex flex-col gap-2 relative z-10">
                        <label className="text-sm font-medium text-text-primary">
                            Possession Status
                        </label>
                        <button
                            type="button"
                            onClick={() => toggleDropdown("possession")}
                            className={cn(
                                "flex items-center justify-between w-full h-12 px-4 bg-white border rounded-xl text-left transition-colors",
                                openDropdown === "possession" ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50",
                                !formData.possession && "text-text-muted"
                            )}
                        >
                            <span>{formData.possession || "Select possession status"}</span>
                            <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform", openDropdown === "possession" && "rotate-180")} />
                        </button>
                        {openDropdown === "possession" && (
                            <div className="absolute top-[76px] left-0 w-full bg-white border border-border rounded-xl shadow-lg overflow-hidden py-1 z-30">
                                {POSSESSION_OPTIONS.map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => handleSelectDropdown("possession", opt)}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div> {/* end Age + Possession 2-col grid */}

            </div>
        </div>
    );
}
