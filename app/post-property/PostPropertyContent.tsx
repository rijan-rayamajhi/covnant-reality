"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Step1Role } from "./Step1Role";
import { Step2PropertyDetailsPart1 } from "./Step2PropertyDetailsPart1";
import { Step2PropertyDetailsPart2 } from "./Step2PropertyDetailsPart2";
import { Step3MediaUpload } from "./Step3MediaUpload";
import { Step4Amenities } from "./Step4Amenities";
import { Step5ContactPreferences } from "./Step5ContactPreferences";
import { Step6ReviewPublish } from "./Step6ReviewPublish";
import { useSubmitProperty } from "@/hooks/useSubmitProperty";
import { Loader2 } from "lucide-react";
import {
    fetchPropertyForEdit,
    updateProperty,
    type PropertyEditData,
} from "@/lib/supabase/agent-dashboard";
import { mapFormDataToRpcPayload } from "@/lib/supabase/submit-property";
import { useAuth } from "@/components/AuthContext";

export interface FormData {
    role?: string;
    listingType?: string;
    propertyType?: string;
    commercialType?: string;
    bhk?: string;
    area?: string;
    areaUnit?: string;
    price?: string;
    address?: string;
    locality?: string;
    localityId?: string;
    city?: string;
    cityId?: string;
    state?: string;
    stateId?: string;
    pincode?: string;
    landmark?: string;
    bathrooms?: string;
    reraNumber?: string;
    floor?: string;
    totalFloors?: string;
    facing?: string;
    furnishing?: string;
    age?: string;
    possession?: string;
    photos?: File[];
    videos?: File[];
    floorPlans?: File[];
    documents?: File[];
    amenities?: string[];
    allowPhone?: boolean;
    allowWhatsApp?: boolean;
    allowChat?: boolean;
    contactNumber?: string;
    whatsappNumber?: string;
}

/* ── Reverse-map DB values to form values ──────────────────── */

const REVERSE_FURNISHING: Record<string, string> = {
    furnished: "Fully-Furnished",
    semi_furnished: "Semi-Furnished",
    unfurnished: "Unfurnished",
};

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function mapPropertyToFormData(property: PropertyEditData): FormData {
    // Reconstruct BHK string from bedrooms count
    const bhk = property.bedrooms
        ? property.bedrooms >= 5
            ? "5+ BHK"
            : `${property.bedrooms} BHK`
        : undefined;

    // Reverse-map listing type: DB stores "sell"/"rent" → form uses "Sell"/"Rent"
    const listingType = property.listing_type
        ? capitalize(property.listing_type)
        : undefined;

    // Reverse-map property type: DB stores "apartment" → form uses "Apartment"
    const propertyType = property.property_type
        ? capitalize(property.property_type)
        : undefined;

    // Reverse-map furnishing
    const furnishing = property.furnishing
        ? REVERSE_FURNISHING[property.furnishing] ?? property.furnishing
        : undefined;

    return {
        role: "Agent", // Editing from agent panel → always Agent
        listingType,
        propertyType,
        bhk,
        area: property.area_sqft ? String(property.area_sqft) : undefined,
        areaUnit: property.area_unit || undefined,
        price: property.price ? String(property.price) : undefined,
        address: property.address ?? undefined,
        locality: property.locality ?? undefined,
        city: property.city ?? undefined,
        state: property.state ?? undefined,
        bathrooms: property.bathrooms ? String(property.bathrooms) : undefined,
        reraNumber: property.rera_number ?? undefined,
        floor: property.floor ? String(property.floor) : undefined,
        totalFloors: property.total_floors ? String(property.total_floors) : undefined,
        facing: property.facing ?? undefined,
        furnishing,
        possession: property.possession_status ?? undefined,
        amenities: property.amenities ?? undefined,
        commercialType: property.commercial_type ?? undefined,
        allowPhone: property.allow_phone ?? true,
        allowWhatsApp: property.allow_whatsapp ?? true,
        allowChat: property.allow_chat ?? true,
        contactNumber: property.contact_number ?? undefined,
        whatsappNumber: property.whatsapp_number ?? undefined,
        // photos/videos are not loaded back — they exist in DB already
    };
}

export interface PostPropertyContentProps {
    onSuccess?: () => void;
    customSubmit?: (formData: FormData) => Promise<void>;
    bypassRoleRedirect?: boolean;
    initialRole?: string;
}

export function PostPropertyContent({ onSuccess, customSubmit, bypassRoleRedirect, initialRole }: PostPropertyContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("edit");
    const isEditMode = !!editId;

    const { userRole, profile } = useAuth();
    const { submitProperty, isSubmitting: isHookSubmitting, error: submitErrorHook, reset: resetSubmitError } = useSubmitProperty();
    const [isCustomSubmitting, setIsCustomSubmitting] = useState(false);
    const isSubmitting = isHookSubmitting || isCustomSubmitting;
    const [submitCustomError, setSubmitCustomError] = useState<string | null>(null);
    const submitError = submitCustomError || submitErrorHook;
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [showErrorToast, setShowErrorToast] = useState<string | null>(null);
    const [loadingEdit, setLoadingEdit] = useState(isEditMode);
    const [formData, setFormData] = useState<FormData>(() => {
        if (isEditMode) return {}; // Will be loaded from DB
        try {
            if (typeof window !== "undefined") {
                const saved = localStorage.getItem("post_property_draft");
                return saved ? JSON.parse(saved) : {};
            }
            return {};
        } catch {
            return {};
        }
    });
    const [showErrors, setShowErrors] = useState(false);

    // ─── Redirect agents away ───────────────────────────────────────────
    useEffect(() => {
        if (!bypassRoleRedirect && userRole === "agent") {
            router.replace("/agent");
        }
    }, [userRole, router, bypassRoleRedirect]);

    // ─── Auto-skip step 1 ───────────────────────────────────────────
    useEffect(() => {
        if (!isEditMode) {
            if (initialRole) {
                setFormData((prev) => ({ ...prev, role: initialRole }));
                setCurrentStep((prev) => (prev === 1 ? 2 : prev));
            } else if (userRole === "owner" || userRole === "admin") {
                setFormData((prev) => ({ ...prev, role: "Owner" }));
                setCurrentStep((prev) => (prev === 1 ? 2 : prev));
            }
        }
    }, [userRole, isEditMode, initialRole]);

    // ─── Auto-fill contact number from profile ───────────────────
    useEffect(() => {
        if (!isEditMode && profile?.phone && !formData.contactNumber) {
            const cleanPhone = profile.phone.replace(/\D/g, "").slice(-10);
            if (cleanPhone.length === 10) {
                setFormData((prev) => {
                    // Double check inside to avoid unnecessary updates if contactNumber was just set
                    if (prev.contactNumber) return prev;
                    return {
                        ...prev,
                        contactNumber: cleanPhone,
                        whatsappNumber: prev.whatsappNumber || cleanPhone,
                    };
                });
            }
        }
    }, [profile, isEditMode, formData.contactNumber]);

    // ─── Load property data when in edit mode ──────────────────────
    const loadPropertyForEdit = useCallback(async () => {
        if (!editId) return;
        setLoadingEdit(true);
        const property = await fetchPropertyForEdit(editId);
        if (property) {
            setFormData(mapPropertyToFormData(property));
            // Skip step 1 (role selection) in edit mode — go straight to details
            setCurrentStep(2);
        } else {
            setShowErrorToast("Failed to load property data. The property may not exist or you don't have access.");
            setTimeout(() => setShowErrorToast(null), 6000);
        }
        setLoadingEdit(false);
    }, [editId]);

    useEffect(() => {
        if (isEditMode) {
            loadPropertyForEdit();
        }
    }, [isEditMode, loadPropertyForEdit]);

    // Persist to localStorage on every change (skip edit mode & File objects)
    useEffect(() => {
        if (isEditMode) return;
        try {
            const serializable = { ...formData };
            delete serializable.photos;
            delete serializable.videos;
            delete serializable.floorPlans;
            delete serializable.documents;

            localStorage.setItem("post_property_draft", JSON.stringify(serializable));
        } catch {
            // Ignore serialization errors
        }
    }, [formData, isEditMode]);

    const updateFormData = (data: Partial<FormData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
    };

    const totalSteps = 6;

    // Simplified per-step validation — only the fields user specified
    const isStep1Valid = !!formData.role;
    const isStep2Valid = !!formData.propertyType && !!formData.price && !!formData.area && !!formData.state;
    // In edit mode, photos are already uploaded, so step 3 is optional
    const isStep3Valid = isEditMode || (formData.photos && formData.photos.length > 0);
    const isStep6Valid = true;

    const isStepValid = () => {
        if (currentStep === 1) return isStep1Valid;
        if (currentStep === 2) return isStep2Valid;
        if (currentStep === 3) return isStep3Valid;
        if (currentStep === 6) return isStep6Valid;
        return true;
    };

    const handleNext = async () => {
        if (!isStepValid()) {
            setShowErrors(true);
            return;
        }
        setShowErrors(false);
        if (currentStep < totalSteps) {
            setCurrentStep((prev) => prev + 1);
        } else {
            // Final step — submit or update
            resetSubmitError();
            setSubmitCustomError(null);
            setShowErrorToast(null);

            try {
                if (isEditMode && editId) {
                    // ─── UPDATE mode ─────────────────────────────────────
                    const payload = mapFormDataToRpcPayload(formData);
                    const result = await updateProperty(editId, payload);
                    if (!result.success) {
                        throw new Error(result.error ?? "Failed to update property.");
                    }

                    // If new photos were added, upload them too
                    if (formData.photos && formData.photos.length > 0) {
                        await submitProperty(formData);
                    }

                    setShowSuccessToast(true);
                    setTimeout(() => {
                        setShowSuccessToast(false);
                        router.push("/agent/listings");
                    }, 2000);
                } else {
                    // ─── CREATE mode ─────────────────────────────────────
                    if (customSubmit) {
                        setIsCustomSubmitting(true);
                        try {
                            await customSubmit(formData);
                            localStorage.removeItem("post_property_draft");
                            setShowSuccessToast(true);
                            setTimeout(() => {
                                setShowSuccessToast(false);
                                if (onSuccess) {
                                    onSuccess();
                                } else {
                                    router.push("/admin/properties");
                                }
                            }, 3000);
                        } catch (err) {
                            const message = err instanceof Error ? err.message : "An unexpected error occurred.";
                            setSubmitCustomError(message);
                            throw err; // Let the outer catch handle the toast
                        } finally {
                            setIsCustomSubmitting(false);
                        }
                    } else {
                        await submitProperty(formData);
                        localStorage.removeItem("post_property_draft");
                        setShowSuccessToast(true);
                        setTimeout(() => {
                            setShowSuccessToast(false);
                            if (onSuccess) {
                                onSuccess();
                            } else {
                                router.push(userRole === "admin" ? "/admin/properties" : "/dashboard");
                            }
                        }, 3000);
                    }
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : "An unexpected error occurred.";
                setShowErrorToast(message);
                setTimeout(() => setShowErrorToast(null), 6000);
            }
        }
    };

    const handleBack = () => {
        setShowErrors(false);
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    // ─── Loading state for edit mode ────────────────────────────
    if (loadingEdit) {
        return (
            <div className="min-h-[calc(100vh-120px)] w-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-sm text-text-secondary">Loading property details…</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-120px)] w-full py-6 px-4 md:py-8 md:px-6 lg:py-10 lg:px-8 xl:px-10">
            <div className="w-full max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
                {/* Header Section */}
                <div className="mb-6 md:mb-8 text-center">
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-text-primary">
                        {isEditMode ? "Edit Your Property" : "Post Your Property"}
                    </h1>
                    <p className="text-sm md:text-base text-text-secondary mt-2">
                        {isEditMode
                            ? "Update your property details below."
                            : "Add details to list your property and reach out to thousands of buyers."
                        }
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                    {/* Step Indicator */}
                    <nav className="bg-slate-50/50 pt-2 px-2 sm:px-6 md:px-8 lg:px-10" aria-label="Form progress">
                        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
                    </nav>

                    {/* Step Content Area */}
                    <div className="p-5 md:p-8 lg:p-10 min-h-[400px]">
                        {currentStep === 1 && (
                            <Step1Role formData={formData} updateFormData={updateFormData} showErrors={showErrors} />
                        )}

                        {currentStep === 2 && (
                            <div className="flex flex-col gap-8 lg:gap-10">
                                <Step2PropertyDetailsPart1 formData={formData} updateFormData={updateFormData} showErrors={showErrors} />
                                <div className="h-px bg-border w-full" />
                                <Step2PropertyDetailsPart2 formData={formData} updateFormData={updateFormData} />
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div>
                                {isEditMode && (
                                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
                                        📸 Your existing photos are already saved. You can add more below if needed, or skip this step.
                                    </div>
                                )}
                                <Step3MediaUpload formData={formData} updateFormData={updateFormData} showErrors={showErrors && !isEditMode} />
                            </div>
                        )}

                        {currentStep === 4 && (
                            <Step4Amenities formData={formData} updateFormData={updateFormData} />
                        )}

                        {currentStep === 5 && (
                            <Step5ContactPreferences formData={formData} updateFormData={updateFormData} />
                        )}

                        {currentStep === 6 && (
                            <Step6ReviewPublish formData={formData} />
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="p-5 md:p-8 lg:p-10 border-t border-border bg-slate-50/50">
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:justify-end lg:max-w-sm lg:ml-auto">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                disabled={currentStep === 1 || (isEditMode && currentStep === 2) || (!isEditMode && userRole === "owner" && currentStep === 2)}
                                className="w-full sm:w-1/3 h-12"
                            >
                                Back
                            </Button>
                            <Button
                                type="button"
                                onClick={handleNext}
                                className="w-full sm:flex-1 h-12"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {isEditMode ? "Updating…" : "Submitting…"}
                                    </span>
                                ) : currentStep === totalSteps ? (isEditMode ? "Update" : "Publish") : "Next"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Toast */}
            {showSuccessToast && (
                <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-8 duration-300">
                    <div className="bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-semibold">
                                {isEditMode ? "Property Updated Successfully" : (userRole === "admin" ? "Property Published Successfully" : "Property Submitted — Pending Approval")}
                            </p>
                            <p className="text-emerald-50 text-xs">
                                {isEditMode
                                    ? "Redirecting to your listings…"
                                    : (userRole === "admin" ? "Your property is live! Redirecting to admin panel…" : "Our team will review your listing. Redirecting to Dashboard…")
                                }
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Toast */}
            {(showErrorToast || submitError) && (
                <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-8 duration-300">
                    <div className="bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 max-w-md">
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-semibold">
                                {isEditMode ? "Update Failed" : "Submission Failed"}
                            </p>
                            <p className="text-red-50 text-xs">{showErrorToast || submitError}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
