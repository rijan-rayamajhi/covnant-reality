/* ── Types ─────────────────────────────────────────────────── */

export interface AdminProperty {
    id: string;
    owner_id: string;
    title: string;
    description: string | null;
    listing_type: string;
    property_type: string;
    commercial_type: string | null;
    price: number;
    area_sqft: number;
    area_unit: string;
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
    pincode: string | null;
    landmark: string | null;
    status: "pending" | "approved" | "rejected" | "sold" | "rented";
    is_verified: boolean;
    is_featured: boolean;
    rera_number: string | null;
    contact_number: string | null;
    whatsapp_number: string | null;
    allow_phone: boolean;
    allow_whatsapp: boolean;
    allow_chat: boolean;
    amenities: string[];
    media: { id: string; url: string; type: string }[];
    created_at: string;
    /* joined from profiles */
    owner_name: string | null;
    owner_role: string | null;
}

export interface AdminUser {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    role: string | null;
    city: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    created_at: string;
}

export interface AdminLead {
    id: string;
    property_id: string | null;
    buyer_id: string | null;
    agent_id: string | null;
    name: string | null;
    phone: string | null;
    source: string;
    status: string;
    created_at: string;
    /* joined */
    property_title: string | null;
    property_city: string | null;
    agent_name: string | null;
}


export interface AdminAnalytics {
    totalUsers: number;
    totalProperties: number;
    totalLeads: number;
    pendingApprovals: number;
    propertiesByCity: { city: string; count: number }[];
    trafficTrend: { name: string; value: number }[];
    leadsTrend: { name: string; value: number }[];
}

export interface AdminActivityLog {
    id: string;
    user_id: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    created_at: string;
    /* joined */
    user_name: string | null;
}

/* ── Shared pagination params ──────────────────────────────── */

export interface PaginationParams {
    limit?: number;
    offset?: number;
}

export interface PaginatedResult<T> {
    data: T[] | null;
    totalCount: number;
    error: string | null;
}

const DEFAULT_LIMIT = 20;

/* ── Helper ────────────────────────────────────────────────── */

async function apiFetch<T>(url: string, options?: RequestInit): Promise<{ data: T | null; error: string | null }> {
    try {
        const res = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options?.headers,
            },
        });
        const json = await res.json();
        if (!res.ok) {
            return { data: null, error: json.error ?? `Request failed (${res.status})` };
        }
        return { data: json as T, error: null };
    } catch (err) {
        return { data: null, error: (err as Error).message };
    }
}

/* ── Queries ───────────────────────────────────────────────── */

/**
 * Fetch properties with owner info – paginated.
 */
export async function fetchAdminProperties(
    { limit = DEFAULT_LIMIT, offset = 0 }: PaginationParams = {}
): Promise<PaginatedResult<AdminProperty>> {
    const { data, error } = await apiFetch<{ data: AdminProperty[]; totalCount: number }>(
        `/api/admin/properties?limit=${limit}&offset=${offset}`
    );
    if (error || !data) return { data: null, totalCount: 0, error };
    return { data: data.data, totalCount: data.totalCount, error: null };
}

/**
 * Approve a property via the API route.
 */
export async function approveProperty(propertyId: string): Promise<{
    success: boolean;
    error: string | null;
}> {
    const { data, error } = await apiFetch<{ success: boolean }>("/api/admin/properties", {
        method: "POST",
        body: JSON.stringify({ action: "approve", propertyId }),
    });
    if (error || !data) return { success: false, error };
    return { success: true, error: null };
}

/**
 * Reject a property via the API route.
 */
export async function rejectProperty(propertyId: string): Promise<{
    success: boolean;
    error: string | null;
}> {
    const { data, error } = await apiFetch<{ success: boolean }>("/api/admin/properties", {
        method: "POST",
        body: JSON.stringify({ action: "reject", propertyId }),
    });
    if (error || !data) return { success: false, error };
    return { success: true, error: null };
}

/**
 * Delete a property via the API route.
 */
export async function deleteAdminProperty(propertyId: string): Promise<{
    success: boolean;
    error: string | null;
}> {
    const { data, error } = await apiFetch<{ success: boolean }>("/api/admin/properties", {
        method: "DELETE",
        body: JSON.stringify({ propertyId }),
    });
    if (error || !data) return { success: false, error };
    return { success: true, error: null };
}

/**
 * Update editable property fields as admin.
 */
export async function updateAdminProperty(
    propertyId: string,
    updates: Partial<Omit<AdminProperty, "id" | "owner_id" | "owner_name" | "owner_role" | "created_at" | "media">>
): Promise<{ success: boolean; error: string | null }> {
    const { data, error } = await apiFetch<{ success: boolean }>("/api/admin/properties", {
        method: "PATCH",
        body: JSON.stringify({ propertyId, updates }),
    });
    if (error || !data) return { success: false, error };
    return { success: true, error: null };
}

/**
 * Delete a single property media item (image/video) from storage and DB.
 */
export async function deletePropertyMedia(
    mediaId: string,
    mediaUrl: string
): Promise<{ success: boolean; error: string | null }> {
    const { data, error } = await apiFetch<{ success: boolean }>("/api/admin/property-media", {
        method: "DELETE",
        body: JSON.stringify({ mediaId, mediaUrl }),
    });
    if (error || !data) return { success: false, error };
    return { success: true, error: null };
}

/**
 * Upload a new image/video file to a property.
 * Returns the new media item { id, url, type } on success.
 */
export async function uploadPropertyMedia(
    propertyId: string,
    ownerId: string,
    file: File,
    mediaType: "image" | "video" | "floorplan" = "image"
): Promise<{ media: { id: string; url: string; type: string } | null; error: string | null }> {
    const fd = new FormData();
    fd.append("propertyId", propertyId);
    fd.append("ownerId", ownerId);
    fd.append("mediaType", mediaType);
    fd.append("file", file);
    try {
        const res = await fetch("/api/admin/property-media", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) return { media: null, error: json.error ?? `Upload failed (${res.status})` };
        return { media: json.media, error: null };
    } catch (err) {
        return { media: null, error: (err as Error).message };
    }
}

/* ── Users ─────────────────────────────────────────────────── */

/**
 * Fetch user profiles – paginated.
 */
export async function fetchAdminUsers(
    { limit = DEFAULT_LIMIT, offset = 0 }: PaginationParams = {}
): Promise<PaginatedResult<AdminUser>> {
    const { data, error } = await apiFetch<{ data: AdminUser[]; totalCount: number }>(
        `/api/admin/users?limit=${limit}&offset=${offset}`
    );
    if (error || !data) return { data: null, totalCount: 0, error };
    return { data: data.data, totalCount: data.totalCount, error: null };
}

/**
 * Update a user's is_verified flag.
 */
export async function updateUserVerification(
    userId: string,
    isVerified: boolean
): Promise<{ success: boolean; error: string | null }> {
    const { data, error } = await apiFetch<{ success: boolean }>("/api/admin/users", {
        method: "PATCH",
        body: JSON.stringify({ userId, isVerified }),
    });
    if (error || !data) return { success: false, error };
    return { success: true, error: null };
}

/* ── Leads ─────────────────────────────────────────────────── */

/**
 * Fetch leads with property + agent info – paginated.
 */
export async function fetchAdminLeads(
    { limit = DEFAULT_LIMIT, offset = 0 }: PaginationParams = {}
): Promise<PaginatedResult<AdminLead>> {
    const { data, error } = await apiFetch<{ data: AdminLead[]; totalCount: number }>(
        `/api/admin/leads?limit=${limit}&offset=${offset}`
    );
    if (error || !data) return { data: null, totalCount: 0, error };
    return { data: data.data, totalCount: data.totalCount, error: null };
}

/* ── Site Visits ───────────────────────────────────────────── */

export interface AdminVisit {
    id: string;
    name: string | null;
    phone: string | null;
    status: string;
    created_at: string;
    property_id: string | null;
    property_title: string | null;
    buyer_name: string | null;
    buyer_phone: string | null;
}

/**
 * Fetch site visits with property + buyer info – paginated, with optional status filter.
 */
export async function fetchAdminVisits(
    { limit = DEFAULT_LIMIT, offset = 0, status = "" }: PaginationParams & { status?: string } = {}
): Promise<PaginatedResult<AdminVisit>> {
    const statusParam = status ? `&status=${status}` : "";
    const { data, error } = await apiFetch<{ data: AdminVisit[]; totalCount: number }>(
        `/api/admin/visits?limit=${limit}&offset=${offset}${statusParam}`
    );
    if (error || !data) return { data: null, totalCount: 0, error };
    return { data: data.data, totalCount: data.totalCount, error: null };
}

/**
 * Update a site visit's status.
 */
export async function updateAdminVisitStatus(
    visitId: string,
    status: string
): Promise<{ success: boolean; error: string | null }> {
    const { data, error } = await apiFetch<{ success: boolean }>("/api/admin/visits", {
        method: "PATCH",
        body: JSON.stringify({ visitId, status }),
    });
    if (error || !data) return { success: false, error };
    return { success: true, error: null };
}

/* ── Analytics (aggregates) ────────────────────────────────── */

/**
 * Fetch aggregate analytics numbers.
 */
export async function fetchAdminAnalytics(): Promise<{
    data: AdminAnalytics | null;
    error: string | null;
}> {
    const { data, error } = await apiFetch<{ data: AdminAnalytics }>("/api/admin/analytics");
    if (error || !data) return { data: null, error };
    return { data: data.data, error: null };
}

/* ── Activity Logs ─────────────────────────────────────────── */

/**
 * Fetch recent activity logs with user names.
 */
export async function fetchActivityLogs(
    limit = 10
): Promise<{
    data: AdminActivityLog[] | null;
    error: string | null;
}> {
    const { data, error } = await apiFetch<{ data: AdminActivityLog[] }>(
        `/api/admin/activity?limit=${limit}`
    );
    if (error || !data) return { data: null, error };
    return { data: data.data, error: null };
}
