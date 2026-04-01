import { createClient } from "@/lib/supabase/client";
import type { Property, Project, Agent, PropertyType, SearchCategory, SearchSubtype } from "@/types";

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

interface PropertyRow {
    id: string;
    owner_id: string | null;
    title: string | null;
    description: string | null;
    listing_type: "sell" | "rent" | null;
    property_type: string | null;
    commercial_type: string | null;
    price: number | null;
    area_sqft: number | null;
    area_value: number | null;
    area_unit: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
    furnishing: string | null;
    floor: number | null;
    total_floors: number | null;
    facing: string | null;
    possession_status: string | null;
    address: string | null;
    locality: string | null;
    city: string | null;
    state: string | null;
    status: string;
    is_verified: boolean | null;
    is_featured: boolean | null;
    created_at: string | null;
    latitude: number | null;
    longitude: number | null;
    contact_number: string | null;
    whatsapp_number: string | null;
    amenities: string[] | null;
    allow_chat: boolean | null;
    landmark: string | null;
    pincode: string | null;
    localities?: { latitude: number | null; longitude: number | null }[] | null;
    property_media?: { media_url: string; media_type: string }[] | null;
}

export async function fetchCategoryCounts(city?: string): Promise<Record<string, number>> {
    try {
        // Query for ALL properties to debug if nothing is showing up
        const { data: allData, error: allErr } = await supabase()
            .from("properties")
            .select("property_type, status, city");

        if (allErr) {
            console.error("[Homepage] fetchCategoryCounts debug error:", allErr.message);
        } else {
            console.log("[Homepage] Total properties in DB:", allData?.length || 0);
            const statusCounts: Record<string, number> = {};
            (allData as { property_type: string; status: string; city: string }[])?.forEach(p => {
                statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
            });
            console.log("[Homepage] Property statuses:", statusCounts);
        }

        let query = supabase()
            .from("properties")
            .select("property_type")
            .eq("status", "approved");

        if (city) {
            // Use partial matching with wildcards to match the RPC behavior
            query = query.ilike("city", `%${city}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error("[Homepage] fetchCategoryCounts error:", error.message);
            return {};
        }

        const counts: Record<string, number> = {};
        (data as { property_type: string }[] ?? []).forEach((row) => {
            const type = row.property_type;
            if (type) {
                counts[type] = (counts[type] || 0) + 1;
            }
        });

        console.log("[Homepage] Category counts fetched:", { city, counts });
        return counts;
    } catch (err) {
        console.error("[Homepage] fetchCategoryCounts catch error:", err);
        return {};
    }
}

function mapRowToProperty(row: PropertyRow): Property {
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

    const localites = (row.localities as { latitude: number | null; longitude: number | null }[] | undefined);
    const loc = (localites && localites.length > 0) ? localites[0] : null;

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
        type: (row.property_type as PropertyType) || "apartment",
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
        pricePerSqFt: (row.area_sqft && row.area_sqft > 0) ? Math.round(row.price! / row.area_sqft) : null,
        latitude: row.latitude || (loc && loc.latitude) || null,
        longitude: row.longitude || (loc && loc.longitude) || null,
        contactNumber: row.contact_number ?? null,
        whatsappNumber: row.whatsapp_number ?? null,
        amenities: row.amenities ?? [],
        allowChat: row.allow_chat ?? true,
        landmark: row.landmark ?? null,
        pincode: row.pincode ?? null,
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
    address, locality, city, state, status, is_verified, is_featured, created_at,
    latitude, longitude, contact_number, whatsapp_number, amenities, allow_chat, landmark, pincode,
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
    return data ? mapRowToProperty(data as unknown as PropertyRow) : null;
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

    return (data as unknown as PropertyRow[] ?? []).map(row => mapRowToProperty(row));
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

    return (data as unknown as PropertyRow[] ?? []).map(row => mapRowToProperty(row));
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

    return (data as unknown as PropertyRow[] ?? []).map(row => mapRowToProperty(row));
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

    return (data as unknown as PropertyRow[] ?? []).map(row => mapRowToProperty(row));
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

    return (data as unknown as PropertyRow[] ?? []).map(row => mapRowToProperty(row));
}

interface ProjectData {
    id: string;
    name: string | null;
    city: string | null;
    possession_status: string | null;
    rera_number: string | null;
    image_url: string | null;
    builder: { full_name: string | null } | null;
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

    return (data as unknown as ProjectData[] ?? []).map((row) => ({
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

interface AgentData {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    city: string | null;
    is_verified: boolean | null;
    created_at: string | null;
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

    return (data as unknown as AgentData[] ?? []).map((row) => ({
        id: row.id,
        name: row.full_name || "Agent",
        photo: row.avatar_url ? getPublicUrl(row.avatar_url) : "/placeholder-avatar.jpg",
        experienceYears: 0,
        rating: 0,
        reviews: 0,
        operatingLocation: row.city || "Location not set",
    }));
}

// ─── Search Categories Fetcher ──────────────────────────────────────────────

export async function fetchSearchCategories(): Promise<SearchCategory[]> {
    const { data: categories, error: catError } = await supabase()
        .from("search_categories")
        .select(`
            *,
            subtypes:search_subtypes (*)
        `)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

    if (catError) {
        console.error("[Homepage] fetchSearchCategories error:", catError.message);
        return [];
    }

    // Map and ensure subtypes are present and sorted
    return (categories || []).map((cat: SearchCategory) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        is_active: cat.is_active,
        display_order: cat.display_order,
        subtypes: (cat.subtypes || [])
            .filter((s: SearchSubtype) => s.is_active)
            .sort((a: SearchSubtype, b: SearchSubtype) => a.display_order - b.display_order)
    }));
}
