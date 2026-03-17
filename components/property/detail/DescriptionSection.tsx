"use client";

import { useAuth } from "@/components/AuthContext";
import { Lock, LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";


interface DescriptionSectionProps {
    description: string;
}

export function DescriptionSection({ description }: DescriptionSectionProps) {
    const { user, isLoading } = useAuth();
    const pathname = usePathname();

    if (isLoading) return <div className="h-24 bg-slate-50 animate-pulse rounded-xl" />;

    if (!user) {
        return (
            <section className="py-6 border-b border-border bg-bg-card relative">
                <h3 className="text-lg font-bold text-text-primary mb-4">Description</h3>
                <div className="relative">
                    <p className="text-sm text-text-secondary line-clamp-2 blur-[3px] select-none">
                        {description || "No description available for this property. Connect with the owner for more details."}
                    </p>
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-card/40 backdrop-blur-[2px] rounded-xl border border-dashed border-border p-6 shadow-sm">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                            <Lock className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm font-semibold text-text-primary mb-1">Login to view description</p>
                        <p className="text-xs text-text-muted mb-4 text-center max-w-[200px]">
                            Get full access to all property details and owner information
                        </p>
                        <Link
                            href={`/login?next=${pathname}`}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover transition-all shadow-sm"
                        >
                            <LogIn className="w-4 h-4" />
                            Login Now
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-6 border-b border-border bg-bg-card">
            <h3 className="text-lg font-bold text-text-primary mb-4">Description</h3>
            <div className="prose prose-sm max-w-none">
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {description || "No description provided."}
                </p>
            </div>
        </section>
    );
}
