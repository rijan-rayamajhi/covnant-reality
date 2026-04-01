import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { link } = body;

        if (!link || typeof link !== "string" || !link.startsWith("http")) {
            return NextResponse.json({ error: "Invalid map link provided." }, { status: 400 });
        }

        // Fetch the URL to follow any redirects (e.g., short links)
        const response = await fetch(link, {
            redirect: "follow",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
        });

        const finalUrl = response.url;
        
        // Google maps sometimes redirects to a consent page in some regions, but hopefully not for standard share links.
        // Also some short URLs might return an HTML page with a meta refresh instead of a 302, but fetch usually handles standard 3xx.

        // Try to match standard coordinates /@lat,lng/ or ?q=lat,lng or query=lat,lng
        let lat: number | null = null;
        let lng: number | null = null;

        // Match formats like @17.4389953,78.3842183
        const atMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        // Decode URL first to handle %2C instead of comma
        const decodedUrl = decodeURIComponent(finalUrl);
        const qMatch = decodedUrl.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);

        if (atMatch) {
            lat = parseFloat(atMatch[1]);
            lng = parseFloat(atMatch[2]);
        } else if (qMatch) {
            lat = parseFloat(qMatch[1]);
            lng = parseFloat(qMatch[2]);
        }

        if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
            return NextResponse.json({ latitude: lat, longitude: lng });
        }

        return NextResponse.json({ error: "Coordinates not found in the provided map link." }, { status: 400 });

    } catch (error) {
        console.error("Parse Map Link Error:", error);
        return NextResponse.json({ error: "Failed to parse the Google Maps link." }, { status: 500 });
    }
}
