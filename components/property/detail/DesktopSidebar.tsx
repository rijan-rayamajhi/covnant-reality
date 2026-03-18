"use client";

import { useState } from "react";
import { Phone, MessageCircle, CalendarDays, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { LeadModal, type LeadActionType } from "@/components/ui/LeadModal";
import type { Property } from "@/types";

interface DesktopSidebarProps {
    property: Property;
}

function formatPrice(price: number, listingType?: "sell" | "rent"): string {
    let label = "";
    if (price >= 10000000) label = `₹ ${(price / 10000000).toFixed(2)} Cr`;
    else if (price >= 100000) label = `₹ ${(price / 100000).toFixed(1)} L`;
    else label = `₹ ${price.toLocaleString("en-IN")}`;
    return listingType === "rent" ? `${label} / mo` : label;
}

function calcEmi(price: number): string {
    const principal = price * 0.8;
    const r = 8.5 / 12 / 100;
    const n = 240;
    const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    if (emi >= 100000) return `₹ ${(emi / 100000).toFixed(1)} L/mo EMI`;
    return `₹ ${Math.round(emi).toLocaleString("en-IN")}/mo EMI`;
}

export function DesktopSidebar({ property }: DesktopSidebarProps) {
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
            <div className="sticky top-24">
                <div className="bg-bg-card rounded-2xl shadow-md p-6 border border-border">
                    {/* Price Summary */}
                    <div className="mb-5">
                        <h2 className="text-3xl font-bold text-text-primary">
                            {formatPrice(property.price, property.listingType)}
                        </h2>
                        {property.listingType !== "rent" && (
                            <p className="text-sm text-text-muted mt-0.5">{calcEmi(property.price)}</p>
                        )}
                    </div>

                    <div className="w-full h-px bg-border mb-5" />

                    {/* Contact Buttons */}
                    <div className="space-y-3 mb-4">
                        <button
                            onClick={handleCall}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-bg-card border border-border text-text-primary rounded-xl text-sm font-medium hover:bg-slate-50 active:scale-[0.98] transition-all"
                        >
                            <Phone className="w-4 h-4" />
                            Call Now
                        </button>
                        <button
                            onClick={handleWhatsApp}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-xl text-sm font-medium hover:bg-[#20BE5C] active:scale-[0.98] transition-all shadow-sm"
                        >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                        </button>
                        {/* Chat CTA removed */}
                    </div>

                    {/* Book Visit – Primary CTA */}
                    <button
                        onClick={() => openModal("Book Visit", () => router.push("/dashboard?tab=visits"))}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover active:bg-primary-hover active:scale-[0.98] transition-all shadow-sm"
                    >
                        <CalendarDays className="w-4 h-4" />
                        Book a Site Visit
                    </button>

                    <div className="w-full h-px bg-border my-5" />

                    {/* Property quick stats */}
                    <div className="grid grid-cols-3 gap-3 text-center mb-5">
                        {property.bedrooms > 0 && (
                            <div className="bg-bg rounded-xl p-2 border border-border">
                                <p className="text-base font-bold text-text-primary">{property.bedrooms}</p>
                                <p className="text-[10px] text-text-muted">Beds</p>
                            </div>
                        )}
                        {property.bathrooms > 0 && (
                            <div className="bg-bg rounded-xl p-2 border border-border">
                                <p className="text-base font-bold text-text-primary">{property.bathrooms}</p>
                                <p className="text-[10px] text-text-muted">Baths</p>
                            </div>
                        )}
                        {property.area > 0 && (
                            <div className="bg-bg rounded-xl p-2 border border-border">
                                <p className="text-base font-bold text-text-primary">{property.area.toLocaleString()}</p>
                                <p className="text-[10px] text-text-muted">sqft</p>
                            </div>
                        )}
                    </div>

                    {/* Verified Badge */}
                    {property.verified && (
                        <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-xl p-3">
                            <ShieldCheck className="w-5 h-5 text-accent flex-shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-accent-hover">Verified Property</p>
                                <p className="text-[10px] text-accent">Independently verified by Covnant Reality India PVT LTD</p>
                            </div>
                        </div>
                    )}
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
