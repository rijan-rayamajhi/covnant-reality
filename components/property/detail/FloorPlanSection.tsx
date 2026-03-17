import Image from "next/image";
import { Maximize2 } from "lucide-react";
import type { Property } from "@/types";

interface FloorPlanSectionProps {
    property: Property;
}

export function FloorPlanSection({ property }: FloorPlanSectionProps) {
    const { bedrooms, area, type } = property;

    // Plots and commercial units don't have traditional floor plans
    if (type === "plot") return null;

    const label = bedrooms > 0 ? `${bedrooms} BHK` : type.charAt(0).toUpperCase() + type.slice(1);

    return (
        <section className="py-6 border-b border-border bg-bg-card">
            <h3 className="text-lg font-bold text-text-primary mb-4">Floor Plan</h3>

            <div className="border border-border rounded-2xl p-4 bg-bg-card">
                <h4 className="font-semibold text-text-primary mb-1">
                    {label}{area > 0 ? ` • ${area.toLocaleString()} sq.ft.` : ""}
                </h4>
                <p className="text-sm text-text-muted mb-4">Super Built-up Area</p>

                {/* Floor Plan Image or Placeholder */}
                <div className="relative w-full aspect-[4/3] bg-bg-card border border-border rounded-xl overflow-hidden mb-4 flex items-center justify-center group">
                    {property.floorPlans && property.floorPlans.length > 0 ? (
                        <>
                            <Image
                                src={property.floorPlans[0]}
                                alt={`${label} Floor Plan`}
                                fill
                                className="object-contain p-2"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
                                    <Maximize2 className="w-4 h-4 text-text-primary" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="absolute inset-0 bg-bg" />

                            {/* Grid overlay */}
                            <div className="absolute inset-0 border-[0.5px] border-primary/10 grid grid-cols-6 grid-rows-4">
                                {Array.from({ length: 24 }).map((_, i) => (
                                    <div key={i} className="border-[0.5px] border-primary/10" />
                                ))}
                            </div>

                            {/* Center icon */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 bg-bg-card/90 rounded-full shadow-sm flex items-center justify-center text-text-primary">
                                    <Maximize2 className="w-5 h-5" />
                                </div>
                            </div>

                            {/* Label */}
                            <div className="absolute bottom-3 left-0 right-0 text-center">
                                <span className="text-xs text-text-muted bg-bg-card/80 px-3 py-1 rounded-full">
                                    Floor plan not uploaded
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
