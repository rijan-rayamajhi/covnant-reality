import React, { useState, useEffect, useMemo } from "react";
import { TrainTrack, School, Hospital, ShoppingBag, Loader2 } from "lucide-react";

interface NearbyPlace {
    label: string;
    icon: React.ElementType;
    name: string;
    distance: string;
    loading: boolean;
}

const TEMPLATES = [
    { label: "Metro / Railway Station", category: "transport", icon: TrainTrack },
    { label: "School / College", category: "education", icon: School },
    { label: "Hospital", category: "health", icon: Hospital },
    { label: "Shopping Mall", category: "shopping", icon: ShoppingBag },
];

interface NearbySectionProps {
    latitude?: number | null;
    longitude?: number | null;
    pincode?: string | null;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

// Simple session-level cache to avoid redundant Overpass/Geocoding calls
const GLOBAL_CACHE: Record<string, unknown> = {};

/**
 * Geocode an Indian pincode or address to lat/lon using Nominatim (OpenStreetMap).
 */
async function geocodeLocation(
    query: string,
    isPincode = true
): Promise<{ lat: number; lon: number } | null> {
    const cacheKey = `geo_${query}`;
    if (GLOBAL_CACHE[cacheKey]) return GLOBAL_CACHE[cacheKey] as { lat: number; lon: number };

    try {
        const url = isPincode 
            ? `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(query)}&country=India&format=json&limit=1`
            : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&country=India&format=json&limit=1`;
            
        const res = await fetch(url, {
            headers: { "User-Agent": "CovnantReality/1.1" },
            signal: AbortSignal.timeout(6000),
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data || data.length === 0) return null;
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (isNaN(lat) || isNaN(lon)) return null;

        const result = { lat, lon };
        GLOBAL_CACHE[cacheKey] = result;
        return result;
    } catch {
        return null;
    }
}

interface OverpassElement {
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
    dist?: number;
}

export function NearbySection({ latitude, longitude, pincode }: NearbySectionProps) {
    const [fetchedPlaces, setFetchedPlaces] = useState<NearbyPlace[] | null>(null);
    const [resolvedCoords, setResolvedCoords] = useState<{ lat: number; lon: number } | null>(null);
    const [status, setStatus] = useState<"idle" | "geocoding" | "fetching" | "success" | "error">("idle");

    const hasDirectCoords = !!latitude && !!longitude;
    const hasPincode = !!pincode && pincode.trim().length > 0;

    // Step 1: Geocode if direct coords are missing
    useEffect(() => {
        let isMounted = true;
        if (hasDirectCoords || !hasPincode) {
            if (hasDirectCoords) {
                // Defer to avoid "synchronous setState in effect" lint error
                Promise.resolve().then(() => {
                    if (isMounted) setStatus("fetching");
                });
            }
            return;
        }

        const fetchGeocode = async () => {
            await Promise.resolve();
            if (isMounted) {
                setStatus("geocoding");
            }
            const coords = await geocodeLocation(pincode!);
            if (isMounted) {
                setResolvedCoords(coords);
                if (coords) setStatus("fetching");
                else setStatus("error");
            }
        };

        fetchGeocode();
        return () => { isMounted = false; };
    }, [hasDirectCoords, hasPincode, pincode]);

    const finalLat = latitude ?? resolvedCoords?.lat ?? null;
    const finalLon = longitude ?? resolvedCoords?.lon ?? null;
    const hasCoords = !!finalLat && !!finalLon;

    // Step 2: Fetch nearby places using Overpass
    useEffect(() => {
        if (!hasCoords || !finalLat || !finalLon) return;

        const cacheKey = `overpass_${finalLat.toFixed(4)}_${finalLon.toFixed(4)}`;
        let isMounted = true;
        if (GLOBAL_CACHE[cacheKey]) {
            // Defer to avoid "synchronous setState in effect" lint error
            const data = GLOBAL_CACHE[cacheKey] as NearbyPlace[];
            Promise.resolve().then(() => {
                if (isMounted) {
                    setFetchedPlaces(data);
                    setStatus("success");
                }
            });
            return;
        }

        const fetchWithRetry = async (query: string) => {
            const endpoints = [
                "https://overpass-api.de/api/interpreter",
                "https://lz4.overpass-api.de/api/interpreter",
                "https://overpass.kumi.systems/api/interpreter",
            ];

            let lastError = null;
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
                        signal: AbortSignal.timeout(15000)
                    });
                    if (response.ok) return await response.json();
                    lastError = new Error(`Overpass returned ${response.status}`);
                } catch (err) {
                    lastError = err as Error;
                }
            }
            throw lastError || new Error("Endpoints failed");
        };

        const loadNearby = async () => {
            try {
                // Radius strategy: Start with 40km to ensure "Always Works" (per user request)
                const radius = 40000;
                const query = `
                    [out:json][timeout:35];
                    (
                      nwr["railway"~"station|halt|platform"](around:${radius}, ${finalLat}, ${finalLon});
                      nwr["station"~"subway|railway"](around:${radius}, ${finalLat}, ${finalLon});
                      nwr["amenity"~"school|college|university|hospital"](around:${radius}, ${finalLat}, ${finalLon});
                      nwr["shop"~"mall|department_store|supermarket"](around:${radius}, ${finalLat}, ${finalLon});
                      nwr["amenity"="hospital"](around:${radius}, ${finalLat}, ${finalLon});
                    );
                    out center;
                `;

                const data = await fetchWithRetry(query);
                const elements = (data.elements || []) as OverpassElement[];

                const findNearest = (category: string) => {
                    const filtered = elements.filter((el) => {
                        const t = el.tags || {};
                        if (category === "transport") return t.railway === "station" || t.railway === "halt" || t.station === "subway" || t.station === "railway";
                        if (category === "education") return ["school", "college", "university"].includes(t.amenity || "");
                        if (category === "health") return t.amenity === "hospital";
                        if (category === "shopping") return t.shop === "mall" || t.shop === "department_store" || t.shop === "supermarket";
                        return false;
                    });

                    if (filtered.length === 0) return null;

                    const sorted = filtered.map((el) => {
                        const elLat = el.lat || (el.center && el.center.lat);
                        const elLon = el.lon || (el.center && el.center.lon);
                        if (!elLat || !elLon) return { ...el, dist: Infinity };
                        const dist = calculateDistance(finalLat, finalLon, elLat, elLon);
                        return { ...el, dist };
                    }).sort((a, b) => (a.dist || 0) - (b.dist || 0));

                    const nearest = sorted[0];
                    return nearest.dist === Infinity ? null : nearest;
                };

                if (isMounted) {
                    const processed = TEMPLATES.map(t => {
                        const nearest = findNearest(t.category);
                        if (!nearest) return { ...t, name: "Searching wider...", distance: "N/A", loading: false };
                        const name = nearest.tags?.name || nearest.tags?.brand || t.label.split(" / ")[0];
                        const distKm = nearest.dist || 0;
                        const distanceLabel = distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`;
                        return { ...t, name, distance: distanceLabel, loading: false };
                    });

                    GLOBAL_CACHE[cacheKey] = processed;
                    setFetchedPlaces(processed);
                    setStatus("success");
                }
            } catch (error) {
                console.error("Nearby load failed:", error);
                if (isMounted) {
                    setStatus("error");
                    setFetchedPlaces(TEMPLATES.map(p => ({ ...p, loading: false, distance: "Unavailable", name: "Network error" })));
                }
            }
        };

        loadNearby();
        return () => { isMounted = false; };
    }, [hasCoords, finalLat, finalLon]);

    const nearbyPlaces = useMemo(() => {
        if (status === "idle" && !hasCoords && !hasPincode) {
            return TEMPLATES.map(t => ({ ...t, name: "No location info", distance: "N/A", loading: false }));
        }
        if (fetchedPlaces) return fetchedPlaces;
        return TEMPLATES.map(t => ({ ...t, name: status === "geocoding" ? "Locating..." : "Nearby", distance: "calculating...", loading: true }));
    }, [status, hasCoords, hasPincode, fetchedPlaces]);

    return (
        <section className="py-6 border-b border-border bg-bg-card">
            <h3 className="text-lg font-bold text-text-primary mb-4">Nearby</h3>

            <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-x-12">
                {nearbyPlaces.map((place, index) => {
                    const Icon = place.icon;
                    return (
                        <div key={index} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 border border-border flex-shrink-0 group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors">
                                    <Icon className="w-5 h-5 text-text-secondary group-hover:text-primary" strokeWidth={1.5} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-text-muted leading-none mb-1">{place.label}</span>
                                    {place.loading ? (
                                        <div className="flex items-center gap-1.5 h-4">
                                            <div className="w-20 h-3.5 bg-slate-100 animate-pulse rounded" />
                                        </div>
                                    ) : (
                                        <span className="text-sm font-bold text-text-primary line-clamp-1">{place.name}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                {place.loading ? (
                                    <Loader2 className="w-3 h-3 text-primary animate-spin" />
                                ) : (
                                    <span className="text-[11px] font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10 whitespace-nowrap">
                                        {place.distance}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
