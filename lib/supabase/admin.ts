/* ── Types ─────────────────────────────────────────────────── */

export interface AdminProperty {
    id: string;
    owner_id: string;
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
    state: string | null;
    status: "pending" | "approved" | "rejected" | "sold" | "rented";
    is_verified: boolean;
    is_featured: boolean;
    rera_number: string | null;
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
