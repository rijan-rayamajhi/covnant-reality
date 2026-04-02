import type { SupabaseClient } from "@supabase/supabase-js";

/* ── Types ─────────────────────────────────────────────────── */

export interface PropertyFormData {
    role?: string;
    listingType?: string;
    propertyType?: string;
    commercialType?: string;
    bhk?: string;
    area?: string;
    areaUnit?: string;
    price?: string;
    address?: string;
    googleMapsLink?: string;
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
    searchCategoryId?: string;
    searchSubtypeId?: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: Record<string, string>;
}

export interface SubmitResult {
    propertyId: string;
    mediaCount: number;
}

/* ── Furnishing Mapping ───────────────────────────────────── */

const FURNISHING_MAP: Record<string, string> = {
    "Fully-Furnished": "furnished",
    "Semi-Furnished": "semi_furnished",
    "Unfurnished": "unfurnished",
};

/* ── Geocoding ────────────────────────────────────────────── */

/**
 * Geocode an Indian pincode to lat/lon using Nominatim (OpenStreetMap).
 * Returns null if geocoding fails — never blocks property submission.
 */
async function geocodePincode(
    pincode: string
): Promise<{ latitude: number; longitude: number } | null> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(pincode)}&country=India&format=json&limit=1`,
            {
                headers: { "User-Agent": "CovnantReality/1.0" },
                signal: AbortSignal.timeout(5000),
            }
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (!data || data.length === 0) return null;
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (isNaN(lat) || isNaN(lon)) return null;
        return { latitude: lat, longitude: lon };
    } catch {
        return null;
    }
}

/* ── Validation ───────────────────────────────────────────── */

export function validateFormData(formData: PropertyFormData): ValidationResult {
    const errors: Record<string, string> = {};

    if (!formData.role) {
        errors.role = "Please select a role.";
    } else if (formData.role.toLowerCase() === "agent") {
        errors.role = "Agents are not allowed to submit property listings.";
    }

    // Strict State validation
    const ALLOWED_STATES = ["Telangana", "Karnataka", "Maharashtra"];
    if (!formData.state || !ALLOWED_STATES.includes(formData.state)) {
        errors.state = "Property must be located in Telangana, Karnataka, or Maharashtra.";
    }

    if (!formData.listingType) {
        errors.listingType = "Please select listing type (Sell or Rent).";
    }
    if (!formData.propertyType) {
        errors.propertyType = "Please select a property type.";
    }
    if (!formData.price || Number(formData.price) <= 0) {
        errors.price = "Please enter a valid price.";
    }
    if (!formData.area || Number(formData.area) <= 0) {
        errors.area = "Please enter the built-up area.";
    }
    if (!formData.address) {
        errors.address = "Please enter the property address.";
    }
    if (!formData.photos || formData.photos.length === 0) {
        errors.photos = "Please upload at least one property photo.";
    }

    return { valid: Object.keys(errors).length === 0, errors };
}

/* ── FormData → RPC Payload ───────────────────────────────── */

export function mapFormDataToRpcPayload(formData: PropertyFormData) {
    const bedrooms = formData.bhk
        ? parseInt(formData.bhk.split(" ")[0], 10) || null
        : null;

    const listingType = formData.listingType?.toLowerCase() ?? "sell";
    const propertyType = formData.propertyType?.toLowerCase() ?? "apartment";

    const title = [
        formData.bhk,
        formData.propertyType,
        "for",
        formData.listingType === "Rent" ? "Rent" : "Sale",
    ]
        .filter(Boolean)
        .join(" ");

    const description = [
        title,
        formData.locality ? `in ${formData.locality}` : null,
        formData.area ? `${formData.area} ${formData.areaUnit || "Sq ft"}` : null,
        formData.furnishing ? formData.furnishing : null,
        formData.possession ? `Possession: ${formData.possession}` : null,
    ]
        .filter(Boolean)
        .join(" · ");

    const furnishingRaw = formData.furnishing;
    const furnishing = furnishingRaw
        ? FURNISHING_MAP[furnishingRaw] ?? "unfurnished"
        : null;

    return {
        title,
        description,
        listing_type: listingType,
        property_type: propertyType,
        price: Number(formData.price) || 0,
        area_value: Number(formData.area) || 0,
        area_unit: formData.areaUnit || "Sq ft",
        area_sqft: (() => {
            // Needs import of convertToSqft
            // We'll import it at the top of the file
            const value = Number(formData.area) || 0;
            const unit = formData.areaUnit || "Sq ft";
            // Simple inline conversion ratio to avoid circular deps or ensure it runs safely here:
            const toSqft: Record<string, number> = {
                "Sq ft": 1, "Sq yd": 9, "Sq m": 10.7639, "Acre": 43560, "Hectare": 107639
            };
            return value * (toSqft[unit] || 1);
        })(),
        bedrooms,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : null,
        furnishing,
        facing: formData.facing ?? null,
        floor: formData.floor ? Number(formData.floor) : null,
        total_floors: formData.totalFloors ? Number(formData.totalFloors) : null,
        possession_status: formData.possession ?? null,
        address: formData.address ?? "",
        locality: formData.locality ?? null,
        locality_id: formData.localityId ?? null,
        city: formData.city ?? null,
        city_id: formData.cityId ?? null,
        state: formData.state ?? null,
        state_id: formData.stateId ?? null,
        pincode: formData.pincode ?? null,
        rera_number: formData.reraNumber ?? null,
        commercial_type: formData.commercialType ?? null,
        contact_number: formData.contactNumber ?? null,
        whatsapp_number: formData.whatsappNumber ?? null,
        allow_phone: formData.allowPhone ?? true,
        allow_whatsapp: formData.allowWhatsApp ?? true,
        amenities: formData.amenities ?? [],
        search_category_id: formData.searchCategoryId ?? null,
        search_subtype_id: formData.searchSubtypeId ?? null,
    };
}

/* ── Upload Media Files ───────────────────────────────────── */

async function uploadMediaFiles(
    supabase: SupabaseClient,
    userId: string,
    propertyId: string,
    files: File[],
    mediaType: "image" | "video" | "floorplan"
): Promise<string[]> {
    const uploadedPaths: string[] = [];

    for (const file of files) {
        const fileExt = file.name.split(".").pop() ?? "bin";
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${userId}/${propertyId}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("property-media")
            .upload(filePath, file);

        if (uploadError) {
            console.error(`Failed to upload ${file.name}:`, uploadError.message);
            continue; // Skip failed individual uploads
        }

        // Link media in DB
        const { error: mediaError } = await supabase.from("property_media").insert({
            property_id: propertyId,
            media_url: uploadData.path,
            media_type: mediaType,
        });

        if (mediaError) {
            console.error(`Failed to insert media row for ${file.name}:`, mediaError.message);
            // File is uploaded but not linked — acceptable degradation
        }

        uploadedPaths.push(uploadData.path);
    }

    return uploadedPaths;
}

/* ── Main Submit Orchestrator ─────────────────────────────── */

export async function submitProperty(
    supabase: SupabaseClient,
    userId: string,
    formData: PropertyFormData
): Promise<SubmitResult> {
    if (formData.role?.toLowerCase() === "agent") {
        throw new Error("Agents are not allowed to submit property listings.");
    }

    // 1. Build payload & call RPC
    const payload = mapFormDataToRpcPayload(formData);

    const { data: rpcData, error: rpcError } = await supabase.rpc(
        "submit_property",
        { p_property: payload }
    );

    if (rpcError) {
        throw new Error(rpcError.message || "Failed to submit property.");
    }

    if (!rpcData?.success) {
        throw new Error(rpcData?.error || "Property submission was rejected.");
    }

    const propertyId: string = rpcData.property_id;
    
    // 2. Geocode map link or pincode → lat/lon and update the property row
    const processGeocoding = async () => {
        let coords: { latitude: number; longitude: number } | null = null;
        
        if (formData.googleMapsLink) {
            try {
                // Ensure this fetch runs safely in the browser context to the internal Next.js API route
                const apiUrl = typeof window !== "undefined" ? "/api/parse-map-link" : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") + "/api/parse-map-link";
                const res = await fetch(apiUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ link: formData.googleMapsLink })
                });
                if (res.ok) {
                    coords = await res.json();
                }
            } catch (error) {
                console.error("Failed to extract map link coordinates:", error);
            }
        }

        if (!coords && formData.pincode) {
            coords = await geocodePincode(formData.pincode);
        }

        if (coords) {
            await supabase
                .from("properties")
                .update({ latitude: coords.latitude, longitude: coords.longitude })
                .eq("id", propertyId);
        }
    };

    processGeocoding();

    // 3. Upload all media files
    const photos = formData.photos ?? [];
    const videos = formData.videos ?? [];
    const floorPlans = formData.floorPlans ?? [];

    const [photoPaths, videoPaths, floorPaths] = await Promise.all([
        uploadMediaFiles(supabase, userId, propertyId, photos, "image"),
        uploadMediaFiles(supabase, userId, propertyId, videos, "video"),
        uploadMediaFiles(supabase, userId, propertyId, floorPlans, "floorplan"),
    ]);

    const totalUploaded = photoPaths.length + videoPaths.length + floorPaths.length;

    // 3. Rollback if ZERO files uploaded when files were provided
    const totalProvided = photos.length + videos.length + floorPlans.length;
    if (totalProvided > 0 && totalUploaded === 0) {
        // Delete the orphaned property
        await supabase.from("properties").delete().eq("id", propertyId);
        throw new Error(
            "All media uploads failed. Property submission has been rolled back. Please try again."
        );
    }

    return { propertyId, mediaCount: totalUploaded };
}

/* ── Admin Orchestrator ─────────────────────────────── */

export async function submitAdminProperty(
    supabase: SupabaseClient,
    adminId: string,
    targetOwnerId: string,
    formData: PropertyFormData
): Promise<SubmitResult> {

    // 1. Build payload & call Admin RPC
    const payload = mapFormDataToRpcPayload(formData);

    const { data: rpcData, error: rpcError } = await supabase.rpc(
        "admin_submit_property",
        { p_property: payload, p_target_owner_id: targetOwnerId }
    );

    if (rpcError) {
        throw new Error(rpcError.message || "Failed to submit property via admin.");
    }

    if (!rpcData?.success) {
        throw new Error(rpcData?.error || "Admin Property submission was rejected.");
    }

    const propertyId: string = rpcData.property_id;

    // 2. Geocode map link or pincode → lat/lon and update the property row
    const processGeocoding = async () => {
        let coords: { latitude: number; longitude: number } | null = null;
        
        if (formData.googleMapsLink) {
            try {
                const apiUrl = typeof window !== "undefined" ? "/api/parse-map-link" : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") + "/api/parse-map-link";
                const res = await fetch(apiUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ link: formData.googleMapsLink })
                });
                if (res.ok) {
                    coords = await res.json();
                }
            } catch (error) {
                console.error("Failed to extract map link coordinates:", error);
            }
        }

        if (!coords && formData.pincode) {
            coords = await geocodePincode(formData.pincode);
        }

        if (coords) {
            await supabase
                .from("properties")
                .update({ latitude: coords.latitude, longitude: coords.longitude })
                .eq("id", propertyId);
        }
    };

    processGeocoding();

    // 3. Upload all media files using targetOwnerId so paths match ownership
    const photos = formData.photos ?? [];
    const videos = formData.videos ?? [];
    const floorPlans = formData.floorPlans ?? [];

    const [photoPaths, videoPaths, floorPaths] = await Promise.all([
        uploadMediaFiles(supabase, targetOwnerId, propertyId, photos, "image"),
        uploadMediaFiles(supabase, targetOwnerId, propertyId, videos, "video"),
        uploadMediaFiles(supabase, targetOwnerId, propertyId, floorPlans, "floorplan"),
    ]);

    const totalUploaded = photoPaths.length + videoPaths.length + floorPaths.length;

    // 3. Rollback if ZERO files uploaded when files were provided
    const totalProvided = photos.length + videos.length + floorPlans.length;
    if (totalProvided > 0 && totalUploaded === 0) {
        // Delete the orphaned property
        await supabase.from("properties").delete().eq("id", propertyId);
        throw new Error(
            "All media uploads failed. Property submission has been rolled back. Please try again."
        );
    }

    return { propertyId, mediaCount: totalUploaded };
}
