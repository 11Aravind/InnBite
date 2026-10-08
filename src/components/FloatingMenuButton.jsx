import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, X, Sparkles, Star } from 'lucide-react';
import { apiService } from '../utils/apiService';

export default function FloatingMenuButton({ categories: propCats = [], allDishes: propDishes = [], onSelectCategory }) {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef(null);

    const [categories, setCategories] = useState(propCats || []);
    const [allDishes, setAllDishes] = useState(propDishes || []);

    useEffect(() => {
        if (propCats && propCats.length > 0) setCategories(propCats);
        if (propDishes && propDishes.length > 0) setAllDishes(propDishes);
    }, [propCats, propDishes]);

    useEffect(() => {
        if ((!propCats || propCats.length === 0) || (!propDishes || propDishes.length === 0)) {
            const syncCats = apiService.getCategoriesSync();
            const syncFoods = apiService.getDishesSync();
            if (syncCats && syncFoods) {
                if (!propCats || propCats.length === 0) setCategories(syncCats);
                if (!propDishes || propDishes.length === 0) setAllDishes(syncFoods);
            } else {
                Promise.all([
                    apiService.getCategories(),
                    apiService.getDishes()
                ]).then(([cats, dishes]) => {
                    if (!propCats || propCats.length === 0) setCategories(cats || []);
                    if (!propDishes || propDishes.length === 0) setAllDishes(dishes || []);
                }).catch(err => console.warn('FloatingMenuButton load error:', err));
            }
        }
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    // Calculate dish counts per category
    const recommendedCount = allDishes.filter(d => d.is_popular || d.isPopular).length;
    const chefSpecialCount = allDishes.filter(d => d.is_special || d.isSpecial).length;

    const categoryCounts = categories.map(cat => {
        const count = allDishes.filter(d => {
            const dCatId = String(d.category_id || d.categoryId || d.category || '');
            const cId = String(cat.id || '');
            const dCatName = (d.category_name || '').toLowerCase();
            const cName = (cat.name || '').toLowerCase();
            return (dCatId && cId && dCatId === cId) || (dCatName && cName && dCatName === cName);
        }).length;
        return {
            ...cat,
            count: count || (cat.dishes_count || 0)
        };
    });

    const handleCategoryClick = (catType, item) => {
        setIsOpen(false);
        if (onSelectCategory) {
            onSelectCategory(catType, item);
        } else {
            if (catType === 'popular') {
                navigate('/CategoryDetails/popular');
            } else if (catType === 'special') {
                navigate('/CategoryDetails/special');
            } else if (catType === 'category' && item?.id) {
                navigate(`/CategoryDetails/${item.id}`);
            }
        }
    };

    return (
        <div ref={popoverRef} className="fixed bottom-20 right-4 z-40 font-sans">
            {/* Dark Popover Modal Menu */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-64 sm:w-72 bg-[#0b0f19]/95 backdrop-blur-md border border-slate-800 text-white rounded-3xl p-4 shadow-2xl animate-fade-in-up space-y-1 mb-2">
                    <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800 px-1">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Menu Categories
                        </span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="max-h-[55vh] overflow-y-auto space-y-0.5 pr-1 text-xs font-semibold">
                        {/* Recommended / Bestsellers */}
                        {recommendedCount > 0 && (
                            <button
                                onClick={() => handleCategoryClick('popular', null)}
                                className="w-full px-3 py-2.5 rounded-2xl flex items-center justify-between text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors text-left group"
                            >
                                <span className="flex items-center gap-2 font-extrabold group-hover:text-amber-400 transition-colors">
                                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                                    <span>Recommended</span>
                                </span>
                                <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                                    {recommendedCount}
                                </span>
                            </button>
                        )}

                        {/* Chef's Special */}
                        {chefSpecialCount > 0 && (
                            <button
                                onClick={() => handleCategoryClick('special', null)}
                                className="w-full px-3 py-2.5 rounded-2xl flex items-center justify-between text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors text-left group"
                            >
                                <span className="flex items-center gap-2 font-extrabold group-hover:text-rose-400 transition-colors">
                                    <Sparkles className="w-3.5 h-3.5 text-rose-400 fill-rose-400 shrink-0" />
                                    <span>Chef's Special</span>
                                </span>
                                <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                                    {chefSpecialCount}
                                </span>
                            </button>
                        )}

                        {/* Store Categories List */}
                        {categoryCounts.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick('category', cat)}
                                className="w-full px-3 py-2.5 rounded-2xl flex items-center justify-between text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors text-left group"
                            >
                                <span className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors truncate pr-2">
                                    {cat.name}
                                </span>
                                <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800 shrink-0">
                                    {cat.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Floating Black Circle MENU Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#0b0f19] text-white flex flex-col items-center justify-center shadow-2xl border border-slate-700/80 transition-transform active:scale-90 hover:scale-105 cursor-pointer relative ${isOpen ? 'ring-2 ring-emerald-400' : ''}`}
                title="Browse Menu Categories"
                aria-label="Open Menu Categories"
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white stroke-[2.5]" />
                ) : (
                    <>
                        <BookOpen className="w-5 h-5 text-white stroke-[2.2]" />
                        <span className="text-[10px] font-black tracking-wider uppercase mt-0.5 text-white">
                            MENU
                        </span>
                    </>
                )}
            </button>
        </div>
    );
}
