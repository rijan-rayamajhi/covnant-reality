import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";




export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    // If a ?next= param was provided, honour it; otherwise compute from role
    const explicitNext = searchParams.get("next");

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(
            code
        );

        if (!error) {
            // Use explicit ?next= if provided, otherwise redirect to home
            const redirectPath = explicitNext ?? '/';
            return NextResponse.redirect(`${origin}${redirectPath}`);
        }
    }

    // Return the user to login on error
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
