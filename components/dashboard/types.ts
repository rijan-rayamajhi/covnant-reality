// ─── Dashboard Tab Types ────────────────────────────────────────────────────

export type DashboardTabId =
    | "saved"
    | "searches"
    | "visits"
    | "alerts"
    | "bookings"
    | "profile";

export interface DashboardTab {
    id: DashboardTabId;
    label: string;
    icon: string; // lucide icon name reference
}

// ─── Saved Properties ───────────────────────────────────────────────────────

export interface SavedPropertyRow {
    id: string;
    property_id: string;
    created_at: string;
    property: {
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
        city: string;
        status: string;
        is_verified: boolean;
        created_at: string;
        property_media: { media_url: string; media_type: string }[];
    };
}

// ─── Saved Searches ─────────────────────────────────────────────────────────

export interface SavedSearch {
    id: string;
    label: string | null;
    filters: Record<string, unknown>;
    created_at: string;
}

// ─── Site Visits (Bookings tab) ─────────────────────────────────────────────

export type VisitStatus = "requested" | "confirmed" | "completed" | "cancelled";

export interface SiteVisitRow {
    id: string;
    property_id: string;
    visit_date: string;
    visit_time: string;
    status: VisitStatus;
    created_at: string;
    property: {
        id: string;
        title: string;
        property_media: { media_url: string; media_type: string }[];
    };
    agent: {
        id: string;
        full_name: string | null;
        phone: string | null;
        email: string | null;
    } | null;
}

// ─── Leads ──────────────────────────────────────────────────────────────────

export type LeadStatus = "new" | "contacted" | "visited" | "closed";

export interface LeadRow {
    id: string;
    source: string;
    status: LeadStatus;
    created_at: string;
    property: {
        id: string;
        title: string;
    } | null;
    agent: {
        id: string;
        full_name: string | null;
    } | null;
}

// ─── Alerts ─────────────────────────────────────────────────────────────────

export type AlertFrequency = "instant" | "daily" | "weekly";

export interface AlertRow {
    id: string;
    title: string;
    frequency: AlertFrequency;
    active: boolean;
    created_at: string;
}

// Chat types removed

// ─── User Profile ───────────────────────────────────────────────────────────

export interface UserProfile {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    created_at: string;
}
