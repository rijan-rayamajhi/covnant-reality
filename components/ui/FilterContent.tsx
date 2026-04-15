'use client';

import type { SearchFilters } from '@/types';

interface FilterContentProps {
    filters: SearchFilters;
    onFilterChange: (partial: Partial<SearchFilters>) => void;
}

export function FilterContent({ filters, onFilterChange }: FilterContentProps) {
    const toggleBedrooms = (val: string) => {
        if (val === '4+') {
            onFilterChange({ bedrooms: filters.bedrooms === 4 ? undefined : 4 });
        } else {
            const num = parseInt(val, 10);
            onFilterChange({ bedrooms: filters.bedrooms === num ? undefined : num });
        }
    };

    return (
        <div className="flex flex-col gap-8">
            {/* 2. Listing Type */}
            <section>
                <h3 className="text-base font-semibold text-text-primary mb-4">
                    Listing Type
                </h3>
                <div className="flex flex-wrap gap-2">
                    {[
                        { label: 'Buy', value: 'sell' },
                        { label: 'Rent', value: 'rent' },
                    ].map((item) => (
                        <button
                            key={item.value}
                            onClick={() =>
                                onFilterChange({
                                    listing_type:
                                        filters.listing_type === item.value
                                            ? undefined
                                            : item.value,
                                })
                            }
                            className={`px-5 py-2 rounded-full border text-sm font-medium transition-all ${filters.listing_type === item.value
                                ? 'bg-primary border-primary text-white shadow-sm'
                                : 'bg-white border-border text-text-secondary hover:border-text-secondary/30'
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </section>

            <hr className="border-t border-border" />

            {/* 3. BHK */}
            <section>
                <h3 className="text-base font-semibold text-text-primary mb-4">
                    BHK
                </h3>
                <div className="flex flex-wrap gap-2">
                    {['1', '2', '3', '4+'].map((val) => {
                        const numVal = val === '4+' ? 4 : parseInt(val, 10);
                        const isActive = filters.bedrooms === numVal;
                        return (
                            <button
                                key={val}
                                onClick={() => toggleBedrooms(val)}
                                className={`px-5 py-2 rounded-full border text-sm font-medium transition-all ${isActive
                                    ? 'bg-primary border-primary text-white shadow-sm'
                                    : 'bg-white border-border text-text-secondary hover:border-text-secondary/30'
                                    }`}
                            >
                                {val} BHK
                            </button>
                        );
                    })}
                </div>
            </section>

            <hr className="border-t border-border" />

            {/* 4. Verified Only toggle */}
            <section>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-text-primary mb-1">
                            Verified Properties
                        </h3>
                        <p className="text-xs text-text-secondary">
                            Show only physically verified listings
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={filters.is_verified === true}
                            onChange={() =>
                                onFilterChange({
                                    is_verified: filters.is_verified ? undefined : true,
                                })
                            }
                        />
                        <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
            </section>

            <hr className="border-t border-border" />

            {/* 5. Include Connected Districts toggle */}
            <section>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-text-primary mb-1">
                            Include Nearby Areas
                        </h3>
                        <p className="text-xs text-text-secondary">
                            Include properties from connected districts
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={filters.include_connected !== false}
                            onChange={(e) =>
                                onFilterChange({
                                    include_connected: e.target.checked,
                                })
                            }
                        />
                        <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
            </section>
        </div>
    );
}
