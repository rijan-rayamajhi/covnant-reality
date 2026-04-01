"use client";

import { X, Loader2, AlertCircle, CheckCircle2, Trash2, Camera, MapPin, Phone, Info, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { AdminProperty } from "@/lib/supabase/admin";
import { updateAdminProperty, deletePropertyMedia, uploadPropertyMedia } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

interface EditListingModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: AdminProperty | null;
    onSaved?: () => void;
}

type FormData = {
    title: string;
    description: string;
    listing_type: string;
    property_type: string;
    commercial_type: string;
    price: string;
    area_sqft: string;
    area_unit: string;
    bedrooms: string;
    bathrooms: string;
    furnishing: string;
    facing: string;
    floor: string;
    total_floors: string;
    possession_status: string;
    address: string;
    locality: string;
    city: string;
    state: string;
    pincode: string;
    landmark: string;
    rera_number: string;
    contact_number: string;
    whatsapp_number: string;
    allow_phone: boolean;
    allow_whatsapp: boolean;
    allow_chat: boolean;
    amenities: string[];
    is_featured: boolean;
    is_verified: boolean;
    status: string;
};

const LISTING_TYPES = ["sell", "rent"];
const PROPERTY_TYPES = ["apartment", "villa", "house", "plot", "commercial", "pg"];
const FURNISHING_OPTIONS = ["unfurnished", "semi_furnished", "furnished"];
const AREA_UNITS = ["sq ft", "sq yd", "sq mt", "acre", "gunta", "bigha"];
const FACING_OPTIONS = ["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"];
const PROPERTY_STATUS_OPTIONS = ["pending", "approved", "rejected", "sold", "rented"];

export function EditListingModal({ isOpen, onClose, property, onSaved }: EditListingModalProps) {
    const [form, setForm] = useState<FormData>({
        title: "",
        description: "",
        listing_type: "sell",
        property_type: "apartment",
        commercial_type: "",
        price: "",
        area_sqft: "",
        area_unit: "sq ft",
        bedrooms: "",
        bathrooms: "",
        furnishing: "unfurnished",
        facing: "",
        floor: "",
        total_floors: "",
        possession_status: "",
        address: "",
        locality: "",
        city: "",
        state: "",
        pincode: "",
        landmark: "",
        rera_number: "",
        contact_number: "",
        whatsapp_number: "",
        allow_phone: true,
        allow_whatsapp: true,
        allow_chat: true,
        amenities: [],
        is_featured: false,
        is_verified: false,
        status: "pending",
    });
    const [newAmenity, setNewAmenity] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<"general" | "location" | "media" | "contacts" | "admin">("general");
    const [mediaItems, setMediaItems] = useState<{ id: string; url: string; type: string }[]>([]);
    const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);
    const [mediaError, setMediaError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const uploadInputRef = useRef<HTMLInputElement>(null);

    const lastPropId = useRef<string | null>(null);
    useEffect(() => {
        if (property && property.id !== lastPropId.current) {
            lastPropId.current = property.id;
            
            // Defer updates to satisfy "synchronous setState in effect" lint error
            Promise.resolve().then(() => {
                setForm({
                    title: property.title ?? "",
                    description: property.description ?? "",
                    listing_type: property.listing_type ?? "sell",
                    property_type: property.property_type ?? "apartment",
                    commercial_type: property.commercial_type ?? "",
                    price: String(property.price ?? ""),
                    area_sqft: String(property.area_sqft ?? ""),
                    area_unit: property.area_unit ?? "sq ft",
                    bedrooms: String(property.bedrooms ?? ""),
                    bathrooms: String(property.bathrooms ?? ""),
                    furnishing: property.furnishing ?? "unfurnished",
                    facing: property.facing ?? "",
                    floor: String(property.floor ?? ""),
                    total_floors: String(property.total_floors ?? ""),
                    possession_status: property.possession_status ?? "",
                    address: property.address ?? "",
                    locality: property.locality ?? "",
                    city: property.city ?? "",
                    state: property.state ?? "",
                    pincode: property.pincode ?? "",
                    landmark: property.landmark ?? "",
                    rera_number: property.rera_number ?? "",
                    contact_number: property.contact_number ?? "",
                    whatsapp_number: property.whatsapp_number ?? "",
                    allow_phone: property.allow_phone ?? true,
                    allow_whatsapp: property.allow_whatsapp ?? true,
                    allow_chat: property.allow_chat ?? true,
                    amenities: property.amenities ?? [],
                    is_featured: property.is_featured ?? false,
                    is_verified: property.is_verified ?? false,
                    status: property.status ?? "pending",
                });
                setMediaItems(property.media ?? []);
                setError(null);
                setSuccess(false);
                setMediaError(null);
                setActiveTab("general");
            });
        }
    }, [property]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "unset";
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    if (!isOpen || !property) return null;

    const set = (key: keyof FormData, value: string | boolean | string[]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const addAmenity = () => {
        if (newAmenity.trim() && !form.amenities.includes(newAmenity.trim())) {
            set("amenities", [...form.amenities, newAmenity.trim()]);
            setNewAmenity("");
        }
    };

    const removeAmenity = (index: number) => {
        const updated = [...form.amenities];
        updated.splice(index, 1);
        set("amenities", updated);
    };

    const handleDeleteMedia = async (mediaId: string, mediaUrl: string) => {
        if (!window.confirm("Permanently delete this image? This cannot be undone.")) return;
        setDeletingMediaId(mediaId);
        setMediaError(null);
        const { error: err } = await deletePropertyMedia(mediaId, mediaUrl);
        setDeletingMediaId(null);
        if (err) {
            setMediaError(err);
            return;
        }
        setMediaItems(prev => prev.filter(m => m.id !== mediaId));
    };

    const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length || !property) return;
        setUploading(true);
        setMediaError(null);
        for (const file of files) {
            // Determine media type from file MIME
            const mt: "image" | "video" | "floorplan" = file.type.startsWith("video/") ? "video" : "image";
            const { media, error: err } = await uploadPropertyMedia(property.id, property.owner_id, file, mt);
            if (err) {
                setMediaError(`Failed to upload "${file.name}": ${err}`);
                break;
            }
            if (media) setMediaItems(prev => [...prev, media]);
        }
        setUploading(false);
        // Reset the input so the same file can be re-selected
        if (uploadInputRef.current) uploadInputRef.current.value = "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!property) return;

        setSaving(true);
        setError(null);
        setSuccess(false);

        const { error: err } = await updateAdminProperty(property.id, {
            title: form.title.trim(),
            description: form.description.trim() || null,
            listing_type: form.listing_type,
            property_type: form.property_type,
            commercial_type: form.commercial_type.trim() || null,
            price: Number(form.price),
            area_sqft: Number(form.area_sqft),
            area_unit: form.area_unit,
            bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
            bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
            furnishing: form.furnishing || null,
            facing: form.facing || null,
            floor: form.floor ? Number(form.floor) : null,
            total_floors: form.total_floors ? Number(form.total_floors) : null,
            possession_status: form.possession_status || null,
            address: form.address.trim(),
            locality: form.locality.trim() || null,
            city: form.city.trim(),
            state: form.state.trim() || null,
            pincode: form.pincode.trim() || null,
            landmark: form.landmark.trim() || null,
            rera_number: form.rera_number.trim() || null,
            contact_number: form.contact_number.trim() || null,
            whatsapp_number: form.whatsapp_number.trim() || null,
            allow_phone: form.allow_phone,
            allow_whatsapp: form.allow_whatsapp,
            allow_chat: form.allow_chat,
            amenities: form.amenities,
            is_featured: form.is_featured,
            is_verified: form.is_verified,
            status: form.status as AdminProperty["status"],
        });

        setSaving(false);

        if (err) {
            setError(err);
            return;
        }

        setSuccess(true);
        onSaved?.();
        setTimeout(() => {
            onClose();
            setSuccess(false);
        }, 1200);
    };

    const tabCls = (id: typeof activeTab) => cn(
        "flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap",
        activeTab === id ? "border-primary text-primary bg-primary/5" : "border-transparent text-text-muted hover:text-text-primary hover:bg-slate-50"
    );

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full sm:max-w-5xl bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[92vh] animate-in fade-in slide-in-from-bottom-4 duration-300">
                
                {/* Header Profile Info */}
                <div className="px-6 py-5 border-b border-border bg-white sticky top-0 z-30">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                            <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-border overflow-hidden relative">
                                {property.media?.[0] ? (
                                    <Image src={property.media[0].url} alt={property.title} fill className="object-cover" unoptimized />
                                ) : (
                                    <Camera className="w-6 h-6 text-text-muted" />
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-text-primary leading-tight line-clamp-1">{property.title}</h2>
                                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                    <span className={cn(
                                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        property.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                    )}>
                                        {property.status}
                                    </span>
                                    <span className="text-xs text-text-muted flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {property.city}, {property.state}
                                    </span>
                                    <span className="text-xs text-primary font-bold">₹{property.price.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 -mr-1 text-text-muted hover:text-text-primary hover:bg-slate-100 rounded-full transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-1 mt-6 border-b border-border -mx-6 px-6 overflow-x-auto no-scrollbar">
                        <div onClick={() => setActiveTab("general")} className={tabCls("general")}>
                            <Info className="w-4 h-4" /> General Info
                        </div>
                        <div onClick={() => setActiveTab("location")} className={tabCls("location")}>
                            <MapPin className="w-4 h-4" /> Location
                        </div>
                        <div onClick={() => setActiveTab("media")} className={tabCls("media")}>
                            <Camera className="w-4 h-4" /> Media & Images
                        </div>
                        <div onClick={() => setActiveTab("contacts")} className={tabCls("contacts")}>
                            <Phone className="w-4 h-4" /> Contacts
                        </div>
                        <div onClick={() => setActiveTab("admin")} className={tabCls("admin")}>
                            <X className="w-4 h-4" /> System Control
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 h-full bg-slate-50/30">
                    <div className="p-6">
                        
                        {/* TAB: GENERAL */}
                        {activeTab === "general" && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                <section>
                                    <Field label="Property Title" required>
                                        <input type="text" required value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} />
                                    </Field>
                                </section>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <Field label="Listing Type">
                                        <select value={form.listing_type} onChange={(e) => set("listing_type", e.target.value)} className={inputCls}>
                                            {LISTING_TYPES.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Property Category">
                                        <select value={form.property_type} onChange={(e) => set("property_type", e.target.value)} className={inputCls}>
                                            {PROPERTY_TYPES.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Price (₹)" required>
                                        <input type="number" required value={form.price} onChange={(e) => set("price", e.target.value)} className={inputCls} />
                                    </Field>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                                    <Field label="Area Size">
                                        <input type="number" required value={form.area_sqft} onChange={(e) => set("area_sqft", e.target.value)} className={inputCls} />
                                    </Field>
                                    <Field label="Unit">
                                        <select value={form.area_unit} onChange={(e) => set("area_unit", e.target.value)} className={inputCls}>
                                            {AREA_UNITS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Bedrooms">
                                        <input type="number" value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} className={inputCls} />
                                    </Field>
                                    <Field label="Bathrooms">
                                        <input type="number" value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} className={inputCls} />
                                    </Field>
                                </div>

                                <section>
                                    <Field label="Description">
                                        <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={6} className={cn(inputCls, "resize-none")} placeholder="Tell prospective buyers about this property..." />
                                    </Field>
                                </section>

                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Property Amenities</label>
                                        <span className="text-[10px] text-text-muted">{form.amenities.length} Added</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="text" value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())} className={inputCls} placeholder="Type an amenity and hit Enter..." />
                                        <button type="button" onClick={addAmenity} className="px-5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-bold text-xs">ADD</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 p-4 bg-white border border-border rounded-2xl min-h-[60px]">
                                        {form.amenities.map((item, idx) => (
                                            <span key={idx} className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-border rounded-full text-xs font-semibold text-text-primary group">
                                                {item}
                                                <button type="button" onClick={() => removeAmenity(idx)} className="text-text-muted hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* TAB: LOCATION */}
                        {activeTab === "location" && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                <Field label="Full Street Address">
                                    <input type="text" required value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
                                </Field>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <Field label="Locality / Area">
                                        <input type="text" value={form.locality} onChange={(e) => set("locality", e.target.value)} className={inputCls} />
                                    </Field>
                                    <Field label="Landmark">
                                        <input type="text" value={form.landmark} onChange={(e) => set("landmark", e.target.value)} className={inputCls} />
                                    </Field>
                                    <Field label="City">
                                        <input type="text" required value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
                                    </Field>
                                    <Field label="State">
                                        <input type="text" required value={form.state} onChange={(e) => set("state", e.target.value)} className={inputCls} />
                                    </Field>
                                    <Field label="Pincode">
                                        <input type="text" value={form.pincode} onChange={(e) => set("pincode", e.target.value)} className={inputCls} />
                                    </Field>
                                </div>
                            </div>
                        )}

                        {/* TAB: MEDIA */}
                        {activeTab === "media" && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-text-primary">Property Gallery</h3>
                                        <p className="text-[11px] text-text-muted">Hover to delete &middot; Click &quot;Add Images&quot; to upload new ones</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full">{mediaItems.length} ITEMS</span>
                                        <button
                                            type="button"
                                            onClick={() => uploadInputRef.current?.click()}
                                            disabled={uploading}
                                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 shadow-md shadow-primary/20"
                                        >
                                            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                            {uploading ? "Uploading..." : "Add Images"}
                                        </button>
                                        {/* Hidden file input */}
                                        <input
                                            ref={uploadInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime"
                                            multiple
                                            className="hidden"
                                            onChange={handleUploadFiles}
                                        />
                                    </div>
                                </div>

                                {/* Error banner */}
                                {mediaError && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{mediaError}</span>
                                    </div>
                                )}

                                {/* Gallery grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {/* Uploading placeholder */}
                                    {uploading && (
                                        <div className="aspect-[4/3] rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="w-7 h-7 text-primary animate-spin" />
                                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Uploading…</span>
                                        </div>
                                    )}

                                    {/* Empty state */}
                                    {mediaItems.length === 0 && !uploading && (
                                        <div className="col-span-full flex flex-col items-center justify-center gap-3 py-20 text-text-muted">
                                            <Camera className="w-12 h-12" />
                                            <p className="text-sm font-medium">No images yet</p>
                                            <button
                                                type="button"
                                                onClick={() => uploadInputRef.current?.click()}
                                                className="mt-2 text-xs font-bold text-primary underline"
                                            >
                                                Upload the first image
                                            </button>
                                        </div>
                                    )}

                                    {/* Existing images */}
                                    {mediaItems.map((item) => (
                                        <div key={item.id} className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border group bg-slate-100 shadow-sm hover:shadow-md transition-all">
                                            <Image
                                                src={item.url}
                                                alt="Property image"
                                                width={200}
                                                height={150}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                                                unoptimized
                                            />
                                            {/* Hover overlay with delete */}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                {deletingMediaId === item.id ? (
                                                    <div className="p-2 bg-white/20 rounded-full">
                                                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteMedia(item.id, item.url)}
                                                        className="p-2.5 bg-red-500 text-white rounded-full hover:bg-red-600 active:scale-95 transition-all shadow-lg"
                                                        title="Delete image permanently"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            {/* Type badge */}
                                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[9px] font-bold text-white uppercase tracking-wider backdrop-blur-md">
                                                {item.type}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Warning note */}
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 items-start">
                                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-amber-900">Immediate Effect</p>
                                        <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">Uploads and deletions take effect immediately — no need to click Save. Deleted images are permanently removed from Supabase Storage.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: CONTACTS */}
                        {activeTab === "contacts" && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <Field label="Primary Contact Number">
                                            <input type="text" value={form.contact_number} onChange={(e) => set("contact_number", e.target.value)} className={inputCls} />
                                        </Field>
                                        <Field label="WhatsApp Number">
                                            <input type="text" value={form.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} className={inputCls} />
                                        </Field>
                                    </div>
                                    <div className="p-6 bg-slate-50 border border-border rounded-2xl space-y-4">
                                        <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2 mb-4">Communication Controls</h4>
                                        <Toggle label="Enable Direct Calls" description="Public phone number visible" checked={form.allow_phone} onChange={(v) => set("allow_phone", v)} />
                                        <Toggle label="Enable WhatsApp" description="Quick chat button active" checked={form.allow_whatsapp} onChange={(v) => set("allow_whatsapp", v)} />
                                        <Toggle label="Internal Messenger" description="Allow in-app chat" checked={form.allow_chat} onChange={(v) => set("allow_chat", v)} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: SYSTEM CONTROL (ADMIN) */}
                        {activeTab === "admin" && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <Field label="Moderation Action">
                                            <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
                                                {PROPERTY_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                                            </select>
                                        </Field>
                                        <Field label="RERA Registration ID">
                                            <input type="text" value={form.rera_number} onChange={(e) => set("rera_number", e.target.value)} className={inputCls} />
                                        </Field>
                                    </div>
                                    <div className="p-6 bg-slate-50 border border-border rounded-2xl space-y-4">
                                        <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2 mb-4">Market Status</h4>
                                        <Toggle label="Verified Listing" description="Display verified badge" checked={form.is_verified} onChange={(v) => set("is_verified", v)} />
                                        <Toggle label="Featured on Home" description="Priority search ranking" checked={form.is_featured} onChange={(v) => set("is_featured", v)} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                    <Field label="Furnishing">
                                        <select value={form.furnishing || ""} onChange={(e) => set("furnishing", e.target.value)} className={inputCls}>
                                            <option value="">N/A</option>
                                            {FURNISHING_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.replace('_', ' ').toUpperCase()}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Facing">
                                        <select value={form.facing || ""} onChange={(e) => set("facing", e.target.value)} className={inputCls}>
                                            <option value="">N/A</option>
                                            {FACING_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Floor No.">
                                        <input type="number" value={form.floor} onChange={(e) => set("floor", e.target.value)} className={inputCls} />
                                    </Field>
                                    <Field label="Total Floors">
                                        <input type="number" value={form.total_floors} onChange={(e) => set("total_floors", e.target.value)} className={inputCls} />
                                    </Field>
                                </div>
                            </div>
                        )}

                        {/* Message Center */}
                        <div className="mt-8">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="font-medium">{error}</p>
                                </div>
                            )}
                            {success && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-sm flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                                    <p className="font-medium">Property listing updated successfully!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-6 py-5 border-t border-border bg-white flex items-center justify-end gap-3 shrink-0 sticky bottom-0 z-30">
                        <button type="button" onClick={onClose} disabled={saving} className="px-6 py-2.5 text-sm font-bold text-text-secondary hover:text-text-primary transition-all disabled:opacity-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="flex items-center gap-3 px-10 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-2xl shadow-xl shadow-primary/20 transition-all disabled:opacity-70">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {saving ? "SAVING..." : "PUBLISH UPDATES"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const inputCls = "w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm font-medium text-text-primary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-text-muted/40 shadow-sm";

function Field({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string; }) {
    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.1em] ml-1">
                {label}{required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {children}
        </div>
    );
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (val: boolean) => void; }) {
    return (
        <div className="flex items-center justify-between p-4 bg-white border border-border rounded-xl hover:shadow-sm transition-all cursor-pointer group" onClick={() => onChange(!checked)}>
            <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-bold text-text-primary leading-tight">{label}</span>
                <span className="text-[10px] text-text-muted font-medium">{description}</span>
            </div>
            <div className={cn("relative w-10 h-6 rounded-full transition-all duration-300", checked ? "bg-primary" : "bg-slate-200")}>
                <div className={cn("absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm", checked ? "translate-x-4" : "translate-x-0")} />
            </div>
        </div>
    );
}
