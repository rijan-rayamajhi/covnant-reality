import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/supabase/admin-auth";

/**
 * GET /api/admin/visits?limit=20&offset=0&status=new
 * Fetch paginated leads with source='visit' (site visit bookings),
 * along with property + buyer info.
 */
export async function GET(request: NextRequest) {
    const { error: authError } = await verifyAdmin();
    if (authError) {
        return NextResponse.json({ error: authError }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 100);
    const offset = Number(searchParams.get("offset") ?? "0");
    const status = searchParams.get("status") ?? "";

    const supabase = await createClient();

    let query = supabase
        .from("leads")
        .select(
            `
            id,
            name,
            phone,
            status,
            created_at,
            property:properties!leads_property_id_fkey ( id, title ),
            buyer:profiles!leads_buyer_id_fkey ( full_name, phone )
        `,
            { count: "exact" }
        )
        .eq("source", "visit")
        .order("created_at", { ascending: false });

    if (status) {
        query = query.eq("status", status);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mapped = (data ?? []).map((row: Record<string, unknown>) => {
        const property = row.property as Record<string, unknown> | Record<string, unknown>[] | null;
        const buyer = row.buyer as Record<string, unknown> | Record<string, unknown>[] | null;
        const prop = Array.isArray(property) ? property[0] : property;
        const buy = Array.isArray(buyer) ? buyer[0] : buyer;

        return {
            id: row.id as string,
            name: (row.name as string) ?? null,
            phone: (row.phone as string) ?? null,
            status: row.status as string,
            created_at: row.created_at as string,
            property_id: (prop?.id as string) ?? null,
            property_title: (prop?.title as string) ?? null,
            buyer_name: (buy?.full_name as string) ?? (row.name as string) ?? null,
            buyer_phone: (buy?.phone as string) ?? (row.phone as string) ?? null,
        };
    });

    return NextResponse.json({ data: mapped, totalCount: count ?? 0 });
}

/**
 * PATCH /api/admin/visits
 * Update a visit-lead's status. Body: { visitId, status }
 */
export async function PATCH(request: NextRequest) {
    const { error: authError } = await verifyAdmin();
    if (authError) {
        return NextResponse.json({ error: authError }, { status: 401 });
    }

    const body = await request.json();
    const { visitId, status } = body as { visitId: string; status: string };

    if (!visitId || !status) {
        return NextResponse.json({ error: "visitId and status are required" }, { status: 400 });
    }

    const allowed = ["new", "contacted", "visited", "closed"];
    if (!allowed.includes(status)) {
        return NextResponse.json({ error: `Invalid status. Allowed: ${allowed.join(", ")}` }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
        .from("leads")
        .update({ status })
        .eq("id", visitId)
        .eq("source", "visit");

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
