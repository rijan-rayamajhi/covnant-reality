import { createClient } from "@/lib/supabase/client";

// ─── Helpers ────────────────────────────────────────────────────────────────

function supabase() {
    return createClient();
}

// ─── Types ──────────────────────────────────────────────────────────────────

export type FloorPlanRequestStatus = "pending" | "approved" | "rejected";

export interface FloorPlanRequest {
    id: string;
    property_id: string;
    requester_id: string;
    status: FloorPlanRequestStatus;
    created_at: string;
    updated_at: string;
    // Joined fields
    requester_name?: string;
    requester_email?: string;
    property_title?: string;
}

// ─── Buyer/Tenant Functions ─────────────────────────────────────────────────

/**
 * Get the current user's floor plan request status for a specific property.
 * Returns null if no request exists.
 */
export async function getFloorPlanRequestStatus(
    propertyId: string
): Promise<FloorPlanRequestStatus | null> {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase()
        .from("floor_plan_requests")
        .select("status")
        .eq("property_id", propertyId)
        .eq("requester_id", user.id)
        .maybeSingle();

    if (error) {
        console.error("[FloorPlanRequests] getStatus error:", error.message);
        return null;
    }

    return (data?.status as FloorPlanRequestStatus) ?? null;
}

/**
 * Submit a floor plan access request for the current user.
 */
export async function requestFloorPlanAccess(
    propertyId: string
): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) return { success: false, error: "You must be logged in to request floor plan access." };

    const { error } = await supabase()
        .from("floor_plan_requests")
        .insert({
            property_id: propertyId,
            requester_id: user.id,
            status: "pending",
        });

    if (error) {
        // Unique constraint violation = already requested
        if (error.code === "23505") {
            return { success: false, error: "You have already requested access to this floor plan." };
        }
        console.error("[FloorPlanRequests] request error:", error.message);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// ─── Owner/Admin Functions ──────────────────────────────────────────────────

/**
 * Fetch all floor plan requests for properties owned by the current user.
 * Used in the owner dashboard.
 */
export async function fetchOwnerFloorPlanRequests(): Promise<FloorPlanRequest[]> {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase()
        .from("floor_plan_requests")
        .select(`
            id, property_id, requester_id, status, created_at, updated_at,
            properties!inner ( title, owner_id ),
            profiles!floor_plan_requests_requester_id_fkey ( full_name, email )
        `)
        .eq("properties.owner_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[FloorPlanRequests] fetchOwner error:", error.message);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => ({
        id: row.id,
        property_id: row.property_id,
        requester_id: row.requester_id,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        requester_name: row.profiles?.full_name || "Unknown User",
        requester_email: row.profiles?.email || "",
        property_title: row.properties?.title || "Untitled Property",
    }));
}

/**
 * Fetch ALL floor plan requests (admin view).
 */
export async function fetchAllFloorPlanRequests(): Promise<FloorPlanRequest[]> {
    const { data, error } = await supabase()
        .from("floor_plan_requests")
        .select(`
            id, property_id, requester_id, status, created_at, updated_at,
            properties ( title ),
            profiles!floor_plan_requests_requester_id_fkey ( full_name, email )
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[FloorPlanRequests] fetchAll error:", error.message);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => ({
        id: row.id,
        property_id: row.property_id,
        requester_id: row.requester_id,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        requester_name: row.profiles?.full_name || "Unknown User",
        requester_email: row.profiles?.email || "",
        property_title: row.properties?.title || "Untitled Property",
    }));
}

/**
 * Approve a floor plan request.
 */
export async function approveFloorPlanRequest(
    requestId: string
): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase()
        .from("floor_plan_requests")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", requestId);

    if (error) {
        console.error("[FloorPlanRequests] approve error:", error.message);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Reject a floor plan request.
 */
export async function rejectFloorPlanRequest(
    requestId: string
): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase()
        .from("floor_plan_requests")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", requestId);

    if (error) {
        console.error("[FloorPlanRequests] reject error:", error.message);
        return { success: false, error: error.message };
    }

    return { success: true };
}
