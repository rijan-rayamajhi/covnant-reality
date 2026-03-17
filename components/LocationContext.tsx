"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { State, City, Locality } from "@/lib/api/locations";

const STORAGE_KEY = "covnant_selected_location";

export interface SelectedLocation {
    state?: State;
    city?: City;
    locality?: Locality;
}

interface LocationContextType {
    selectedLocation: SelectedLocation;
    setLocation: (location: SelectedLocation) => void;
    // Backward compatibility for components expecting `selectedCity`
    selectedCity: string;

    isLocationSelectorOpen: boolean;
    openLocationSelector: () => void;
    closeLocationSelector: () => void;
}

export const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
    const [selectedLocation, setSelectedLocation] = useState<SelectedLocation>({});
    const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    // On mount: read from localStorage. If nothing saved, auto-open selector.
    useEffect(() => {
        const loadSavedLocation = async () => {
            let savedStr: string | null = null;
            try {
                savedStr = localStorage.getItem(STORAGE_KEY);
            } catch {
                // localStorage may be unavailable
            }

            if (savedStr) {
                try {
                    const saved = JSON.parse(savedStr);
                    setSelectedLocation(saved);
                } catch (e) {
                    console.error("Error parsing saved location", e);
                }
            }
            setHydrated(true);
        };

        loadSavedLocation();
    }, []);

    const setLocation = useCallback((location: SelectedLocation) => {
        setSelectedLocation(location);
        setIsLocationSelectorOpen(false);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
        } catch {
            // localStorage may be unavailable
        }
    }, []);

    const openLocationSelector = useCallback(() => setIsLocationSelectorOpen(true), []);
    const closeLocationSelector = useCallback(() => setIsLocationSelectorOpen(false), []);

    // Don't render children until we've read localStorage to avoid hydration mismatch
    if (!hydrated) return null;

    return (
        <LocationContext.Provider
            value={{
                selectedLocation,
                setLocation,
                selectedCity: selectedLocation.city?.name || "",
                isLocationSelectorOpen,
                openLocationSelector,
                closeLocationSelector,
            }}
        >
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error("useLocation must be used within a LocationProvider");
    }
    return context;
}
