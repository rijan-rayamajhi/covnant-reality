import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/supabase/admin-auth";

/**
 * Converts a Supabase storage path to a full public URL.
 * If the value is already a full URL (e.g. starts with http), it passes through unchanged.
 */
async function resolveMediaUrl(supabase: Awaited<ReturnType<typeof createClient>>, path: string): Promise<string> {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("/")) return path;
    const { data } = supabase.storage.from("property-media").getPublicUrl(path);
    return data.publicUrl;
}

/**
 * GET /api/admin/properties?limit=20&offset=0
 * Fetch paginated properties with owner info.
 */
export async function GET(request: NextRequest) {
    const { error: authError } = await verifyAdmin();
    if (authError) {
        return NextResponse.json({ error: authError }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 100);
    const offset = Number(searchParams.get("offset") ?? "0");

    const supabase = await createClient();
    const { data, error, count } = await supabase
        .from("properties")
        .select(
            `
            *,
            profiles!properties_owner_id_fkey ( full_name, role ),
            property_media (*)
        `,
            { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mapped = await Promise.all((data ?? []).map(async (row) => {
        const profile = row.profiles as unknown as { full_name: string; role: string } | null;
        const media = (row.property_media as unknown as { id: string; media_url: string; media_type: string }[]) || [];
        const resolvedMedia = await Promise.all(
            media.map(async (m) => ({
                id: m.id,
                url: await resolveMediaUrl(supabase, m.media_url),
                type: m.media_type,
            }))
        );
        return {
            id: row.id,
            owner_id: row.owner_id,
            title: row.title,
            description: row.description,
            listing_type: row.listing_type,
            property_type: row.property_type,
            commercial_type: row.commercial_type,
            price: row.price,
            area_sqft: row.area_sqft,
            area_unit: row.area_unit || "sq ft",
            bedrooms: row.bedrooms,
            bathrooms: row.bathrooms,
            furnishing: row.furnishing,
            facing: row.facing,
            floor: row.floor,
            total_floors: row.total_floors,
            possession_status: row.possession_status,
            address: row.address,
            locality: row.locality,
            city: row.city,
            state: row.state,
            pincode: row.pincode,
            landmark: row.landmark,
            status: row.status,
            is_verified: row.is_verified,
            is_featured: row.is_featured,
            rera_number: row.rera_number,
            contact_number: row.contact_number,
            whatsapp_number: row.whatsapp_number,
            allow_phone: row.allow_phone,
            allow_whatsapp: row.allow_whatsapp,
            allow_chat: row.allow_chat,
            amenities: row.amenities || [],
            media: resolvedMedia,
            created_at: row.created_at,
            owner_name: profile?.full_name ?? null,
            owner_role: profile?.role ?? null,
        };
    }));

    return NextResponse.json({ data: mapped, totalCount: count ?? 0 });
}

/**
 * POST /api/admin/properties
 * Body: { action: "approve" | "reject", propertyId: string }
 */
export async function POST(request: NextRequest) {
    const { error: authError } = await verifyAdmin();
    if (authError) {
        return NextResponse.json({ error: authError }, { status: 401 });
    }

    const body = await request.json();
    const { action, propertyId } = body as {
        action: string;
        propertyId: string;
    };

    if (!action || !propertyId) {
        return NextResponse.json(
            { error: "Missing action or propertyId" },
            { status: 400 }
        );
    }

    const supabase = await createClient();

    if (action === "approve") {
        const { data, error } = await supabase.rpc("approve_property", {
            p_property_id: propertyId,
        });
        if (error)
            return NextResponse.json({ error: error.message }, { status: 500 });
        const result = data as { success: boolean; error?: string };
        if (!result.success)
            return NextResponse.json(
                { error: result.error ?? "Unknown error" },
                { status: 500 }
            );
        return NextResponse.json({ success: true });
    }

    if (action === "reject") {
        const { data, error } = await supabase.rpc("reject_property", {
            p_property_id: propertyId,
        });
        if (error)
            return NextResponse.json({ error: error.message }, { status: 500 });
        const result = data as { success: boolean; error?: string };
        if (!result.success)
            return NextResponse.json(
                { error: result.error ?? "Unknown error" },
                { status: 500 }
            );
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

/**
 * DELETE /api/admin/properties
 * Body: { propertyId: string }
 */
export async function DELETE(request: NextRequest) {
    const { error: authError } = await verifyAdmin();
    if (authError) {
        return NextResponse.json({ error: authError }, { status: 401 });
    }

    const { propertyId } = await request.json();
    if (!propertyId) {
        return NextResponse.json({ error: "Missing propertyId" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Fetch media for storage deletion
    const { data: mediaRows } = await supabase
        .from("property_media")
        .select("media_url")
        .eq("property_id", propertyId);

    if (mediaRows && mediaRows.length > 0) {
        const paths = (mediaRows as Record<string, string>[])
            .map((m) => m.media_url)
            .filter((p: string) => p && !p.startsWith("http") && !p.startsWith("/"));
        
        if (paths.length > 0) {
            await supabase.storage.from("property-media").remove(paths);
        }
    }

    // 2. Delete the property (cascades to DB media, etc.)
    const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", propertyId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

/**
 * PATCH /api/admin/properties
 * Body: { propertyId: string, updates: Partial<property fields> }
 */
export async function PATCH(request: NextRequest) {
    const { error: authError } = await verifyAdmin();
    if (authError) {
        return NextResponse.json({ error: authError }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, updates } = body as {
        propertyId: string;
        updates: Record<string, unknown>;
    };

    if (!propertyId || !updates) {
        return NextResponse.json({ error: "Missing propertyId or updates" }, { status: 400 });
    }

    // whitelist updatable fields
    const ALLOWED_FIELDS = [
        "title", "description", "listing_type", "property_type", "commercial_type",
        "price", "area_sqft", "area_unit", "bedrooms", "bathrooms", "furnishing",
        "facing", "floor", "total_floors", "possession_status",
        "address", "locality", "city", "state", "pincode", "landmark",
        "rera_number", "contact_number", "whatsapp_number",
        "allow_phone", "allow_whatsapp", "allow_chat", "amenities",
        "is_featured", "is_verified", "status"
    ];

    const safeUpdates = Object.fromEntries(
        Object.entries(updates).filter(([k]) => ALLOWED_FIELDS.includes(k))
    );

    if (Object.keys(safeUpdates).length === 0) {
        return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
        .from("properties")
        .update(safeUpdates)
        .eq("id", propertyId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
