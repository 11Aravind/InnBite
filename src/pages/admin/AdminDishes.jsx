import React, { useState, useEffect } from 'react';
import { apiService } from '../../utils/apiService';
import {
    Plus,
    Edit2,
    Trash2,
    Utensils,
    Star,
    Sparkles,
    CheckCircle2,
    XCircle,
    X,
    DollarSign
} from 'lucide-react';

export default function AdminDishes() {
    const [dishes, setDishes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDish, setEditingDish] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        basePrice: '',
        category: 'main-courses',
        imageUrl: '',
        ingredients: '',
        allergens: '',
        tasteProfile: '',
        isPopular: false,
        isSpecial: false,
        isAvailable: true
    });

    const loadData = async () => {
        setLoading(true);
        const [dishesData, categoriesData] = await Promise.all([
            apiService.getDishes(),
            apiService.getCategories()
        ]);
        setDishes(dishesData || []);
        setCategories(categoriesData || []);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleOpenModal = (dish = null) => {
        if (dish) {
            setEditingDish(dish);
            setFormData({
                name: dish.name || '',
                description: dish.description || '',
                basePrice: dish.basePrice || dish.base_price || '',
                category: dish.category || dish.category_id || (categories[0]?.id || 'main-courses'),
                imageUrl: (dish.images && dish.images[0]) || dish.image || '',
                ingredients: Array.isArray(dish.ingredients) ? dish.ingredients.join(', ') : '',
                allergens: Array.isArray(dish.allergens) ? dish.allergens.join(', ') : '',
                tasteProfile: Array.isArray(dish.tasteProfile || dish.taste_profile) ? (dish.tasteProfile || dish.taste_profile).join(', ') : '',
                isPopular: Boolean(dish.is_popular || dish.isPopular),
                isSpecial: Boolean(dish.is_special || dish.isSpecial),
                isAvailable: dish.is_available !== undefined ? dish.is_available : true
            });
        } else {
            setEditingDish(null);
            setFormData({
                name: '',
                description: '',
                basePrice: '',
                category: categories[0]?.id || 'main-courses',
                imageUrl: '',
                ingredients: '',
                allergens: '',
                tasteProfile: '',
                isPopular: false,
                isSpecial: false,
                isAvailable: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSaveDish = async (e) => {
        e.preventDefault();
        const payload = {
            id: editingDish?.id,
            name: formData.name,
            description: formData.description,
            basePrice: Number(formData.basePrice),
            base_price: Number(formData.basePrice),
            category: formData.category,
            category_id: formData.category,
            images: [formData.imageUrl || '/placeholderfood.png'],
            portions: [
                { value: "regular", label: "Regular", multiplier: 1 },
                { value: "large", label: "Large", multiplier: 1.4 },
                { value: "small", label: "Small", multiplier: 0.8 }
            ],
            ingredients: formData.ingredients.split(',').map(s => s.trim()).filter(Boolean),
            allergens: formData.allergens.split(',').map(s => s.trim()).filter(Boolean),
            tasteProfile: formData.tasteProfile.split(',').map(s => s.trim()).filter(Boolean),
            is_popular: formData.isPopular,
            is_special: formData.isSpecial,
            is_available: formData.isAvailable
        };

        await apiService.saveDish(payload);
        setIsModalOpen(false);
        loadData();
    };

    const handleDeleteDish = async (id) => {
        if (window.confirm('Are you sure you want to delete this dish?')) {
            await apiService.deleteDish(id);
            loadData();
        }
    };

    return (
        <div className="space-y-6 text-slate-100">
            <div className="flex flex-wrap justify-between items-center gap-4 pb-2 border-b border-slate-800">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        Dishes & Menu Management <Utensils className="w-5 h-5 text-rose-500" />
                    </h1>
                    <p className="text-xs text-slate-400">Create, edit, and toggle menu item details</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add New Dish</span>
                </button>
            </div>

            {/* Dishes Grid */}
            {loading ? (
                <div className="text-center py-12 text-slate-500">Loading dishes...</div>
            ) : dishes.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">No dishes created yet</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dishes.map((dish) => {
                        const img = (dish.images && dish.images[0]) || dish.image || '/placeholderfood.png';
                        const price = Number(dish.basePrice || dish.base_price || 0).toFixed(2);

                        return (
                            <div key={dish.id} className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl p-4 flex flex-col justify-between">
                                <div>
                                    <div
                                        className="w-full h-44 bg-center bg-cover rounded-xl mb-3 relative overflow-hidden ring-1 ring-white/10"
                                        style={{ backgroundImage: `url("${img}")` }}
                                    >
                                        <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                                            {(dish.is_popular || dish.isPopular) && (
                                                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                                                    <Star className="w-3 h-3 fill-slate-950" /> Popular
                                                </span>
                                            )}
                                            {(dish.is_special || dish.isSpecial) && (
                                                <span className="bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                                                    <Sparkles className="w-3 h-3" /> Special
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-white text-base">{dish.name}</h3>
                                    <p className="text-xs text-slate-400 line-clamp-2 my-1.5 leading-relaxed">{dish.description}</p>
                                    <div className="text-sm font-black text-emerald-400 mt-2">${price}</div>
                                </div>

                                <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between">
                                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${dish.is_available !== false ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                        {dish.is_available !== false ? 'Available' : 'Out of stock'}
                                    </span>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenModal(dish)}
                                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                                        >
                                            <Edit2 className="w-3 h-3 text-slate-400" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteDish(dish.id)}
                                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 border border-rose-500/20"
                                        >
                                            <Trash2 className="w-3 h-3" /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add / Edit Dish Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100">
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
                            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                                <Utensils className="w-5 h-5 text-rose-500" />
                                {editingDish ? 'Edit Dish Details' : 'Add New Dish'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveDish} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1">Dish Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full h-11 bg-slate-800/80 border border-slate-700 px-3.5 rounded-xl text-sm outline-none focus:border-rose-500 text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-300 block mb-1">Base Price ($) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.basePrice}
                                        onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                        className="w-full h-11 bg-slate-800/80 border border-slate-700 px-3.5 rounded-xl text-sm outline-none focus:border-rose-500 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-300 block mb-1">Category *</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full h-11 bg-slate-800/80 border border-slate-700 px-3.5 rounded-xl text-sm outline-none focus:border-rose-500 text-white"
                                    >
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1">Image URL</label>
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                    className="w-full h-11 bg-slate-800/80 border border-slate-700 px-3.5 rounded-xl text-sm outline-none focus:border-rose-500 text-white"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1">Description</label>
                                <textarea
                                    rows="2"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-slate-800/80 border border-slate-700 p-3 rounded-xl text-sm outline-none focus:border-rose-500 text-white"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1">Ingredients (comma-separated)</label>
                                <input
                                    type="text"
                                    placeholder="Tomatoes, Cheese, Basil"
                                    value={formData.ingredients}
                                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                                    className="w-full h-11 bg-slate-800/80 border border-slate-700 px-3.5 rounded-xl text-sm outline-none focus:border-rose-500 text-white"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1">Allergens (comma-separated)</label>
                                <input
                                    type="text"
                                    placeholder="Milk, Gluten"
                                    value={formData.allergens}
                                    onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                                    className="w-full h-11 bg-slate-800/80 border border-slate-700 px-3.5 rounded-xl text-sm outline-none focus:border-rose-500 text-white"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1">Taste Profile (comma-separated)</label>
                                <input
                                    type="text"
                                    placeholder="Savory, Rich, Fresh"
                                    value={formData.tasteProfile}
                                    onChange={(e) => setFormData({ ...formData, tasteProfile: e.target.value })}
                                    className="w-full h-11 bg-slate-800/80 border border-slate-700 px-3.5 rounded-xl text-sm outline-none focus:border-rose-500 text-white"
                                />
                            </div>

                            <div className="flex flex-wrap gap-4 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={formData.isPopular}
                                        onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                                        className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
                                    />
                                    <span>Is Popular Dish</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={formData.isSpecial}
                                        onChange={(e) => setFormData({ ...formData, isSpecial: e.target.checked })}
                                        className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
                                    />
                                    <span>Today's Special</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={formData.isAvailable}
                                        onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                                        className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
                                    />
                                    <span>Is Available</span>
                                </label>
                            </div>

                            <div className="pt-4 border-t border-slate-800 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-1/2 h-11 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="w-1/2 h-11 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-rose-500/20"
                                >
                                    Save Dish
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
