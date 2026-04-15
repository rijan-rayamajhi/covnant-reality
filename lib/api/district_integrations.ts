import { createClient } from "@/lib/supabase/client";

export interface DistrictIntegration {
    id: string;
    main_district_id: string;
    connected_district_id: string;
    created_at: string;
}

export interface IntegratedGroup {
    main_district_id: string;
    main_district_name: string;
    connections: {
        id: string;
        connected_district_id: string;
        connected_district_name: string;
    }[];
}

/**
 * Fetch all district integrations
 */
export async function getDistrictIntegrations(): Promise<DistrictIntegration[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("district_integrations")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching district integrations:", error);
        return [];
    }
    
    return data || [];
}

/**
 * Add a new district integration
 */
export async function addDistrictIntegration(mainDistrictId: string, connectedDistrictId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("district_integrations")
        .insert({
            main_district_id: mainDistrictId,
            connected_district_id: connectedDistrictId
        })
        .select()
        .single();
        
    if (error) {
        throw new Error(error.message || "Failed to add integration");
    }
    return data;
}

/**
 * Remove a district integration
 */
export async function removeDistrictIntegration(id: string) {
    const supabase = createClient();
    const { error } = await supabase
        .from("district_integrations")
        .delete()
        .eq("id", id);
        
    if (error) {
        throw new Error(error.message || "Failed to remove integration");
    }
    return true;
}

/**
 * Get property count for a specific city query (including connected districts)
 */
export async function getIntegratedPropertyCount(cityName: string): Promise<number> {
    const supabase = createClient();
    // Use the search_properties RPC to get the true count with integrations
    const { data, error } = await supabase.rpc("search_properties", {
        p_city: cityName,
        p_limit: 1,
        p_include_connected: true
    });
    
    if (error || !data || data.length === 0) {
        return 0;
    }
    
    return Number(data[0].total_count || 0);
}
