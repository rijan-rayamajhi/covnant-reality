"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { City, getStates, getCitiesByState, State } from "@/lib/api/locations";
import { 
    DistrictIntegration, 
    getDistrictIntegrations, 
    addDistrictIntegration, 
    removeDistrictIntegration,
    getIntegratedPropertyCount
} from "@/lib/api/district_integrations";
import { AlertCircle, Loader2, Search, Link as LinkIcon, Plus, X } from "lucide-react";

interface GroupedIntegration {
    mainCity: City;
    connections: { integrationId: string; connectedCity: City }[];
    propertyCount?: number;
}

export default function DistrictIntegrationsPage() {
    const [states, setStates] = useState<State[]>([]);
    const [selectedStateId, setSelectedStateId] = useState<string>("");
    
    const [cities, setCities] = useState<City[]>([]);
    const [integrations, setIntegrations] = useState<DistrictIntegration[]>([]);
    const [propertyCounts, setPropertyCounts] = useState<Record<string, number>>({});
    
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form settings
    const [mainDistrictId, setMainDistrictId] = useState<string>("");
    const [connectedDistrictIds, setConnectedDistrictIds] = useState<string[]>([]);
    
    // UI states
    const [searchQuery, setSearchQuery] = useState("");
    const [isMultiSelectOpen, setIsMultiSelectOpen] = useState(false);

    useEffect(() => {
        loadInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedStateId) {
            loadCities(selectedStateId);
        } else {
            setCities([]);
        }
    }, [selectedStateId]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [statesData, integrationsData] = await Promise.all([
                getStates(),
                getDistrictIntegrations()
            ]);
            setStates(statesData);
            setIntegrations(integrationsData);
            
            if (statesData.length > 0) {
                const firstStateId = statesData[0].id;
                setSelectedStateId(firstStateId);
                await loadCities(firstStateId);
            }
        } catch {
            setError("Failed to load initial data");
        } finally {
            setLoading(false);
        }
    };

    const loadCities = async (stateId: string) => {
        try {
            const data = await getCitiesByState(stateId);
            setCities(data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadIntegrationsAndCounts = async () => {
        const data = await getDistrictIntegrations();
        setIntegrations(data);
        
        // Let effect sync counts later
    };

    // Derived state for grouped integrations
    const groupedIntegrations = useMemo(() => {
        if (!cities.length) return [];
        
        const cityMap = new Map(cities.map(c => [c.id, c]));
        const groupsMap = new Map<string, GroupedIntegration>();
        
        integrations.forEach(integ => {
            const mainCity = cityMap.get(integ.main_district_id);
            const connectedCity = cityMap.get(integ.connected_district_id);
            
            // Only show integrations for the currently loaded state/cities
            if (!mainCity || !connectedCity) return;
            
            if (!groupsMap.has(integ.main_district_id)) {
                groupsMap.set(integ.main_district_id, {
                    mainCity,
                    connections: [],
                });
            }
            
            groupsMap.get(integ.main_district_id)!.connections.push({
                integrationId: integ.id,
                connectedCity
            });
        });
        
        return Array.from(groupsMap.values());
    }, [integrations, cities]);
    
    // Fetch counts when groups change
    useEffect(() => {
        groupedIntegrations.forEach(group => {
            if (propertyCounts[group.mainCity.id] === undefined) {
                getIntegratedPropertyCount(group.mainCity.name).then(count => {
                    setPropertyCounts(prev => ({...prev, [group.mainCity.id]: count}));
                });
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupedIntegrations]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!mainDistrictId) {
            return alert("Please select a main district.");
        }
        if (connectedDistrictIds.length === 0) {
            return alert("Please select at least one connected district.");
        }
        if (connectedDistrictIds.includes(mainDistrictId)) {
            return alert("A district cannot be connected to itself.");
        }

        setSubmitLoading(true);
        setError(null);
        
        try {
            // Check for circular references locally first
            const hasCircular = connectedDistrictIds.some(cid => 
                integrations.some(i => i.main_district_id === cid && i.connected_district_id === mainDistrictId)
            );
            
            if (hasCircular) {
                throw new Error("Cannot create a circular reference (A → B and B → A).");
            }
            
            // Add all selected connected districts sequentially
            for (const cid of connectedDistrictIds) {
                // Prevent duplicate connection attempts
                const exists = integrations.some(i => i.main_district_id === mainDistrictId && i.connected_district_id === cid);
                if (!exists) {
                    await addDistrictIntegration(mainDistrictId, cid);
                }
            }
            
            setMainDistrictId("");
            setConnectedDistrictIds([]);
            await loadIntegrationsAndCounts();
            
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to add connections");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleRemoveIntegration = async (id: string) => {
        if (!confirm("Are you sure you want to remove this connection?")) return;
        
        try {
            await removeDistrictIntegration(id);
            await loadIntegrationsAndCounts();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to remove integration");
        }
    };
    
    const toggleConnectedDistrict = (cityId: string) => {
        setConnectedDistrictIds(prev => 
            prev.includes(cityId) 
                ? prev.filter(id => id !== cityId)
                : [...prev, cityId]
        );
    };

    const filteredGroups = groupedIntegrations.filter(g => 
        g.mainCity.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="p-8 flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                    <LinkIcon className="w-6 h-6 text-primary" />
                    District Integrations
                </h1>
                <p className="text-text-secondary mt-1">
                    Connect nearby areas to a main district so that searching for the main district includes properties from connected locations.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 mb-6">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}
            
            <div className="mb-6 flex overflow-x-auto pb-2 gap-2 custom-scrollbar border-b border-slate-100">
                 {states.map(state => (
                     <button
                         key={state.id}
                         onClick={() => setSelectedStateId(state.id)}
                         className={`whitespace-nowrap px-4 py-2 rounded-t-lg transition-colors border-b-2 font-medium ${selectedStateId === state.id
                             ? 'border-primary text-primary bg-primary/5'
                             : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-slate-50'
                             }`}
                     >
                         {state.name}
                     </button>
                 ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Integration Form */}
                <div className="bg-white rounded-2xl border border-border p-6 shadow-sm h-fit">
                    <h2 className="font-semibold text-lg text-text-primary mb-4">Create Integration</h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Main District</label>
                            <select 
                                value={mainDistrictId}
                                onChange={(e) => {
                                    setMainDistrictId(e.target.value);
                                    // Remove from connected if they select it as main
                                    setConnectedDistrictIds(prev => prev.filter(id => id !== e.target.value));
                                }}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                            >
                                <option value="">Select a city...</option>
                                {cities.map(city => (
                                    <option key={city.id} value={city.id}>{city.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-text-muted mt-1.5">When users search for this district...</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2 flex justify-between">
                                Connected Districts
                                <span className="bg-slate-100 px-2 py-0.5 rounded-full text-xs text-slate-500 font-semibold">{connectedDistrictIds.length} Selected</span>
                            </label>
                            
                            <div className="relative">
                                {/* Custom Multi-select Dropdown trigger */}
                                <div 
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-border rounded-xl text-sm cursor-pointer flex flex-wrap gap-1.5 min-h-[44px] items-center"
                                    onClick={() => setIsMultiSelectOpen(!isMultiSelectOpen)}
                                >
                                    {connectedDistrictIds.length === 0 ? (
                                        <span className="text-slate-400">Select connected areas...</span>
                                    ) : (
                                        connectedDistrictIds.map(id => {
                                            const city = cities.find(c => c.id === id);
                                            return city ? (
                                                <span key={id} className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1" onClick={(e) => {e.stopPropagation(); toggleConnectedDistrict(id)}}>
                                                    {city.name}
                                                    <X className="w-3 h-3 hover:text-red-500 cursor-pointer" />
                                                </span>
                                            ) : null;
                                        })
                                    )}
                                </div>
                                
                                {/* Dropdown menu */}
                                {isMultiSelectOpen && (
                                    <div className="absolute z-10 w-full mt-2 bg-white border border-border rounded-xl shadow-xl max-h-[250px] overflow-y-auto custom-scrollbar p-2">
                                        {cities.filter(c => c.id !== mainDistrictId).map(city => (
                                            <div 
                                                key={city.id} 
                                                onClick={() => toggleConnectedDistrict(city.id)}
                                                className="flex items-center gap-3 p-2 hover:bg-slate-50 cursor-pointer rounded-lg rounded-xl"
                                            >
                                                <input 
                                                    type="checkbox"
                                                    checked={connectedDistrictIds.includes(city.id)}
                                                    readOnly
                                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary h-[1.125rem] w-[1.125rem] cursor-pointer"
                                                />
                                                <span className="text-sm font-medium text-text-primary">{city.name}</span>
                                            </div>
                                        ))}
                                        {cities.length <= 1 && <div className="p-3 text-sm text-text-muted text-center">Not enough cities available in this state.</div>}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-text-muted mt-1.5">...results from these areas will also be shown.</p>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={submitLoading || !mainDistrictId || connectedDistrictIds.length === 0}
                            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Create Integration
                        </button>
                    </form>
                </div>

                {/* Integrations Table / List */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">
                    <div className="p-5 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="font-semibold text-lg text-text-primary">Integration Summary</h2>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Search Main District..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto min-h-[300px]">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-text-secondary font-medium">
                                <tr>
                                    <th className="p-4 border-b border-slate-200 w-1/3">Main District</th>
                                    <th className="p-4 border-b border-slate-200">Connected Areas</th>
                                    <th className="p-4 border-b border-slate-200 w-24 whitespace-nowrap">Total Visible Assets</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredGroups.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-text-muted italic">
                                            No district integrations found for the selected state.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredGroups.map(group => (
                                        <tr key={group.mainCity.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 font-semibold text-text-primary align-top pt-5">
                                                {group.mainCity.name}
                                                <div className="text-xs font-normal text-text-muted mt-1 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                                                    ID: {group.mainCity.id.split('-')[0]}...
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="flex flex-wrap gap-2">
                                                    {group.connections.map(conn => (
                                                        <div key={conn.integrationId} className="group border border-border bg-white pl-3 pr-1 py-1.5 flex items-center gap-2 rounded-lg shadow-sm">
                                                            <span className="text-[13px]">{conn.connectedCity.name}</span>
                                                            <button 
                                                                onClick={() => handleRemoveIntegration(conn.integrationId)}
                                                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-all"
                                                                title="Remove connection"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top pt-6">
                                                {propertyCounts[group.mainCity.id] !== undefined ? (
                                                    <span className="bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full text-xs">
                                                        {propertyCounts[group.mainCity.id]} Properties
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs flex items-center gap-1">
                                                        <Loader2 className="w-3 h-3 animate-spin" /> Loading
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
