"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

interface PropertyContextType {
    savedProperties: string[];
    toggleSave: (propertyId: string) => void;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export function PropertyProvider({ children }: { children: ReactNode }) {
    const [savedProperties, setSavedProperties] = useState<string[]>([]);
    const [userId, setUserId] = useState<string | null>(null);

    // ── Load current user and their saved properties from Supabase ───────────
    const loadSavedProperties = useCallback(async (uid: string) => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("saved_properties")
            .select("property_id")
            .eq("user_id", uid);

        if (!error && data) {
            setSavedProperties(data.map((row) => row.property_id));
        }
    }, []);

    useEffect(() => {
        const supabase = createClient();

        // Get the current session immediately
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setUserId(user.id);
                loadSavedProperties(user.id);
            }
        });

        // Listen for auth state changes (login / logout)
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            const user = session?.user ?? null;
            setUserId(user?.id ?? null);
            if (user) {
                loadSavedProperties(user.id);
            } else {
                setSavedProperties([]);
            }
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, [loadSavedProperties]);

    // ── Toggle save/unsave in Supabase ───────────────────────────────────────
    const toggleSave = useCallback(
        async (propertyId: string) => {
            if (!userId) return; // Not logged in — PropertyCard redirects to login

            const isCurrentlySaved = savedProperties.includes(propertyId);
            const supabase = createClient();

            // Optimistic UI update
            setSavedProperties((prev) =>
                isCurrentlySaved
                    ? prev.filter((id) => id !== propertyId)
                    : [...prev, propertyId]
            );

            if (isCurrentlySaved) {
                // Remove from Supabase
                const { error } = await supabase
                    .from("saved_properties")
                    .delete()
                    .eq("user_id", userId)
                    .eq("property_id", propertyId);

                if (error) {
                    console.error("[PropertyContext] Failed to unsave property:", error.message);
                    // Revert optimistic update
                    setSavedProperties((prev) => [...prev, propertyId]);
                }
            } else {
                // Insert into Supabase
                const { error } = await supabase
                    .from("saved_properties")
                    .insert({ user_id: userId, property_id: propertyId });

                if (error) {
                    console.error("[PropertyContext] Failed to save property:", error.message);
                    // Revert optimistic update
                    setSavedProperties((prev) => prev.filter((id) => id !== propertyId));
                }
            }
        },
        [userId, savedProperties]
    );

    return (
        <PropertyContext.Provider value={{ savedProperties, toggleSave }}>
            {children}
        </PropertyContext.Provider>
    );
}

export function usePropertyContext() {
    const context = useContext(PropertyContext);
    if (context === undefined) {
        throw new Error("usePropertyContext must be used within a PropertyProvider");
    }
    return context;
}
