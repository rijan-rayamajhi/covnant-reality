import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/supabase/admin-auth";
import { PostgrestResponse } from "@supabase/supabase-js";

interface BaseCountResponse {
    id: string;
}

interface CreatedAtResponse {
    created_at: string;
}

interface CityResponse {
    city: string;
}

export async function GET() {
    const { error: authError } = await verifyAdmin();
    if (authError) {
        return NextResponse.json({ error: authError }, { status: 401 });
    }

    const supabase = await createClient();

    // Run all counts in parallel
    const [usersRes, propsRes, leadsRes, pendingRes, cityRes, trafficRes, leadsTrendRes] =
        await Promise.all([
            supabase.from("profiles").select("id", { count: "exact", head: true }) as unknown as Promise<PostgrestResponse<BaseCountResponse>>,
            supabase.from("properties").select("id", { count: "exact", head: true }) as unknown as Promise<PostgrestResponse<BaseCountResponse>>,
            supabase.from("leads").select("id", { count: "exact", head: true }) as unknown as Promise<PostgrestResponse<BaseCountResponse>>,
            supabase
                .from("properties")
                .select("id", { count: "exact", head: true })
                .eq("status", "pending") as unknown as Promise<PostgrestResponse<BaseCountResponse>>,
            supabase.from("properties").select("city") as unknown as Promise<PostgrestResponse<CityResponse>>,
            supabase.from("profiles").select("created_at").gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) as unknown as Promise<PostgrestResponse<CreatedAtResponse>>,
            supabase.from("leads").select("created_at").gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) as unknown as Promise<PostgrestResponse<CreatedAtResponse>>,
        ]);

    const firstError = [usersRes, propsRes, leadsRes, pendingRes, cityRes, trafficRes, leadsTrendRes].find(
        (r) => r.error
    );
    if (firstError?.error) {
        return NextResponse.json(
            { error: firstError.error.message },
            { status: 500 }
        );
    }

    // Aggregate properties by city
    const cityMap = new Map<string, number>();
    const cityData = (cityRes.data ?? []) as { city: string }[];
    for (const row of cityData) {
        if (row.city) {
            cityMap.set(row.city, (cityMap.get(row.city) ?? 0) + 1);
        }
    }
    const propertiesByCity = Array.from(cityMap.entries())
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

    // Aggregate trends by last 7 days
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toLocaleDateString("en-US", { weekday: "short" }));
        }
        return days;
    };

    const labels = getLast7Days();
    
    const aggregateByDay = (data: { created_at: string }[]) => {
        const counts = new Map<string, number>();
        labels.forEach(l => counts.set(l, 0));
        
        data.forEach(item => {
            const day = new Date(item.created_at).toLocaleDateString("en-US", { weekday: "short" });
            if (counts.has(day)) {
                counts.set(day, (counts.get(day) ?? 0) + 1);
            }
        });
        
        return labels.map(name => ({ name, value: counts.get(name) ?? 0 }));
    };

    const trafficTrend = aggregateByDay(trafficRes.data ?? []);
    const leadsTrend = aggregateByDay(leadsTrendRes.data ?? []);

    return NextResponse.json({
        data: {
            totalUsers: usersRes.count ?? 0,
            totalProperties: propsRes.count ?? 0,
            totalLeads: leadsRes.count ?? 0,
            pendingApprovals: pendingRes.count ?? 0,
            propertiesByCity,
            trafficTrend,
            leadsTrend,
        },
    });
}
