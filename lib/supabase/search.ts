import { createClient } from "@/lib/supabase/client";
import type { SearchProperty, SearchFilters } from "@/types";

export interface SearchResponse {
    data: SearchProperty[];
    total: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getPublicUrl(path: string): string {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("/")) return path;
    const supabase = createClient();
    const { data } = supabase.storage.from("property-media").getPublicUrl(path);
    return data.publicUrl;
}

// ─── Batch-fetch first image for a list of property IDs ─────────────────────

async function fetchPropertyImages(
    propertyIds: string[]
): Promise<Record<string, string>> {
    if (propertyIds.length === 0) return {};
    const supabase = createClient();
    const { data } = await supabase
        .from("property_media")
        .select("property_id, media_url")
        .in("property_id", propertyIds)
        .eq("media_type", "image")
        .order("created_at", { ascending: true });

    const map: Record<string, string> = {};
    for (const row of data ?? []) {
        // Keep only the first image per property
        if (!map[row.property_id]) {
            map[row.property_id] = getPublicUrl(row.media_url);
        }
    }
    return map;
}

// ─── Main Search Function ───────────────────────────────────────────────────

export async function searchProperties(
    filters: SearchFilters,
    limit: number = 12,
    offset: number = 0
): Promise<SearchResponse> {
    const supabase = createClient();

    const { data, error } = await supabase.rpc("search_properties", {
        // When filtering by localityId, don't also filter by city text
        // because `filters.city` contains the locality display name (not the actual city),
        // which would conflict with the city column and return 0 results.
        p_city: filters.localityId ? null : (filters.city ?? null),
        p_city_id: filters.localityId ? null : (filters.cityId ?? null),
        p_state_id: filters.stateId ?? null,
        p_locality_id: filters.localityId ?? null,
        p_bedrooms: filters.bedrooms ?? null,
        p_listing_type: filters.listing_type ?? null,
        p_property_type: filters.property_type ?? null,
        p_is_verified: filters.is_verified ?? null,
        p_agent_id: filters.agentId ?? null,
        p_include_connected: filters.include_connected ?? true,
        p_limit: limit,
        p_offset: offset,
    });

    if (error) {
        throw new Error(error.message);
    }

    const rows = (data ?? []) as SearchProperty[];
    const total =
        rows.length > 0
            ? Number(
                (rows[0] as SearchProperty & { total_count?: number })
                    .total_count ?? 0
            )
            : 0;

    // Batch-fetch images for this page of results
    const ids = rows.map((r) => r.id);
    const imageMap = await fetchPropertyImages(ids);

    const enrichedRows = rows.map((r) => ({
        ...r,
        image_url: imageMap[r.id] ?? null,
    }));

    return {
        data: enrichedRows,
        total,
    };
}
