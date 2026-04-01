"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { SearchCategory } from "@/types";
import { Trash2, Plus, AlertCircle, Loader2, Settings2 } from "lucide-react";
import { fetchSearchCategories } from "@/lib/supabase/homepage";

export default function AdminCategoriesPage() {
    const supabase = createClient();
    const [categories, setCategories] = useState<SearchCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategorySlug, setNewCategorySlug] = useState("");

    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [newSubtypeName, setNewSubtypeName] = useState("");

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchSearchCategories();
            setCategories(data);
            if (data.length > 0 && !selectedCategoryId) {
                setSelectedCategoryId(data[0].id);
            }
        } catch (err) {
            console.error("Load category error:", err);
            setError("Failed to load categories.");
        } finally {
            setLoading(false);
        }
    }, [selectedCategoryId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim() || !newCategorySlug.trim()) return;

        try {
            const { error: dbError } = await supabase
                .from("search_categories")
                .insert({
                    name: newCategoryName.trim(),
                    slug: newCategorySlug.trim().toLowerCase(),
                    display_order: categories.length + 1
                });

            if (dbError) throw dbError;

            setNewCategoryName("");
            setNewCategorySlug("");
            loadData();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to add category");
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("Are you sure? This will delete the category and all its subtypes.")) return;
        try {
            const { error: dbError } = await supabase.from("search_categories").delete().eq("id", id);
            if (dbError) throw dbError;
            loadData();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete category");
        }
    };

    const handleAddSubtype = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubtypeName.trim() || !selectedCategoryId) return;

        const category = categories.find(c => c.id === selectedCategoryId);
        const order = (category?.subtypes?.length || 0) + 1;

        try {
            const { error: dbError } = await supabase
                .from("search_subtypes")
                .insert({
                    category_id: selectedCategoryId,
                    name: newSubtypeName.trim(),
                    display_order: order
                });

            if (dbError) throw dbError;

            setNewSubtypeName("");
            loadData();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to add subtype");
        }
    };

    const handleDeleteSubtype = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            const { error: dbError } = await supabase.from("search_subtypes").delete().eq("id", id);
            if (dbError) throw dbError;
            loadData();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete subtype");
        }
    };

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);

    if (loading) return (
        <div className="p-8 flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
            <div className="mb-8 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Settings2 className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Search Categories</h1>
                    <p className="text-text-secondary mt-1">Configure property types and categories for the search bar.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 mb-6 border border-red-100">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Categories */}
                <div className="bg-white rounded-3xl border border-border p-6 shadow-sm">
                    <h2 className="font-bold text-lg text-text-primary mb-5 flex justify-between items-center">
                        Main Categories
                        <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-semibold">{categories.length}</span>
                    </h2>

                    <form onSubmit={handleAddCategory} className="space-y-3 mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase px-1">Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Residential"
                                    value={newCategoryName}
                                    onChange={e => {
                                        setNewCategoryName(e.target.value);
                                        if (!newCategorySlug) setNewCategorySlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                                    }}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase px-1">Slug</label>
                                <input
                                    type="text"
                                    placeholder="e.g. residential"
                                    value={newCategorySlug}
                                    onChange={e => setNewCategorySlug(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition-all"
                                />
                            </div>
                        </div>
                        <button type="submit" disabled={!newCategoryName.trim() || !newCategorySlug.trim()} className="w-full py-3 bg-primary text-white rounded-xl hover:bg-primary-hover disabled:opacity-50 text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                            <Plus className="w-5 h-5" /> Add New Category
                        </button>
                    </form>

                    <div className="space-y-3">
                        {categories.length === 0 && <p className="text-sm text-text-muted text-center py-10">No categories found.</p>}
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center gap-2 group">
                                <button
                                    onClick={() => setSelectedCategoryId(cat.id)}
                                    className={`flex-1 text-left px-5 py-4 rounded-2xl border transition-all flex items-center justify-between ${selectedCategoryId === cat.id
                                        ? 'bg-primary/5 border-primary text-primary font-bold shadow-sm'
                                        : 'border-slate-100 text-slate-600 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
                                        }`}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-base">{cat.name}</span>
                                        <span className="text-[10px] opacity-60 font-mono tracking-tight">{cat.slug}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] bg-white border border-slate-200 text-slate-500 px-2 py-1 rounded-full font-bold shadow-sm">
                                            {cat.subtypes.length} TYPES
                                        </span>
                                    </div>
                                </button>
                                <button onClick={() => handleDeleteCategory(cat.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Subtypes */}
                <div className="bg-white rounded-3xl border border-border p-6 shadow-sm">
                    <h2 className="font-bold text-lg text-text-primary mb-5 flex justify-between items-center">
                        {selectedCategory ? `${selectedCategory.name} Sub-types` : 'Sub-types'}
                        {selectedCategory && <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-semibold">{selectedCategory.subtypes.length}</span>}
                    </h2>

                    {!selectedCategoryId ? (
                        <div className="text-center py-24 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            <p className="text-text-muted text-sm px-10 leading-relaxed">Select a category from the list to manage its specific property types.</p>
                        </div>
                    ) : (
                        <>
                            <form onSubmit={handleAddSubtype} className="flex gap-2 mb-8 items-end">
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase px-1">Type Name</label>
                                    <input
                                        type="text"
                                        placeholder={`New ${selectedCategory?.name} type (e.g. Villa)`}
                                        value={newSubtypeName}
                                        onChange={e => setNewSubtypeName(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition-all shadow-sm"
                                    />
                                </div>
                                <button type="submit" disabled={!newSubtypeName.trim()} className="h-[46px] px-6 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 text-sm font-bold flex items-center gap-2 transition-all active:scale-[0.98]">
                                    <Plus className="w-5 h-5" /> Add
                                </button>
                            </form>

                            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {selectedCategory?.subtypes.length === 0 && (
                                    <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-sm text-text-muted italic">No subtypes defined for this category.</p>
                                    </div>
                                )}
                                {selectedCategory?.subtypes.map((sub, idx) => (
                                    <div key={sub.id} className="flex items-center justify-between px-5 py-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-300 transition-all group shadow-sm hover:shadow-md">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] bg-slate-50 text-slate-400 w-6 h-6 flex items-center justify-center rounded-lg font-bold border border-slate-100">{idx + 1}</span>
                                            <span className="text-sm font-bold text-slate-700">{sub.name}</span>
                                        </div>
                                        <button onClick={() => handleDeleteSubtype(sub.id)} className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 opacity-0 group-hover:opacity-100">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
