"use client";

import { useState } from "react";
import { X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { createLead, type LeadActionType } from "@/lib/supabase/leads";

interface LeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    actionType: LeadActionType;
    onSuccessAction?: () => void;
}

export type { LeadActionType };

export function LeadModal({ isOpen, onClose, actionType, onSuccessAction }: LeadModalProps) {
    const params = useParams();
    const propertyId = (params.id as string) || "unknown_property";

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !phone.trim()) return;

        if (!/^\d{10}$/.test(phone)) {
            setError("Please enter a valid 10-digit phone number.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const result = await createLead({
            propertyId,
            name,
            phone,
            source: actionType,
        });

        setIsSubmitting(false);

        if (!result.success) {
            setError(result.error ?? "Something went wrong. Please try again.");
            return;
        }

        setIsSubmitted(true);
        setTimeout(() => {
            setIsSubmitted(false);
            setName("");
            setPhone("");
            onClose();
            if (onSuccessAction) onSuccessAction();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 text-text-muted"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5" />
                </button>

                {isSubmitted ? (
                    <div className="flex flex-col items-center text-center gap-4 py-6">
                        <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                        <h3 className="text-xl font-bold text-text-primary">Request Submitted!</h3>
                        <p className="text-sm text-text-secondary">
                            We&apos;ve received your details.{" "}
                            {actionType === "Call"
                                ? "Calling agent..."
                                : actionType === "WhatsApp"
                                    ? "Opening WhatsApp..."
                                    : actionType === "Chat"
                                        ? "Redirecting to chat..."
                                        : "Our agent will contact you shortly to confirm the visit."}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col text-center gap-4">
                        <h3 className="text-xl font-bold text-text-primary">
                            {actionType === "Book Visit" ? "Book a Site Visit" : `Contact via ${actionType}`}
                        </h3>
                        <p className="text-sm text-text-secondary">
                            Please provide your details to{" "}
                            {actionType === "Book Visit" ? "schedule a visit" : "connect with the agent"}.
                        </p>

                        {error && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 mt-2">
                            <input
                                type="text"
                                placeholder="Your Name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSubmitting}
                                className="w-full h-12 px-4 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                            />
                            <input
                                type="tel"
                                placeholder="Phone Number (10 digits)"
                                required
                                value={phone}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "");
                                    if (val.length <= 10) setPhone(val);
                                }}
                                disabled={isSubmitting}
                                className="w-full h-12 px-4 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                            />

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-12 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-colors mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Submitting…
                                    </>
                                ) : (
                                    `Continue to ${actionType}`
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
