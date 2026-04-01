import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/supabase/admin-auth";

/**
 * POST /api/admin/property-media
 * Multipart form: { propertyId, ownerId, mediaType, file }
 * Uploads a new image/video to Supabase Storage and inserts a property_media row.
 * Returns { id, url, type } of the newly created media item.
 */
export async function POST(request: NextRequest) {
    const { error: authError } = await verifyAdmin();
    if (authError) {
        return NextResponse.json({ error: authError }, { status: 401 });
    }

    const formData = await request.formData();
    const propertyId = formData.get("propertyId") as string;
    const ownerId = formData.get("ownerId") as string;
    const mediaType = (formData.get("mediaType") as string) || "image";
    const file = formData.get("file") as File | null;

    if (!propertyId || !ownerId || !file) {
        return NextResponse.json({ error: "Missing propertyId, ownerId, or file" }, { status: 400 });
    }

    const supabase = await createClient();

    // Storage path uses the same convention as property submission: {ownerId}/{propertyId}/{uuid}.{ext}
    const ext = file.name.split(".").pop() ?? "jpg";
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const storagePath = `${ownerId}/${propertyId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from("property-media")
        .upload(storagePath, file, { contentType: file.type });

    if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Insert the DB row linking this file to the property
    const { data: mediaRow, error: dbError } = await supabase
        .from("property_media")
        .insert({
            property_id: propertyId,
            media_url: uploadData.path,
            media_type: mediaType,
        })
        .select("id, media_url, media_type")
        .single();

    if (dbError) {
        // Cleanup orphaned storage file
        await supabase.storage.from("property-media").remove([uploadData.path]);
        return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Return the public URL so the UI can display immediately
    const { data: urlData } = supabase.storage
        .from("property-media")
        .getPublicUrl(mediaRow.media_url);

    return NextResponse.json({
        success: true,
        media: {
            id: mediaRow.id,
            url: urlData.publicUrl,
            type: mediaRow.media_type,
        },
    });
}

/**
 * DELETE /api/admin/property-media
 * Body: { mediaId: string, mediaUrl: string }
 * Deletes a single media item from both Supabase Storage and the property_media table.
 */
export async function DELETE(request: NextRequest) {
    const { error: authError } = await verifyAdmin();
    if (authError) {
        return NextResponse.json({ error: authError }, { status: 401 });
    }

    const body = await request.json();
    const { mediaId, mediaUrl } = body as { mediaId: string; mediaUrl: string };

    if (!mediaId) {
        return NextResponse.json({ error: "Missing mediaId" }, { status: 400 });
    }

    const supabase = await createClient();

    // Delete from Storage — handle both raw paths and full public URLs
    if (mediaUrl && !mediaUrl.includes("://")) {
        await supabase.storage.from("property-media").remove([mediaUrl]);
    } else if (mediaUrl) {
        try {
            const url = new URL(mediaUrl);
            const marker = "/property-media/";
            const idx = url.pathname.indexOf(marker);
            if (idx !== -1) {
                const storagePath = url.pathname.slice(idx + marker.length);
                await supabase.storage.from("property-media").remove([storagePath]);
            }
        } catch {
            // URL parsing failed — skip storage deletion, still delete from DB
        }
    }

    // Delete DB record
    const { error } = await supabase
        .from("property_media")
        .delete()
        .eq("id", mediaId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
