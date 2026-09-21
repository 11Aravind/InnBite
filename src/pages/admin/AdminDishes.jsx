import React, { useState, useEffect } from 'react';
import { apiService } from '../../utils/apiService';

export default function AdminDishes() {
    const [dishes, setDishes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDish, setEditingDish] = useState(null);

    // Form fields state
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
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dishes & Menu Management</h1>
                    <p className="text-xs text-gray-500">Create, edit, and toggle menu item details</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2.5 bg-black hover:bg-gray-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-sm"
                >
                    <span>➕ Add New Dish</span>
                </button>
            </div>

            {/* Dishes Grid */}
            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading dishes...</div>
            ) : dishes.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">No dishes created yet</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dishes.map((dish) => {
                        const img = (dish.images && dish.images[0]) || dish.image || '/placeholderfood.png';
                        const price = Number(dish.basePrice || dish.base_price || 0).toFixed(2);

                        return (
                            <div key={dish.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col justify-between">
                                <div>
                                    <div
                                        className="w-full h-40 bg-center bg-cover rounded-xl mb-3 relative"
                                        style={{ backgroundImage: `url("${img}")` }}
                                    >
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            {(dish.is_popular || dish.isPopular) && (
                                                <span className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">Popular</span>
                                            )}
                                            {(dish.is_special || dish.isSpecial) && (
                                                <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Special</span>
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-base">{dish.name}</h3>
                                    <p className="text-xs text-gray-500 line-clamp-2 my-1">{dish.description}</p>
                                    <div className="text-sm font-bold text-emerald-600 mt-2">${price}</div>
                                </div>

                                <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${dish.is_available !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                        {dish.is_available !== false ? 'Available' : 'Out of stock'}
                                    </span>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenModal(dish)}
                                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteDish(dish.id)}
                                            className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg"
                                        >
                                            Delete
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingDish ? 'Edit Dish Details' : 'Add New Dish'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
                        </div>

                        <form onSubmit={handleSaveDish} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Dish Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full h-11 bg-gray-50 border border-gray-200 px-3 rounded-xl text-sm outline-none focus:border-black"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">Base Price ($) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.basePrice}
                                        onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                        className="w-full h-11 bg-gray-50 border border-gray-200 px-3 rounded-xl text-sm outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">Category *</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full h-11 bg-gray-50 border border-gray-200 px-3 rounded-xl text-sm outline-none focus:border-black"
                                    >
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Image URL</label>
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                    className="w-full h-11 bg-gray-50 border border-gray-200 px-3 rounded-xl text-sm outline-none focus:border-black"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Description</label>
                                <textarea
                                    rows="2"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-black"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Ingredients (comma-separated)</label>
                                <input
                                    type="text"
                                    placeholder="Tomatoes, Cheese, Basil"
                                    value={formData.ingredients}
                                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                                    className="w-full h-11 bg-gray-50 border border-gray-200 px-3 rounded-xl text-sm outline-none focus:border-black"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Allergens (comma-separated)</label>
                                <input
                                    type="text"
                                    placeholder="Milk, Gluten"
                                    value={formData.allergens}
                                    onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                                    className="w-full h-11 bg-gray-50 border border-gray-200 px-3 rounded-xl text-sm outline-none focus:border-black"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Taste Profile (comma-separated)</label>
                                <input
                                    type="text"
                                    placeholder="Savory, Rich, Fresh"
                                    value={formData.tasteProfile}
                                    onChange={(e) => setFormData({ ...formData, tasteProfile: e.target.value })}
                                    className="w-full h-11 bg-gray-50 border border-gray-200 px-3 rounded-xl text-sm outline-none focus:border-black"
                                />
                            </div>

                            <div className="flex flex-wrap gap-4 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={formData.isPopular}
                                        onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                                    />
                                    <span>Is Popular Dish</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={formData.isSpecial}
                                        onChange={(e) => setFormData({ ...formData, isSpecial: e.target.checked })}
                                    />
                                    <span>Today's Special</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={formData.isAvailable}
                                        onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                                    />
                                    <span>Is Available</span>
                                </label>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-1/2 h-11 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="w-1/2 h-11 bg-black text-white font-bold rounded-xl text-sm hover:bg-gray-800"
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
