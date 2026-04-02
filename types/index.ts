// ─── Property Types ─────────────────────────────────────────────────────────

export interface Property {
    id: string;
    title: string;
    description: string;
    price: number;
    location: string;
    city: string;
    state: string;
    bedrooms: number;
    bathrooms: number;
    area: number; // in sq ft
    area_value?: number;
    area_unit?: string;
    image: string;
    images: string[];
    videos: string[];
    badge?: PropertyBadge;
    type: PropertyType;
    listed: string; // ISO date string
    featured: boolean;
    verified?: boolean;
    status?: PropertyStatus;
    // Detail-page extras (populated by fetchPropertyById)
    furnishing?: string | null;
    floor?: number | null;
    totalFloors?: number | null;
    facing?: string | null;
    possessionStatus?: string | null;
    listingType?: "sell" | "rent";
    ownerId?: string | null;
    commercialType?: string | null;
    pricePerSqFt?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    pincode?: string | null;

    // Reviews
    rating?: number;
    reviewCount?: number;

    // Contact
    contactNumber?: string | null;
    whatsappNumber?: string | null;

    // Additional Fields
    amenities?: string[] | null;
    allowChat?: boolean;
    landmark?: string | null;
    floorPlans: string[];
    search_category_id?: string | null;
    search_subtype_id?: string | null;
}

export type PropertyStatus = "Pending Approval" | "Approved" | "Rejected";

export type PropertyType =
    | "apartment"
    | "house"
    | "villa"
    | "plot"
    | "commercial";

export type PropertyBadge =
    | "new"
    | "featured"
    | "hot"
    | "price-drop"
    | "sold"
    | "rent"
    | "pg";

// ─── UI Component Types ─────────────────────────────────────────────────────

export type ButtonVariant =
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger";

export type ButtonSize = "sm" | "md" | "lg";

export type BadgeVariant =
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "outline";

// ─── Project Types ──────────────────────────────────────────────────────────

export interface Project {
    id: string;
    name: string;
    builder: string;
    location: string;
    city: string;
    startingPrice: number;
    possessionStatus: string;
    reraBadge: string;
    image: string;
}

// ─── Database Project Types ─────────────────────────────────────────────────

export interface DbProject {
    id: string;
    builder_id: string;
    name: string;
    description: string | null;
    city: string;
    possession_status: string | null;
    rera_number: string | null;
    image_url: string | null;
    created_at: string;
}

export type UnitStatus = "available" | "blocked" | "sold";

export interface DbProjectUnit {
    id: string;
    project_id: string;
    unit_number: string;
    price: number;
    status: UnitStatus;
    area_sqft: number;
    bedrooms: number | null;
    created_at: string;
}

export interface BuilderStats {
    totalProjects: number;
    activeUnits: number;
    totalLeads: number;
    pipelineValue: number;
}

export interface BuilderAnalytics {
    projectViews: number;
    totalLeads: number;
    sellThroughRate: number; // percentage 0–100
    pipelineValue: number;
    monthlyData: { month: string; leads: number; conversions: number }[];
}

export interface LeadFunnelData {
    new: number;
    contacted: number;
    visited: number;
    closed: number;
}

// ─── Agent Types ────────────────────────────────────────────────────────────

export interface Agent {
    id: string;
    name: string;
    photo: string;
    experienceYears: number;
    rating: number; // e.g. 4.8
    reviews: number;
    operatingLocation: string;
}

// ─── Search Types (Supabase Edge Function) ──────────────────────────────────

export interface SearchProperty {
    id: string;
    owner_id: string;
    title: string;
    description: string;
    listing_type: "sell" | "rent";
    property_type: string;
    price: number;
    area_sqft: number;
    area_value?: number;
    area_unit?: string;
    bedrooms: number;
    bathrooms: number;
    furnishing: string | null;
    address: string;
    city: string;
    status: string;
    is_verified: boolean;
    created_at: string;
    total_count: number;
    image_url?: string | null;
    commercial_type?: string | null;
    price_per_sqft?: number | null;

    // Reviews
    rating?: number;
    reviewCount?: number;
    search_category_id?: string | null;
    search_subtype_id?: string | null;
}

export interface SearchFilters {
    city?: string;
    cityId?: string;
    stateId?: string;
    localityId?: string;
    bedrooms?: number;
    listing_type?: string;
    property_type?: string;
    is_verified?: boolean;
    sort_by?: "newest" | "price_low" | "price_high";
    agentId?: string;
}

// ─── Review Types ───────────────────────────────────────────────────────────

export interface PropertyReview {
    id: string;
    property_id: string;
    user_id: string;
    rating: number;
    comment: string | null;
    created_at: string;

    // Joined field from auth.users (usually mapped by the client)
    user_name?: string;
}

// ─── Search Category Types ──────────────────────────────────────────────────

export interface SearchSubtype {
    id: string;
    category_id: string;
    name: string;
    is_active: boolean;
    display_order: number;
}

export interface SearchCategory {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    display_order: number;
    subtypes: SearchSubtype[];
}
