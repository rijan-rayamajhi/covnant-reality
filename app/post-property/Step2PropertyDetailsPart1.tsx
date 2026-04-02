import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2 } from "lucide-react";
import { FormData } from "./PostPropertyContent";
import { fetchSearchCategories } from "@/lib/supabase/homepage";
import { SearchCategory } from "@/types";

interface Step2PropertyDetailsPart1Props {
    formData: FormData;
    updateFormData: (data: Partial<FormData>) => void;
    showErrors?: boolean;
}


const BHK_OPTIONS = [
    "1 BHK",
    "2 BHK",
    "3 BHK",
    "4 BHK",
    "5+ BHK",
];


export function Step2PropertyDetailsPart1({ formData, updateFormData, showErrors }: Step2PropertyDetailsPart1Props) {
    // Local state for dropdown toggles
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isSubtypeOpen, setIsSubtypeOpen] = useState(false);
    const [isBhkOpen, setIsBhkOpen] = useState(false);

    const [categories, setCategories] = useState<SearchCategory[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    useEffect(() => {
        async function loadCategories() {
            setLoadingCategories(true);
            try {
                const data = await fetchSearchCategories();
                setCategories(data);
            } catch (err) {
                console.error("Failed to load categories:", err);
            } finally {
                setLoadingCategories(false);
            }
        }
        loadCategories();
    }, []);

    const handleSelectCategory = (cat: SearchCategory) => {
        // Map to backward compatible propertyType
        let propertyType = "apartment";
        if (cat.slug === "commercial") propertyType = "commercial";
        else if (cat.slug === "residential") propertyType = "apartment";

        updateFormData({
            searchCategoryId: cat.id,
            propertyType: propertyType,
            searchSubtypeId: undefined, // Reset subtype when category changes
            commercialType: undefined // Reset commercial type
        });
        setIsCategoryOpen(false);
    };

    const handleSelectSubtype = (subId: string, subName: string) => {
        const updates: Partial<FormData> = { searchSubtypeId: subId };

        // Backward compatibility mapping
        const category = categories.find(c => c.id === formData.searchCategoryId);
        if (category?.slug === "commercial") {
            updates.commercialType = subName;
        } else {
            // Map residential subtypes to propertyType
            if (subName.toLowerCase().includes("apartment") || subName.toLowerCase().includes("flat")) updates.propertyType = "Apartment";
            else if (subName.toLowerCase().includes("house")) updates.propertyType = "House";
            else if (subName.toLowerCase().includes("villa")) updates.propertyType = "Villa";
            else if (subName.toLowerCase().includes("land") || subName.toLowerCase().includes("plot")) updates.propertyType = "Plot";
        }

        updateFormData(updates);
        setIsSubtypeOpen(false);
    };

    const handleSelectBhk = (bhk: string) => {
        updateFormData({ bhk });
        setIsBhkOpen(false);
    };

    const selectedCategory = categories.find(c => c.id === formData.searchCategoryId);
    const selectedSubtype = selectedCategory?.subtypes.find(s => s.id === formData.searchSubtypeId);

    // Filter to hide BHK for Land/Plot or Commercial categories
    const hideBHK = formData.propertyType === "Plot" || (selectedCategory?.slug === "commercial");

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-2">
                <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-text-primary">
                    Property Details
                </h3>
                <p className="text-sm md:text-base text-text-secondary mt-1">
                    Tell us the basic details about your property.
                </p>
            </div>

            <div className="flex flex-col gap-6 md:gap-8">
                {/* 1. Sell or Rent (Radio Group) */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-text-primary">
                        Listing Type
                    </label>
                    <div className="flex gap-4">
                        <label className={cn(
                            "flex-1 flex items-center justify-center py-3 rounded-xl border-2 transition-all cursor-pointer",
                            formData.listingType === "Sell"
                                ? "border-primary bg-primary/5 text-primary font-semibold"
                                : "border-border bg-white text-text-secondary hover:border-primary/30 hover:bg-slate-50"
                        )}>
                            <input
                                type="radio"
                                name="listingType"
                                value="Sell"
                                checked={formData.listingType === "Sell"}
                                onChange={(e) => updateFormData({ listingType: e.target.value })}
                                className="sr-only"
                            />
                            Sell
                        </label>
                        <label className={cn(
                            "flex-1 flex items-center justify-center py-3 rounded-xl border-2 transition-all cursor-pointer",
                            formData.listingType === "Rent"
                                ? "border-primary bg-primary/5 text-primary font-semibold"
                                : "border-border bg-white text-text-secondary hover:border-primary/30 hover:bg-slate-50"
                        )}>
                            <input
                                type="radio"
                                name="listingType"
                                value="Rent"
                                checked={formData.listingType === "Rent"}
                                onChange={(e) => updateFormData({ listingType: e.target.value })}
                                className="sr-only"
                            />
                            Rent
                        </label>
                    </div>
                </div>

                {/* 2. Search Category + 3. Property Sub-type — 2-col on md */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative z-[40]">
                    {/* 2. Property Category */}
                    <div className="flex flex-col gap-2 relative z-20">
                        <label className="text-sm font-medium text-text-primary">
                            Property Category
                        </label>
                        <button
                            type="button"
                            onClick={() => {
                                if (loadingCategories) return;
                                setIsCategoryOpen(!isCategoryOpen);
                                setIsSubtypeOpen(false);
                                setIsBhkOpen(false);
                            }}
                            className={cn(
                                "flex items-center justify-between w-full h-12 px-4 bg-white border rounded-xl text-left transition-colors",
                                isCategoryOpen ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50",
                                !formData.searchCategoryId && "text-text-muted"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                {loadingCategories && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                                {selectedCategory?.name || "Select category"}
                            </span>
                            <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform", isCategoryOpen && "rotate-180")} />
                        </button>
                        {isCategoryOpen && categories.length > 0 && (
                            <div className="absolute top-[76px] left-0 w-full bg-white border border-border rounded-xl shadow-lg overflow-hidden py-1 z-30">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => handleSelectCategory(cat)}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        )}
                        {showErrors && !formData.searchCategoryId && (
                            <p className="text-xs text-danger mt-1">Please select a property category.</p>
                        )}
                    </div>

                    {/* 3. Property Sub-type */}
                    <div className="flex flex-col gap-2 relative z-10">
                        <label className="text-sm font-medium text-text-primary">
                            Property Type
                        </label>
                        <button
                            type="button"
                            onClick={() => {
                                if (!formData.searchCategoryId) return;
                                setIsSubtypeOpen(!isSubtypeOpen);
                                setIsCategoryOpen(false);
                                setIsBhkOpen(false);
                            }}
                            disabled={!formData.searchCategoryId}
                            className={cn(
                                "flex items-center justify-between w-full h-12 px-4 bg-white border rounded-xl text-left transition-colors",
                                isSubtypeOpen ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50",
                                !formData.searchSubtypeId && "text-text-muted",
                                !formData.searchCategoryId && "bg-slate-50 opacity-60 cursor-not-allowed"
                            )}
                        >
                            <span>{selectedSubtype?.name || "Select type"}</span>
                            <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform", isSubtypeOpen && "rotate-180")} />
                        </button>
                        {isSubtypeOpen && selectedCategory && (
                            <div className="absolute top-[76px] left-0 w-full bg-white border border-border rounded-xl shadow-lg overflow-hidden py-1 z-30">
                                {selectedCategory.subtypes.map((sub) => (
                                    <button
                                        key={sub.id}
                                        type="button"
                                        onClick={() => handleSelectSubtype(sub.id, sub.name)}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                                    >
                                        {sub.name}
                                    </button>
                                ))}
                            </div>
                        )}
                        {showErrors && !formData.searchSubtypeId && (
                            <p className="text-xs text-danger mt-1">Please select a specific property type.</p>
                        )}
                    </div>
                </div> {/* end Category + Subtype 2-col grid */}

                {/* 3. BHK — Only visible for residential/non-land types */}
                {!hideBHK && (
                    <div className="flex flex-col gap-2 relative z-[30]">
                        <label className="text-sm font-medium text-text-primary">
                            BHK Type
                        </label>
                        <button
                            type="button"
                            onClick={() => {
                                setIsBhkOpen(!isBhkOpen);
                                setIsCategoryOpen(false);
                                setIsSubtypeOpen(false);
                            }}
                            className={cn(
                                "flex items-center justify-between w-full h-12 px-4 bg-white border rounded-xl text-left transition-colors",
                                isBhkOpen ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50",
                                !formData.bhk && "text-text-muted"
                            )}
                        >
                            <span>{formData.bhk || "Select BHK"}</span>
                            <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform", isBhkOpen && "rotate-180")} />
                        </button>
                        {isBhkOpen && (
                            <div className="absolute top-[76px] left-0 w-full bg-white border border-border rounded-xl shadow-lg overflow-hidden py-1 z-30">
                                {BHK_OPTIONS.map((bhk) => (
                                    <button
                                        key={bhk}
                                        type="button"
                                        onClick={() => handleSelectBhk(bhk)}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                                    >
                                        {bhk}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 4. Area + 5. Price + 6. Bathrooms */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative z-[20]">
                    {/* 4. Area (Input) */}
                    <div className="relative">
                        <Input
                            label="Built-up Area"
                            type="number"
                            placeholder="e.g., 1200"
                            min={0}
                            value={formData.area || ""}
                            onChange={(e) => updateFormData({ area: e.target.value })}
                            rightIcon={
                                <select
                                    className="text-sm font-medium text-text-muted bg-transparent border-l border-border h-6 outline-none cursor-pointer pl-2 pr-1 appearance-none"
                                    value={formData.areaUnit || "Sq ft"}
                                    onChange={(e) => updateFormData({ areaUnit: e.target.value })}
                                >
                                    <option value="Sq ft">Sq ft</option>
                                    <option value="Sq yd">Sq yd</option>
                                    <option value="Sq m">Sq m</option>
                                    <option value="Acre">Acre</option>
                                    <option value="Hectare">Hectare</option>
                                </select>
                            }
                            className="h-12 pr-20"
                        />
                        {showErrors && !formData.area && (
                            <p className="text-xs text-danger mt-1">Please enter the area.</p>
                        )}
                    </div>

                    {/* 5. Price (Input) */}
                    <div className="relative">
                        <Input
                            label="Expected Price"
                            type="number"
                            placeholder="e.g., 5000000"
                            min={0}
                            value={formData.price || ""}
                            onChange={(e) => updateFormData({ price: e.target.value })}
                            leftIcon={<span className="text-sm font-medium text-text-muted">₹</span>}
                            className="h-12 pl-8"
                        />
                        {showErrors && !formData.price && (
                            <p className="text-xs text-danger mt-1">Please enter the expected price.</p>
                        )}
                    </div>

                    {/* 6. Bathrooms (Input) */}
                    <div className="relative">
                        <Input
                            label="Bathrooms"
                            type="number"
                            placeholder="e.g., 2"
                            min={0}
                            value={formData.bathrooms || ""}
                            onChange={(e) => updateFormData({ bathrooms: e.target.value })}
                            className="h-12"
                        />
                    </div>
                </div> {/* end Area + Price + Bathrooms grid */}
            </div>
        </div>
    );
}
