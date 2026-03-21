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

/**
 * Geocode an Indian pincode to lat/lon using Nominatim (OpenStreetMap).
 */
async function geocodePincode(
    pincode: string
): Promise<{ lat: number; lon: number } | null> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(pincode)}&country=India&format=json&limit=1`,
            {
                headers: { "User-Agent": "CovnantReality/1.0" },
                signal: AbortSignal.timeout(5000),
            }
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (!data || data.length === 0) return null;
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (isNaN(lat) || isNaN(lon)) return null;
        return { lat, lon };
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
    const [geocoding, setGeocoding] = useState(false);

    const hasDirectCoords = !!latitude && !!longitude;
    const hasPincode = !!pincode && pincode.trim().length > 0;

    // Step 1: If no direct coords but pincode is available, geocode it
    useEffect(() => {
        if (hasDirectCoords || !hasPincode) return;

        let isMounted = true;
        
        const fetchGeocode = async () => {
            // Await a microtask to avoid "setState synchronously in effect" warning
            await Promise.resolve();
            if (isMounted) {
                setGeocoding(true);
            }
            
            const coords = await geocodePincode(pincode!);
            if (isMounted) {
                setResolvedCoords(coords);
                setGeocoding(false);
            }
        };

        fetchGeocode();

        return () => { isMounted = false; };
    }, [hasDirectCoords, hasPincode, pincode]);

    // Determine the final coordinates to use
    const finalLat = latitude ?? resolvedCoords?.lat ?? null;
    const finalLon = longitude ?? resolvedCoords?.lon ?? null;
    const hasCoords = !!finalLat && !!finalLon;

    // Step 2: Fetch nearby places using final coordinates
    useEffect(() => {
        if (!hasCoords || !finalLat || !finalLon) return;

        let isMounted = true;

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
                        signal: AbortSignal.timeout(10000) // 10s timeout
                    });
                    if (response.ok) return await response.json();
                    lastError = new Error(`Overpass ${endpoint} returned ${response.status}`);
                } catch (err) {
                    lastError = err as Error;
                }
            }
            throw lastError || new Error("All Overpass endpoints failed");
        };

        const loadNearby = async () => {
            try {
                const radius = 5000;
                const query = `
                    [out:json][timeout:25];
                    (
                      nwr["railway"="station"](around:${radius}, ${finalLat}, ${finalLon});
                      nwr["station"="subway"](around:${radius}, ${finalLat}, ${finalLon});
                      nwr["amenity"~"school|college|university"](around:${radius}, ${finalLat}, ${finalLon});
                      nwr["amenity"="hospital"](around:${radius}, ${finalLat}, ${finalLon});
                      nwr["shop"~"mall|department_store"](around:${radius}, ${finalLat}, ${finalLon});
                    );
                    out center;
                `;

                const data = await fetchWithRetry(query);
                const elements = (data.elements || []) as OverpassElement[];

                const findNearest = (category: string) => {
                    const filtered = elements.filter((el) => {
                        const t = el.tags || {};
                        if (category === "transport") return t.railway === "station" || t.station === "subway";
                        if (category === "education") return ["school", "college", "university"].includes(t.amenity || "");
                        if (category === "health") return t.amenity === "hospital";
                        if (category === "shopping") return t.shop === "mall" || t.shop === "department_store";
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
                    setFetchedPlaces(TEMPLATES.map(t => {
                        const nearest = findNearest(t.category);
                        if (!nearest) return { ...t, name: "Not found nearby", distance: "N/A", loading: false };
                        const name = nearest.tags?.name || nearest.tags?.brand || t.label.split(" / ")[0];
                        const distKm = nearest.dist || 0;
                        const distanceLabel = distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`;
                        return { ...t, name, distance: distanceLabel, loading: false };
                    }));
                }
            } catch (error) {
                console.error("Error fetching nearby data:", error);
                if (isMounted) {
                    setFetchedPlaces(TEMPLATES.map(p => ({ ...p, loading: false, distance: "Unavailable", name: "Could not load" })));
                }
            }
        };

        loadNearby();
        return () => { isMounted = false; };
    }, [hasCoords, finalLat, finalLon]);

    const nearbyPlaces = useMemo(() => {
        if (!hasCoords && !geocoding && !hasPincode) {
            return TEMPLATES.map(t => ({ ...t, name: "No location data", distance: "N/A", loading: false }));
        }
        if (fetchedPlaces) return fetchedPlaces;
        return TEMPLATES.map(t => ({ ...t, name: "Nearby", distance: "calculating...", loading: true }));
    }, [hasCoords, geocoding, hasPincode, fetchedPlaces]);

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
