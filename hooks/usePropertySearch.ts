"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import type { SearchProperty, SearchFilters } from "@/types";
import { searchProperties } from "@/lib/supabase/search";

const PAGE_SIZE = 12;
const DEBOUNCE_MS = 400;

export interface UsePropertySearchReturn {
    results: SearchProperty[];
    totalCount: number;
    loading: boolean;
    error: string | null;
    filters: SearchFilters;
    page: number;
    pageSize: number;
    totalPages: number;
    setFilters: (f: SearchFilters) => void;
    updateFilter: (partial: Partial<SearchFilters>) => void;
    setPage: (p: number) => void;
    retry: () => void;
}

export function usePropertySearch(): UsePropertySearchReturn {
    const searchParams = useSearchParams();

    // Initialize filters from URL search params
    const initialFilters = useRef<SearchFilters>({
        city: searchParams.get("location") || undefined,
        cityId: searchParams.get("cityId") || undefined,
        stateId: searchParams.get("stateId") || undefined,
        localityId: searchParams.get("localityId") || undefined,
        listing_type: (() => {
            const t = searchParams.get("type");
            if (t === "buy") return "sell";
            if (t === "rent") return "rent";
            return undefined;
        })(),
        property_type: searchParams.get("category") || undefined,
        bedrooms: searchParams.get("bedrooms")
            ? Number(searchParams.get("bedrooms"))
            : undefined,
        is_verified: searchParams.get("verified") === "true" ? true : undefined,
        agentId: searchParams.get("agent") || undefined,
        include_connected: searchParams.get("include_connected") !== "false",
        sort_by: "newest",
    });

    const [filters, setFilters] = useState<SearchFilters>(initialFilters.current);
    const [results, setResults] = useState<SearchProperty[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);

    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchResults = useCallback(
        async (currentFilters: SearchFilters, currentPage: number) => {
            // Cancel any in-flight request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            const controller = new AbortController();
            abortControllerRef.current = controller;

            setLoading(true);
            setError(null);

            try {
                const offset = currentPage * PAGE_SIZE;
                const response = await searchProperties(
                    currentFilters,
                    PAGE_SIZE,
                    offset
                );

                // Only apply if not aborted
                if (!controller.signal.aborted) {
                    setResults(response.data);
                    setTotalCount(response.total);
                    setLoading(false);
                }
            } catch (err: unknown) {
                if (err instanceof Error && err.name === "AbortError") return;
                if (!controller.signal.aborted) {
                    setError(
                        err instanceof Error ? err.message : "Something went wrong"
                    );
                    setResults([]);
                    setTotalCount(0);
                    setLoading(false);
                }
            }
        },
        []
    );

    // Debounced fetch on filter change
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            fetchResults(filters, page);
        }, DEBOUNCE_MS);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [filters, fetchResults]); // eslint-disable-line react-hooks/exhaustive-deps

    // Immediate fetch on page change (no debounce)
    useEffect(() => {
        fetchResults(filters, page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const updateFilter = useCallback((partial: Partial<SearchFilters>) => {
        setPage(0); // Reset to first page on filter change
        setFilters((prev) => ({ ...prev, ...partial }));
    }, []);

    const retry = useCallback(() => {
        fetchResults(filters, page);
    }, [filters, page, fetchResults]);

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    return {
        results,
        totalCount,
        loading,
        error,
        filters,
        page,
        pageSize: PAGE_SIZE,
        totalPages,
        setFilters,
        updateFilter,
        setPage,
        retry,
    };
}
