import { createClient } from "@/lib/supabase/client";
import type { Property, Project, Agent } from "@/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function supabase() {
    return createClient();
}

function getPublicUrl(path: string): string {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("/")) return path;
    const { data } = supabase().storage.from("property-media").getPublicUrl(path);
    return data.publicUrl;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToProperty(row: any): Property {
    const media = (row.property_media || []) as { media_url: string; media_type: string }[];
    const imageUrls = media
        .filter((m) => m.media_type === "image" || !m.media_type)
        .map((m) => getPublicUrl(m.media_url));
    const videoUrls = media
        .filter((m) => m.media_type === "video")
        .map((m) => getPublicUrl(m.media_url));
    const floorPlanUrls = media
        .filter((m) => m.media_type === "floorplan")
        .map((m) => getPublicUrl(m.media_url));
    const primaryImage = imageUrls[0] || "/placeholder-property.jpg";

    return {
        id: row.id,
        title: row.title || "Untitled Property",
        description: row.description || "",
        price: row.price ?? 0,
        location: row.address || row.locality || "",
        city: row.city || "",
        state: row.state || "",
        bedrooms: row.bedrooms ?? 0,
        bathrooms: row.bathrooms ?? 0,
        area: row.area_sqft ?? 0,
        area_value: row.area_value ?? row.area_sqft ?? 0,
        area_unit: row.area_unit ?? "Sq ft",
        image: primaryImage,
        images: imageUrls.length > 0 ? imageUrls : [primaryImage],
        videos: videoUrls,
        type: row.property_type || "apartment",
        listed: row.created_at || new Date().toISOString(),
        featured: row.is_featured ?? false,
        verified: row.is_verified ?? false,
        badge: row.listing_type === "rent" ? "rent" : undefined,
        // Detail-page extras
        furnishing: row.furnishing ?? null,
        floor: row.floor ?? null,
        totalFloors: row.total_floors ?? null,
        facing: row.facing ?? null,
        possessionStatus: row.possession_status ?? null,
        listingType: row.listing_type ?? "sell",
        ownerId: row.owner_id ?? null,
        commercialType: row.commercial_type ?? null,
        pricePerSqFt: (row.area_sqft && row.area_sqft > 0) ? Math.round(row.price / row.area_sqft) : null,
        latitude: row.latitude || row.localities?.latitude || null,
        longitude: row.longitude || row.localities?.longitude || null,
        contactNumber: row.contact_number ?? null,
        whatsappNumber: row.whatsapp_number ?? null,
        amenities: row.amenities ?? [],
        allowChat: row.allow_chat ?? true,
        landmark: row.landmark ?? null,
        floorPlans: floorPlanUrls,
    };
}

export async function fetchOwnerProfile(ownerId: string): Promise<{ name: string; avatar: string; role: string } | null> {
    if (!ownerId) return null;
    const { data, error } = await supabase()
        .from("profiles")
        .select("full_name, avatar_url, role")
        .eq("id", ownerId)
        .single();
    if (error) return null;
    return {
        name: data.full_name || "Property Owner",
        avatar: data.avatar_url ? getPublicUrl(data.avatar_url) : "",
        role: data.role || "agent",
    };
}

// ─── Property Fetchers ──────────────────────────────────────────────────────

const PROPERTY_SELECT = `
    id, owner_id, title, description, listing_type, property_type, commercial_type,
    price, area_sqft, area_value, area_unit, bedrooms, bathrooms,
    furnishing, floor, total_floors, facing, possession_status,
    address, locality, city, state, status, is_verified, created_at,
    latitude, longitude, contact_number, whatsapp_number, amenities, allow_chat, landmark,
    localities ( latitude, longitude ),
    property_media ( media_url, media_type )
`;

export async function fetchPropertyById(id: string): Promise<Property | null> {
    if (!id) return null;
    const { data, error } = await supabase()
        .from("properties")
        .select(PROPERTY_SELECT)
        .eq("id", id)
        .single();

    if (error) {
        console.error("[Homepage] fetchPropertyById error:", error.message);
        return null;
    }
    return data ? mapRowToProperty(data) : null;
}

export async function fetchPremiumProperties(limit = 6, city?: string): Promise<Property[]> {
    let query = supabase()
        .from("properties")
        .select(PROPERTY_SELECT)
        .eq("status", "approved")
        .gt("price", 15000000);

    if (city) query = query.ilike("city", city);

    const { data, error } = await query
        .order("price", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("[Homepage] fetchPremiumProperties error:", error.message);
        return [];
    }

    return (data ?? []).map(mapRowToProperty);
}

export async function fetchVerifiedProperties(limit = 6, city?: string): Promise<Property[]> {
    let query = supabase()
        .from("properties")
        .select(PROPERTY_SELECT)
        .eq("status", "approved")
        .eq("is_verified", true);

    if (city) query = query.ilike("city", city);

    const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("[Homepage] fetchVerifiedProperties error:", error.message);
        return [];
    }

    return (data ?? []).map(mapRowToProperty);
}

export async function fetchRecentProperties(limit = 8, city?: string): Promise<Property[]> {
    let query = supabase()
        .from("properties")
        .select(PROPERTY_SELECT)
        .eq("status", "approved");

    if (city) query = query.ilike("city", city);

    const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("[Homepage] fetchRecentProperties error:", error.message);
        return [];
    }

    return (data ?? []).map(mapRowToProperty);
}

export async function fetchAffordableRentals(limit = 6, city?: string): Promise<Property[]> {
    let query = supabase()
        .from("properties")
        .select(PROPERTY_SELECT)
        .eq("status", "approved")
        .eq("listing_type", "rent");

    if (city) query = query.ilike("city", city);

    const { data, error } = await query
        .order("price", { ascending: true })
        .limit(limit);

    if (error) {
        console.error("[Homepage] fetchAffordableRentals error:", error.message);
        return [];
    }

    return (data ?? []).map(mapRowToProperty);
}

export async function fetchRecommendedProperties(limit = 6, city?: string): Promise<Property[]> {
    let query = supabase()
        .from("properties")
        .select(PROPERTY_SELECT)
        .eq("status", "approved");

    if (city) query = query.ilike("city", city);

    const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("[Homepage] fetchRecommendedProperties error:", error.message);
        return [];
    }

    return (data ?? []).map(mapRowToProperty);
}

// ─── Projects Fetcher ───────────────────────────────────────────────────────

export async function fetchFeaturedProjects(limit = 6, city?: string): Promise<Project[]> {
    let query = supabase()
        .from("projects")
        .select(`
            id, 
            name, 
            city, 
            possession_status, 
            rera_number,
            image_url,
            builder:profiles!builder_id ( full_name )
        `);

    if (city) query = query.ilike("city", city);

    const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("[Homepage] fetchFeaturedProjects error:", error.message);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => ({
        id: row.id,
        name: row.name || "Untitled Project",
        builder: row.builder?.full_name || "Unknown Builder",
        location: row.city || "",
        city: row.city || "",
        startingPrice: 0,
        possessionStatus: row.possession_status || "Under Construction",
        reraBadge: row.rera_number || "",
        image: row.image_url ? getPublicUrl(row.image_url) : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    }));
}

// ─── Agents Fetcher ─────────────────────────────────────────────────────────

export async function fetchTopAgents(limit = 8, city?: string): Promise<Agent[]> {
    let query = supabase()
        .from("profiles")
        .select("id, full_name, avatar_url, city, is_verified, created_at")
        .eq("role", "agent");

    if (city) query = query.ilike("city", city);

    const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("[Homepage] fetchTopAgents error:", error.message);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => ({
        id: row.id,
        name: row.full_name || "Agent",
        photo: row.avatar_url ? getPublicUrl(row.avatar_url) : "/placeholder-avatar.jpg",
        experienceYears: 0,
        rating: 0,
        reviews: 0,
        operatingLocation: row.city || "Location not set",
    }));
}
