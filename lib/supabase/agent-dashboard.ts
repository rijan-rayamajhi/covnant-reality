import { createClient } from "@/lib/supabase/client";

export { createClient };

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

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AgentListingRow {
    id: string;
    title: string;
    description: string | null;
    listing_type: string;
    property_type: string;
    price: number;
    area_sqft: number;
    bedrooms: number | null;
    bathrooms: number | null;
    furnishing: string | null;
    address: string;
    locality: string | null;
    city: string;
    status: string;
    is_verified: boolean;
    created_at: string;
    property_media: { media_url: string; media_type: string }[];
    views_count: number;
    leads_count: number;
}

export interface AgentLeadRow {
    id: string;
    name: string | null;
    phone: string | null;
    source: string;
    status: string;
    created_at: string;
    property: { id: string; title: string } | null;
    buyer: { id: string; full_name: string | null } | null;
}

export interface FollowUpRow {
    id: string;
    agent_id: string;
    lead_id: string | null;
    lead_name: string;
    reminder_type: "call" | "meeting" | "whatsapp";
    scheduled_at: string;
    completed: boolean;
    created_at: string;
}

export interface AgentMeetingRow {
    id: string;
    property_id: string;
    visit_date: string;
    visit_time: string;
    status: string;
    created_at: string;
    property: { id: string; title: string; address?: string; city?: string } | null;
    buyer: { id: string; full_name: string | null } | null;
}

export interface AgentPerformanceData {
    totalViews: number;
    totalLeads: number;
    closedLeads: number;
    conversionRate: number;
    totalListings: number;
    activeListings: number;
}



export interface AgentProfileRow {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    role: string | null;
    created_at: string;
}

// ─── Fetch single property for editing ──────────────────────────────────────

export interface PropertyEditData {
    id: string;
    title: string;
    description: string | null;
    listing_type: string;
    property_type: string;
    price: number;
    area_sqft: number;
    area_value?: number;
    area_unit?: string;
    bedrooms: number | null;
    bathrooms: number | null;
    furnishing: string | null;
    facing: string | null;
    floor: number | null;
    total_floors: number | null;
    possession_status: string | null;
    address: string;
    locality: string | null;
    city: string;
    state: string | null;
    rera_number: string | null;
    commercial_type: string | null;
    amenities: string[] | null;
    allow_phone: boolean;
    allow_whatsapp: boolean;
    allow_chat: boolean;
    contact_number: string | null;
    whatsapp_number: string | null;
    search_category_id: string | null;
    search_subtype_id: string | null;
    property_media: { media_url: string; media_type: string }[];
}

export async function fetchPropertyForEdit(propertyId: string): Promise<PropertyEditData | null> {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase()
        .from("properties")
        .select(`
            id, title, description, listing_type, property_type,
            price, area_sqft, area_value, area_unit, bedrooms, bathrooms, furnishing,
            facing, floor, total_floors, possession_status,
            address, locality, city, state, rera_number, commercial_type,
            amenities, allow_phone, allow_whatsapp, allow_chat,
            contact_number, whatsapp_number,
            search_category_id, search_subtype_id,
            property_media ( media_url, media_type )
        `)
        .eq("id", propertyId)
        .eq("owner_id", user.id)
        .single();

    if (error || !data) {
        console.error("[AgentDashboard] fetchPropertyForEdit error:", error?.message);
        return null;
    }

    return {
        ...(data as unknown as PropertyEditData),
        property_media: ((data as unknown as PropertyEditData).property_media || []).map(m => ({
            ...m,
            media_url: getPublicUrl(m.media_url),
        })),
    };
}

export async function updateProperty(
    propertyId: string,
    updates: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { error } = await supabase()
        .from("properties")
        .update(updates)
        .eq("id", propertyId)
        .eq("owner_id", user.id);

    if (error) {
        console.error("[AgentDashboard] updateProperty error:", error.message);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// ─── Listings ───────────────────────────────────────────────────────────────

export async function fetchAgentListings(): Promise<AgentListingRow[]> {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) return [];

    // Fetch properties owned by this agent
    const { data: properties, error } = await supabase()
        .from("properties")
        .select(`
            id, title, description, listing_type, property_type,
            price, area_sqft, bedrooms, bathrooms, furnishing,
            address, locality, city, status, is_verified, created_at,
            property_media ( media_url, media_type )
        `)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[AgentDashboard] fetchAgentListings error:", error.message);
        return [];
    }

    if (!properties || properties.length === 0) return [];

    const propertyIds = properties.map((p) => p.id);

    // Count views per property
    const { data: viewCounts } = await supabase()
        .from("property_views")
        .select("property_id")
        .in("property_id", propertyIds);

    const viewMap: Record<string, number> = {};
    (viewCounts ?? []).forEach((v: { property_id: string }) => {
        viewMap[v.property_id] = (viewMap[v.property_id] || 0) + 1;
    });

    // Count leads per property
    const { data: leadCounts } = await supabase()
        .from("leads")
        .select("property_id")
        .in("property_id", propertyIds);

    const leadMap: Record<string, number> = {};
    (leadCounts ?? []).forEach((l: { property_id: string }) => {
        leadMap[l.property_id] = (leadMap[l.property_id] || 0) + 1;
    });

    return (properties as unknown as Omit<AgentListingRow, "views_count" | "leads_count">[]).map((p) => ({
        ...p,
        property_media: (p.property_media || []).map(m => ({
            ...m,
            media_url: getPublicUrl(m.media_url)
        })),
        views_count: viewMap[p.id] || 0,
        leads_count: leadMap[p.id] || 0,
    }));
}


export async function deleteProperty(propertyId: string): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    // Delete related media files from storage first
    const { data: mediaRows } = await supabase()
        .from("property_media")
        .select("media_url")
        .eq("property_id", propertyId);

    if (mediaRows && mediaRows.length > 0) {
        const paths = mediaRows
            .map((m: { media_url: string }) => m.media_url)
            .filter((p: string) => p && !p.startsWith("http") && !p.startsWith("/"));
        if (paths.length > 0) {
            await supabase().storage.from("property-media").remove(paths);
        }
    }

    // Delete media rows
    await supabase().from("property_media").delete().eq("property_id", propertyId);

    // Delete property views
    await supabase().from("property_views").delete().eq("property_id", propertyId);

    // Delete the property itself
    const { error } = await supabase()
        .from("properties")
        .delete()
        .eq("id", propertyId)
        .eq("owner_id", user.id);

    if (error) {
        console.error("[AgentDashboard] deleteProperty error:", error.message);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function updatePropertyStatus(
    propertyId: string,
    status: string
): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { error } = await supabase()
        .from("properties")
        .update({ status })
        .eq("id", propertyId)
        .eq("owner_id", user.id);

    if (error) {
        console.error("[AgentDashboard] updatePropertyStatus error:", error.message);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function cloneProperty(propertyId: string): Promise<{ success: boolean; newId?: string; error?: string }> {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    // Fetch the original property
    const { data: original, error: fetchError } = await supabase()
        .from("properties")
        .select("title, description, listing_type, property_type, commercial_type, price, area_sqft, bedrooms, bathrooms, furnishing, facing, floor, total_floors, possession_status, address, locality, city, state, rera_number, amenities, allow_phone, allow_whatsapp, allow_chat, contact_number, whatsapp_number")
        .eq("id", propertyId)
        .eq("owner_id", user.id)
        .single();

    if (fetchError || !original) {
        console.error("[AgentDashboard] cloneProperty fetch error:", fetchError?.message);
        return { success: false, error: fetchError?.message ?? "Property not found" };
    }

    // Insert cloned property with "pending" status
    const { data: newProp, error: insertError } = await supabase()
        .from("properties")
        .insert({
            ...original,
            title: `${original.title} (Copy)`,
            owner_id: user.id,
            status: "pending",
            is_verified: false,
        })
        .select("id")
        .single();

    if (insertError || !newProp) {
        console.error("[AgentDashboard] cloneProperty insert error:", insertError?.message);
        return { success: false, error: insertError?.message ?? "Failed to clone property" };
    }

    return { success: true, newId: newProp.id };
}

// ─── Leads ──────────────────────────────────────────────────────────────────

export async function fetchAgentLeads(): Promise<AgentLeadRow[]> {
    const { data, error } = await supabase()
        .from("leads")
        .select(`
            id, name, phone, source, status, created_at,
            property:properties ( id, title ),
            buyer:profiles!leads_buyer_id_fkey ( id, full_name )
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[AgentDashboard] fetchAgentLeads error:", error.message);
        return [];
    }

    return (data ?? []) as unknown as AgentLeadRow[];
}

export async function updateLeadStatus(
    leadId: string,
    status: string
): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase().rpc("update_lead_status", {
        p_lead_id: leadId,
        p_status: status,
    });

    if (error) {
        console.error("[AgentDashboard] updateLeadStatus error:", error.message);
        return { success: false, error: error.message };
    }

    const result = data as { success: boolean; error?: string };
    return result;
}

// ─── Follow-ups ─────────────────────────────────────────────────────────────

export async function fetchFollowUps(): Promise<FollowUpRow[]> {
    const { data, error } = await supabase()
        .from("followups")
        .select("id, agent_id, lead_id, lead_name, reminder_type, scheduled_at, completed, created_at")
        .eq("completed", false)
        .order("scheduled_at", { ascending: true });

    if (error) {
        console.error("[AgentDashboard] fetchFollowUps error:", error.message);
        return [];
    }

    return (data ?? []) as FollowUpRow[];
}

export async function addFollowUp(input: {
    lead_name: string;
    reminder_type: "call" | "meeting" | "whatsapp";
    scheduled_at: string;
    lead_id?: string;
}): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { error } = await supabase()
        .from("followups")
        .insert({
            agent_id: user.id,
            lead_name: input.lead_name,
            reminder_type: input.reminder_type,
            scheduled_at: input.scheduled_at,
            lead_id: input.lead_id ?? null,
        });

    if (error) {
        console.error("[AgentDashboard] addFollowUp error:", error.message);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function markFollowUpDone(followUpId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase()
        .from("followups")
        .update({ completed: true })
        .eq("id", followUpId);

    if (error) {
        console.error("[AgentDashboard] markFollowUpDone error:", error.message);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// ─── Meetings (Site Visits) ─────────────────────────────────────────────────

export async function fetchAgentMeetings(): Promise<AgentMeetingRow[]> {
    const { data, error } = await supabase()
        .from("site_visits")
        .select(`
            id, property_id, visit_date, visit_time, status, created_at,
            property:properties ( id, title, address, city ),
            buyer:profiles!site_visits_buyer_id_fkey ( id, full_name )
        `)
        .in("status", ["requested", "confirmed"])
        .order("visit_date", { ascending: true });

    if (error) {
        console.error("[AgentDashboard] fetchAgentMeetings error:", error.message);
        return [];
    }

    return (data ?? []) as unknown as AgentMeetingRow[];
}

// ─── Performance ────────────────────────────────────────────────────────────

export async function fetchAgentPerformance(): Promise<AgentPerformanceData> {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) {
        return { totalViews: 0, totalLeads: 0, closedLeads: 0, conversionRate: 0, totalListings: 0, activeListings: 0 };
    }

    // Total listings count
    const { count: totalListings } = await supabase()
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user.id);

    // Active listings count
    const { count: activeListings } = await supabase()
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user.id)
        .eq("status", "approved");

    // Get property IDs for this agent
    const { data: propIds } = await supabase()
        .from("properties")
        .select("id")
        .eq("owner_id", user.id);

    const ids = (propIds ?? []).map((p: { id: string }) => p.id);

    let totalViews = 0;
    if (ids.length > 0) {
        const { count } = await supabase()
            .from("property_views")
            .select("id", { count: "exact", head: true })
            .in("property_id", ids);
        totalViews = count ?? 0;
    }

    // Leads assigned to this agent
    const { count: totalLeads } = await supabase()
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", user.id);

    const { count: closedLeads } = await supabase()
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", user.id)
        .eq("status", "closed");

    const tl = totalLeads ?? 0;
    const cl = closedLeads ?? 0;
    const conversionRate = tl > 0 ? Math.round((cl / tl) * 1000) / 10 : 0;

    return {
        totalViews,
        totalLeads: tl,
        closedLeads: cl,
        conversionRate,
        totalListings: totalListings ?? 0,
        activeListings: activeListings ?? 0,
    };
}


// ─── Views Over Time (Last 30 Days) ─────────────────────────────────────────

export interface ViewsDataPoint {
    date: string; // YYYY-MM-DD
    count: number;
}

export async function fetchViewsOverTime(): Promise<ViewsDataPoint[]> {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) return [];

    // Get property IDs for this agent
    const { data: propIds } = await supabase()
        .from("properties")
        .select("id")
        .eq("owner_id", user.id);

    const ids = (propIds ?? []).map((p: { id: string }) => p.id);
    if (ids.length === 0) return [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: views } = await supabase()
        .from("property_views")
        .select("viewed_at")
        .in("property_id", ids)
        .gte("viewed_at", thirtyDaysAgo.toISOString());

    if (!views || views.length === 0) return [];

    // Group by day
    const dayMap: Record<string, number> = {};
    for (const v of views) {
        const day = new Date(v.viewed_at).toISOString().split("T")[0];
        dayMap[day] = (dayMap[day] || 0) + 1;
    }

    // Fill all 30 days (including zeros)
    const result: ViewsDataPoint[] = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        result.push({ date: key, count: dayMap[key] || 0 });
    }

    return result;
}

// ─── Leads by Property (Top 5) ──────────────────────────────────────────────

export interface LeadsByPropertyPoint {
    property: string;
    count: number;
}

export async function fetchLeadsByProperty(): Promise<LeadsByPropertyPoint[]> {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) return [];

    const { data: leads } = await supabase()
        .from("leads")
        .select("property:properties ( title )")
        .eq("agent_id", user.id);

    if (!leads || leads.length === 0) return [];

    // Group by property title
    const propMap: Record<string, number> = {};
    for (const l of leads) {
        const title = (l.property as unknown as { title: string })?.title ?? "Unknown";
        propMap[title] = (propMap[title] || 0) + 1;
    }

    // Sort by count desc, take top 5
    return Object.entries(propMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([property, count]) => ({ property, count }));
}

// ─── Closed Deals (for Commission Tracking) ─────────────────────────────────

export interface ClosedDealRow {
    id: string;
    property_title: string;
    client_name: string;
    deal_value: number;
    created_at: string;
}

export async function fetchClosedDeals(): Promise<ClosedDealRow[]> {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase()
        .from("leads")
        .select(`
            id, name, created_at,
            property:properties ( title, price ),
            buyer:profiles!leads_buyer_id_fkey ( full_name )
        `)
        .eq("agent_id", user.id)
        .eq("status", "closed")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[AgentDashboard] fetchClosedDeals error:", error.message);
        return [];
    }

    return (data ?? []).map((d) => {
        const prop = d.property as unknown as { title: string; price: number } | null;
        const buyer = d.buyer as unknown as { full_name: string | null } | null;
        return {
            id: d.id,
            property_title: prop?.title ?? "Unknown Property",
            client_name: d.name ?? buyer?.full_name ?? "Unknown",
            deal_value: Number(prop?.price ?? 0),
            created_at: d.created_at,
        };
    });
}

// ─── Profile ────────────────────────────────────────────────────────────────

export async function fetchAgentProfile(): Promise<AgentProfileRow | null> {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase()
        .from("profiles")
        .select("id, full_name, email, phone, city, avatar_url, is_verified, role, created_at")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
        console.error("[AgentDashboard] fetchAgentProfile error:", error.message);
        return null;
    }

    return data as AgentProfileRow | null;
}

export async function updateAgentProfile(
    updates: Partial<Pick<AgentProfileRow, "full_name" | "phone" | "city" | "avatar_url">>
): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { error } = await supabase()
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

    if (error) {
        console.error("[AgentDashboard] updateAgentProfile error:", error.message);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function uploadAvatar(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const fileExt = file.name.split('.').pop();
    const fileName = `avatar-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase()
        .storage
        .from('avatars')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
        });

    if (uploadError) {
        console.error("[AgentDashboard] uploadAvatar error:", uploadError.message);
        return { success: false, error: uploadError.message };
    }

    const { data } = supabase().storage.from('avatars').getPublicUrl(filePath);
    return { success: true, url: data.publicUrl };
}

// ─── Phase 5: CRM Dashboard Data Fetching Helpers ───────────────────────────

export interface DashboardStats {
    totalLeads: number;
    newLeadsToday: number;
    visitsScheduled: number;
    closedDeals: number;
}

export async function getAgentDashboardStats(): Promise<DashboardStats> {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) return { totalLeads: 0, newLeadsToday: 0, visitsScheduled: 0, closedDeals: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total Leads
    const { count: totalLeads } = await supabase()
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", user.id);

    // New Leads Today
    const { count: newLeadsToday } = await supabase()
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", user.id)
        .gte("created_at", today.toISOString());

    // Visits Scheduled (Requested / Confirmed)
    const { data: properties } = await supabase()
        .from("properties")
        .select("id")
        .eq("owner_id", user.id);

    const propIds = (properties ?? []).map(p => p.id);
    let visitsScheduled = 0;

    if (propIds.length > 0) {
        const { count } = await supabase()
            .from("site_visits")
            .select("id", { count: "exact", head: true })
            .in("property_id", propIds)
            .in("status", ["requested", "confirmed"]);
        visitsScheduled = count ?? 0;
    }

    // Closed Deals
    const { count: closedDeals } = await supabase()
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", user.id)
        .eq("status", "closed");

    return {
        totalLeads: totalLeads ?? 0,
        newLeadsToday: newLeadsToday ?? 0,
        visitsScheduled,
        closedDeals: closedDeals ?? 0,
    };
}

export async function getRecentAgentLeads(): Promise<AgentLeadRow[]> {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase()
        .from("leads")
        .select(`
            id, name, phone, source, status, created_at,
            property:properties ( id, title ),
            buyer:profiles!leads_buyer_id_fkey ( id, full_name )
        `)
        .eq("agent_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

    if (error) {
        console.error("[AgentDashboard] getRecentAgentLeads error:", error.message);
        return [];
    }

    return (data ?? []) as unknown as AgentLeadRow[];
}

export async function getUpcomingVisits(): Promise<AgentMeetingRow[]> {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) return [];

    const { data: properties } = await supabase()
        .from("properties")
        .select("id")
        .eq("owner_id", user.id);

    const propIds = (properties ?? []).map(p => p.id);
    if (propIds.length === 0) return [];

    const { data, error } = await supabase()
        .from("site_visits")
        .select(`
            id, property_id, visit_date, visit_time, status, created_at,
            property:properties ( id, title, address, city ),
            buyer:profiles!site_visits_buyer_id_fkey ( id, full_name )
        `)
        .in("property_id", propIds)
        .in("status", ["requested", "confirmed"])
        .gte("visit_date", new Date().toISOString().split("T")[0])
        .order("visit_date", { ascending: true })
        .order("visit_time", { ascending: true })
        .limit(10);

    if (error) {
        console.error("[AgentDashboard] getUpcomingVisits error:", error.message);
        return [];
    }

    return (data ?? []) as unknown as AgentMeetingRow[];
}

export interface PipelineCounts {
    new: number;
    contacted: number;
    visitScheduled: number;
    negotiation: number;
    closed: number;
    lost: number;
}

export async function getPipelineStats(): Promise<PipelineCounts> {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) {
        return { new: 0, contacted: 0, visitScheduled: 0, negotiation: 0, closed: 0, lost: 0 };
    }

    const { data, error } = await supabase()
        .from("leads")
        .select("status")
        .eq("agent_id", user.id);

    const counts: PipelineCounts = { new: 0, contacted: 0, visitScheduled: 0, negotiation: 0, closed: 0, lost: 0 };

    if (!error && data) {
        data.forEach(lead => {
            const status = (lead.status ?? "new").toLowerCase();
            if (status === "new") counts.new++;
            else if (status === "contacted") counts.contacted++;
            else if (status === "visit scheduled" || status === "visited") counts.visitScheduled++;
            else if (status === "negotiation") counts.negotiation++;
            else if (status === "closed") counts.closed++;
            else if (status === "lost") counts.lost++;
            else counts.new++; // fallback
        });
    }

    return counts;
}

export interface PerformanceSnapshot {
    leadsThisWeek: number;
    conversionRate: number; // percentage
    visitsCompleted: number;
}

export async function getPerformanceSnapshot(): Promise<PerformanceSnapshot> {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) return { leadsThisWeek: 0, conversionRate: 0, visitsCompleted: 0 };

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Leads this week
    const { count: leadsThisWeek } = await supabase()
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", user.id)
        .gte("created_at", oneWeekAgo.toISOString());

    // Conversion rate (all time closed / total leads)
    const { count: totalLeads } = await supabase()
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", user.id);

    const { count: closedLeads } = await supabase()
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", user.id)
        .eq("status", "closed");

    const tLeads = totalLeads ?? 0;
    const cLeads = closedLeads ?? 0;
    const conversionRate = tLeads > 0 ? Math.round((cLeads / tLeads) * 1000) / 10 : 0;

    // Visits completed
    const { data: properties } = await supabase()
        .from("properties")
        .select("id")
        .eq("owner_id", user.id);

    const propIds = (properties ?? []).map(p => p.id);
    let visitsCompleted = 0;
    if (propIds.length > 0) {
        const { count } = await supabase()
            .from("site_visits")
            .select("id", { count: "exact", head: true })
            .in("property_id", propIds)
            .in("status", ["completed", "visited"]); // Depending on exact schema, status might be 'completed' or something else
        visitsCompleted = count ?? 0;
    }

    return {
        leadsThisWeek: leadsThisWeek ?? 0,
        conversionRate,
        visitsCompleted,
    };
}
