import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../../utils/apiService';
import DataTable from '../../components/DataTable';
import { ImageFileInput } from '../../components/ImageUploadCropModal';
import {
    Plus,
    Edit2,
    Trash2,
    Utensils,
    Star,
    Sparkles,
    X,
    SlidersHorizontal,
    CheckCircle2,
    XCircle
} from 'lucide-react';

export default function AdminDishes() {
    const [dishes, setDishes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDish, setEditingDish] = useState(null);

    // Search & Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

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

    // Filter dishes based on category and status (search query handled by TanStack Table or pre-filtered)
    const filteredDishes = useMemo(() => {
        return dishes.filter((dish) => {
            const dishCat = dish.category || dish.category_id;
            const matchesCategory = selectedCategory === 'all' || dishCat === selectedCategory;

            const matchesStatus =
                selectedStatus === 'all' ||
                (selectedStatus === 'available' && dish.is_available !== false) ||
                (selectedStatus === 'unavailable' && dish.is_available === false) ||
                (selectedStatus === 'popular' && (dish.is_popular || dish.isPopular)) ||
                (selectedStatus === 'special' && (dish.is_special || dish.isSpecial));

            return matchesCategory && matchesStatus;
        });
    }, [dishes, selectedCategory, selectedStatus]);

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

    const handleToggleAvailability = async (dish) => {
        const updatedStatus = !(dish.is_available !== false);
        const payload = {
            ...dish,
            is_available: updatedStatus
        };
        await apiService.saveDish(payload);
        loadData();
    };

    const handleDeleteDish = async (id) => {
        if (window.confirm('Are you sure you want to delete this dish?')) {
            await apiService.deleteDish(id);
            loadData();
        }
    };

    const getCategoryName = (catId) => {
        const cat = categories.find(c => c.id === catId);
        return cat ? cat.name : catId || 'General';
    };

    // TanStack Table Columns definition
    const columns = useMemo(() => [
        {
            accessorKey: 'name',
            header: 'Dish Information',
            cell: ({ row }) => {
                const dish = row.original;
                const img = (dish.images && dish.images[0]) || dish.image || '/placeholderfood.png';
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-2xs">
                            <img src={img} alt={dish.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm leading-snug">{dish.name}</h4>
                            <p className="text-[11px] text-slate-500 line-clamp-1 max-w-xs mt-0.5 font-normal">
                                {dish.description || 'No description provided'}
                            </p>
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: 'category',
            header: 'Category',
            cell: ({ row }) => {
                const dish = row.original;
                return (
                    <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold inline-block">
                        {getCategoryName(dish.category || dish.category_id)}
                    </span>
                );
            }
        },
        {
            accessorKey: 'basePrice',
            header: 'Base Price',
            cell: ({ row }) => {
                const dish = row.original;
                const price = Number(dish.basePrice || dish.base_price || 0).toFixed(2);
                return <span className="font-black text-emerald-600 text-sm">₹{price}</span>;
            }
        },
        {
            id: 'badges',
            header: 'Badges & Tags',
            cell: ({ row }) => {
                const dish = row.original;
                const isPop = dish.is_popular || dish.isPopular;
                const isSpec = dish.is_special || dish.isSpecial;
                return (
                    <div className="flex flex-wrap gap-1">
                        {isPop && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-200">
                                <Star className="w-3 h-3 fill-amber-700" /> Popular
                            </span>
                        )}
                        {isSpec && (
                            <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 border border-purple-200">
                                <Sparkles className="w-3 h-3" /> Special
                            </span>
                        )}
                        {!isPop && !isSpec && <span className="text-slate-400 text-[11px] font-normal">—</span>}
                    </div>
                );
            }
        },
        {
            accessorKey: 'is_available',
            header: 'Stock Status',
            cell: ({ row }) => {
                const dish = row.original;
                const isAvail = dish.is_available !== false;
                return (
                    <button
                        onClick={() => handleToggleAvailability(dish)}
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 transition-all border ${
                            isAvail
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                        title="Click to toggle availability"
                    >
                        {isAvail ? (
                            <>
                                <CheckCircle2 className="w-3.5 h-3.5" /> Available
                            </>
                        ) : (
                            <>
                                <XCircle className="w-3.5 h-3.5" /> Out of stock
                            </>
                        )}
                    </button>
                );
            }
        },
        {
            id: 'actions',
            header: 'Actions',
            meta: { align: 'right', headerAlign: 'right' },
            cell: ({ row }) => {
                const dish = row.original;
                return (
                    <div className="flex items-center justify-end gap-1.5">
                        <button
                            onClick={() => handleOpenModal(dish)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                            title="Edit Dish"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => handleDeleteDish(dish.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-200"
                            title="Delete Dish"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            }
        }
    ], [categories]);

    // Extra Header Controls (Category Dropdown & Status Dropdown)
    const extraHeaderControls = (
        <>
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500 font-semibold">Category:</span>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
                >
                    <option value="all">All Categories ({categories.length})</option>
                    {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 font-semibold">Status:</span>
                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
                >
                    <option value="all">All Dishes</option>
                    <option value="available">Available Only</option>
                    <option value="unavailable">Out of Stock</option>
                    <option value="popular">Popular Dishes ⭐</option>
                    <option value="special">Today's Specials ✨</option>
                </select>
            </div>
        </>
    );

    return (
        <div className="space-y-6 text-slate-900 font-sans">
            {/* Header Title Bar */}
            <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        Dishes & Menu Management <Utensils className="w-5 h-5 text-rose-500" />
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">Manage menu catalog in structured TanStack Table format with live search and sorting</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-6 py-3 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-rose-500/20 inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Add New Dish</span>
                </button>
            </div>

            {/* TanStack Data Table Component */}
            <DataTable
                data={filteredDishes}
                columns={columns}
                loading={loading}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                searchPlaceholder="Search dishes by name, description, ingredients..."
                defaultPageSize={10}
                emptyMessage="No dishes found"
                emptyIcon={Utensils}
                extraHeaderControls={extraHeaderControls}
            />

            {/* Add / Edit Dish Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl text-slate-900">
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                                <Utensils className="w-5 h-5 text-rose-500" />
                                {editingDish ? 'Edit Dish Details' : 'Add New Dish'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveDish} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Dish Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full h-11 bg-slate-50 border border-slate-200 px-3.5 rounded-xl text-sm outline-none focus:border-rose-500 text-slate-900 font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Base Price (₹) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.basePrice}
                                        onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                        className="w-full h-11 bg-slate-50 border border-slate-200 px-3.5 rounded-xl text-sm outline-none focus:border-rose-500 text-slate-900 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Category *</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full h-11 bg-slate-50 border border-slate-200 px-3.5 rounded-xl text-sm outline-none focus:border-rose-500 text-slate-900 font-bold"
                                    >
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <ImageFileInput
                                value={formData.imageUrl}
                                onChange={(croppedImg) => setFormData({ ...formData, imageUrl: croppedImg })}
                                label="Upload Dish Image (File Upload & Crop) *"
                                aspect={4 / 3}
                            />

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                                <textarea
                                    rows="2"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm outline-none focus:border-rose-500 text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Ingredients (comma-separated)</label>
                                <input
                                    type="text"
                                    placeholder="Tomatoes, Cheese, Basil"
                                    value={formData.ingredients}
                                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                                    className="w-full h-11 bg-slate-50 border border-slate-200 px-3.5 rounded-xl text-sm outline-none focus:border-rose-500 text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Allergens (comma-separated)</label>
                                <input
                                    type="text"
                                    placeholder="Milk, Gluten"
                                    value={formData.allergens}
                                    onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                                    className="w-full h-11 bg-slate-50 border border-slate-200 px-3.5 rounded-xl text-sm outline-none focus:border-rose-500 text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Taste Profile (comma-separated)</label>
                                <input
                                    type="text"
                                    placeholder="Savory, Rich, Fresh"
                                    value={formData.tasteProfile}
                                    onChange={(e) => setFormData({ ...formData, tasteProfile: e.target.value })}
                                    className="w-full h-11 bg-slate-50 border border-slate-200 px-3.5 rounded-xl text-sm outline-none focus:border-rose-500 text-slate-900"
                                />
                            </div>

                            <div className="flex flex-wrap gap-4 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={formData.isPopular}
                                        onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                                    />
                                    <span>Is Popular Dish</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={formData.isSpecial}
                                        onChange={(e) => setFormData({ ...formData, isSpecial: e.target.checked })}
                                    />
                                    <span>Today's Special</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={formData.isAvailable}
                                        onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                                    />
                                    <span>Is Available</span>
                                </label>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-1/2 h-11 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
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
