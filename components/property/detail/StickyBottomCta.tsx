"use client";

import { useState } from "react";
import { Phone, MessageCircle, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { LeadModal, type LeadActionType } from "@/components/ui/LeadModal";
import type { Property } from "@/types";

interface StickyBottomCtaProps {
    property: Property;
}

export function StickyBottomCta({ property }: StickyBottomCtaProps) {
    const router = useRouter();
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        actionType: LeadActionType;
        onSuccess?: () => void;
    }>({ isOpen: false, actionType: "Book Visit" });

    const openModal = (actionType: LeadActionType, onSuccess?: () => void) => {
        setModalState({ isOpen: true, actionType, onSuccess });
    };

    const handleWhatsApp = () => {
        const waNumber = property.whatsappNumber || "911234567890";
        const url = window.location.href;
        const message = `Hi, I am interested in this property: ${property.title} (${url})`;
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${waNumber}?text=${encodedMessage}`, "_blank");
    };

    const handleCall = () => {
        const dialNumber = property.contactNumber || "1234567890";
        window.location.href = `tel:${dialNumber}`;
    };

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 max-w-screen-sm md:max-w-3xl mx-auto bg-bg-card border-t border-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)] lg:hidden">
                <div className="grid grid-cols-4 gap-2">
                    <button
                        onClick={handleCall}
                        className="flex flex-col items-center justify-center py-2.5 px-1 bg-bg-card border border-border text-text-primary rounded-xl hover:bg-slate-50 active:scale-95 transition-all"
                    >
                        <Phone className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-medium leading-none">Call</span>
                    </button>

                    <button
                        onClick={handleWhatsApp}
                        className="flex flex-col items-center justify-center py-2.5 px-1 bg-[#25D366] text-white rounded-xl hover:bg-[#20BE5C] active:scale-95 transition-all shadow-sm"
                    >
                        <MessageCircle className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-medium leading-none">WhatsApp</span>
                    </button>

                    {/* Chat CTA removed */}

                    <button
                        onClick={() => openModal("Book Visit", () => router.push("/dashboard?tab=visits"))}
                        className="flex flex-col items-center justify-center py-2.5 px-1 bg-primary border border-primary text-white rounded-xl hover:bg-primary-hover active:bg-primary-hover active:scale-95 transition-all shadow-sm"
                    >
                        <CalendarDays className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-medium leading-none">Book Visit</span>
                    </button>
                </div>
            </div>

            <LeadModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                actionType={modalState.actionType}
                onSuccessAction={modalState.onSuccess}
            />
        </>
    );
}
