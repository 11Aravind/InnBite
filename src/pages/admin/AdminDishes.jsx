import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { apiService } from '../../utils/apiService';
import DataTable from '../../components/DataTable';
import { ImageFileInput } from '../../components/ImageUploadCropModal';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
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
    XCircle,
    Check
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

    // Portion Chip Card Form State
    const [selectedPresetPortion, setSelectedPresetPortion] = useState('Regular');
    const [customPortionLabel, setCustomPortionLabel] = useState('');
    const [portionPrice, setPortionPrice] = useState('');
    const [editingPortionIdx, setEditingPortionIdx] = useState(null);
    const [editPortionLabel, setEditPortionLabel] = useState('');
    const [editPortionPrice, setEditPortionPrice] = useState('');

    const handleStartEditPortion = (idx, portion) => {
        setEditingPortionIdx(idx);
        setEditPortionLabel(portion.label);
        setEditPortionPrice(String(portion.price !== undefined ? portion.price : (Number(formData.basePrice) * (portion.multiplier || 1)).toFixed(2) || '0'));
    };

    const handleSaveEditPortion = (idx) => {
        if (!editPortionLabel.trim()) return;
        const price = Number(editPortionPrice) || 0;
        const updatedPortions = [...formData.portions];
        updatedPortions[idx] = {
            value: editPortionLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, '-'),
            label: editPortionLabel.trim(),
            price: price
        };
        setFormData({ ...formData, portions: updatedPortions });
        setEditingPortionIdx(null);
    };

    // Ingredient Customization Form State
    const [newCustomizationItem, setNewCustomizationItem] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        preparation: '',
        basePrice: '',
        category: '',
        imageUrl: '',
        ingredients: [],
        allergens: '',
        tasteProfile: '',
        isPopular: false,
        isSpecial: false,
        isAvailable: true,
        portions: [
            { value: "regular", label: "Regular", price: 0 }
        ]
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

    // Filter dishes based on category and status
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
        setSelectedPresetPortion('Regular');
        setCustomPortionLabel('');
        setPortionPrice('');
        setNewCustomizationItem('');
        setEditingPortionIdx(null);

        if (dish) {
            setEditingDish(dish);
            const parsedIngredients = Array.isArray(dish.ingredients)
                ? dish.ingredients
                : (typeof dish.ingredients === 'string' && dish.ingredients.trim())
                    ? dish.ingredients.split(',').map(s => s.trim()).filter(Boolean)
                    : ['Cheese', 'Onion', 'Garlic', 'Spice'];

            setFormData({
                name: dish.name || '',
                description: dish.description || '',
                preparation: dish.preparation || dish.preparation_details || '',
                basePrice: dish.basePrice || dish.base_price || '',
                category: dish.category || dish.category_id || '',
                images: (dish.images && Array.isArray(dish.images)) ? dish.images.slice(0, 3) : (dish.image || dish.image_url ? [dish.image || dish.image_url] : []),
                ingredients: parsedIngredients,
                allergens: Array.isArray(dish.allergens) ? dish.allergens.join(', ') : '',
                ingredientsList: Array.isArray(dish.ingredients_list) ? dish.ingredients_list.join(', ') : '',
                tasteProfile: Array.isArray(dish.tasteProfile || dish.taste_profile) ? (dish.tasteProfile || dish.taste_profile).join(', ') : '',
                isPopular: Boolean(dish.is_popular || dish.isPopular),
                isSpecial: Boolean(dish.is_special || dish.isSpecial),
                isAvailable: dish.is_available !== undefined ? dish.is_available : true,
                portions: (dish.portions && dish.portions.length > 0) ? dish.portions : [
                    { value: "regular", label: "Regular", price: Number(dish.basePrice || dish.base_price || 0) }
                ]
            });
        } else {
            setEditingDish(null);
            setFormData({
                name: '',
                description: '',
                preparation: '',
                basePrice: '',
                category: '',
                images: [],
                ingredients: [],
                allergens: '',
                tasteProfile: '',
                isPopular: false,
                isSpecial: false,
                isAvailable: true,
                portions: [
                    { value: "regular", label: "Regular", price: 0 }
                ],
                ingredientsList: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleAddIngredient = () => {
        if (!newCustomizationItem.trim()) return;
        const itemStr = newCustomizationItem.trim();
        const current = Array.isArray(formData.ingredients) ? formData.ingredients : [];
        if (!current.includes(itemStr)) {
            setFormData({ ...formData, ingredients: [...current, itemStr] });
        }
        setNewCustomizationItem('');
    };

    const handleSaveDish = async (e) => {
        e.preventDefault();
        
        if (!formData.images || formData.images.length === 0) {
            toast.error('Please upload at least one dish image');
            return;
        }

        const payload = {
            id: editingDish?.id,
            name: formData.name,
            description: formData.description,
            preparation: formData.preparation,
            basePrice: Number(formData.basePrice),
            base_price: Number(formData.basePrice),
            category: formData.category,
            category_id: formData.category,
            images: formData.images,
            portions: (formData.portions && formData.portions.length > 0) ? formData.portions : [
                { value: "regular", label: "Regular", price: Number(formData.basePrice) }
            ],
            ingredients: Array.isArray(formData.ingredients)
                ? formData.ingredients
                : typeof formData.ingredients === 'string'
                    ? formData.ingredients.split(',').map(s => s.trim()).filter(Boolean)
                    : [],
            allergens: typeof formData.allergens === 'string'
                ? formData.allergens.split(',').map(s => s.trim()).filter(Boolean)
                : formData.allergens,
            ingredients_list: typeof formData.ingredientsList === 'string'
                ? formData.ingredientsList.split(',').map(s => s.trim()).filter(Boolean)
                : formData.ingredientsList,
            tasteProfile: typeof formData.tasteProfile === 'string'
                ? formData.tasteProfile.split(',').map(s => s.trim()).filter(Boolean)
                : formData.tasteProfile,
            is_popular: formData.isPopular,
            is_special: formData.isSpecial,
            is_available: formData.isAvailable
        };

        try {
            await apiService.saveDish(payload);
            toast.success(`Dish "${payload.name}" saved successfully!`);
            setIsModalOpen(false);
            loadData();
        } catch (err) {
            console.error('Save dish error:', err);
            toast.error(err.message || 'Failed to save dish into database.');
        }
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

    // Delete Confirmation Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [dishToDelete, setDishToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteDishClick = (dish) => {
        setDishToDelete(dish);
        setDeleteModalOpen(true);
    };

    const handleConfirmDeleteDish = async () => {
        if (!dishToDelete) return;
        setIsDeleting(true);
        try {
            await apiService.deleteDish(dishToDelete.id);
            toast.success(`Dish "${dishToDelete.name}" deleted successfully!`);
            setDeleteModalOpen(false);
            setDishToDelete(null);
            loadData();
        } catch (err) {
            console.error('Delete dish error:', err);
            toast.error('Failed to delete dish. Please try again.');
        } finally {
            setIsDeleting(false);
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
                return <span className="font-black text-[#114536] text-sm">₹{price}</span>;
            }
        },
        {
            id: 'badges',
            header: 'Badges & Tags',
            cell: ({ row }) => {
                const dish = row.original;
                const isPop = dish.is_popular || dish.isPopular;
                const isSpec = dish.is_special || dish.isSpecial;
                const tasteTags = Array.isArray(dish.tasteProfile || dish.taste_profile)
                    ? (dish.tasteProfile || dish.taste_profile)
                    : typeof (dish.tasteProfile || dish.taste_profile) === 'string'
                        ? (dish.tasteProfile || dish.taste_profile).split(',').map(s => s.trim()).filter(Boolean)
                        : [];

                return (
                    <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                        {isPop && (
                            <span className="bg-[#114536]/10 text-[#114536] border border-[#114536]/25 px-2.5 py-0.5 rounded-lg text-xs font-extrabold tracking-tight">
                                Popular
                            </span>
                        )}
                        {isSpec && (
                            <span className="bg-amber-50 text-amber-900 border border-amber-200/80 px-2.5 py-0.5 rounded-lg text-xs font-extrabold tracking-tight">
                                Chef Special
                            </span>
                        )}
                        {tasteTags.map((tag, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-700 border border-slate-200/70 px-2.5 py-0.5 rounded-lg text-xs font-semibold">
                                {tag}
                            </span>
                        ))}
                        {!isPop && !isSpec && tasteTags.length === 0 && (
                            <span className="text-slate-400 text-xs font-medium italic">—</span>
                        )}
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
                            onClick={() => handleDeleteDishClick(dish)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-200 cursor-pointer"
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
                        Dishes & Menu Management <Utensils className="w-5 h-5 text-themePrimary" />
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">Manage menu catalog in structured TanStack Table format with live search and sorting</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-6 py-3 btn-primary text-xs shrink-0 cursor-pointer"
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
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-900">
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                                <Utensils className="w-5 h-5 text-[#114536]" />
                                {editingDish ? 'Edit Dish Details' : 'Add New Dish'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveDish} className="space-y-5">
                            {/* One Row with 3 Columns: Dish Name, Base Price, Category */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">
                                        Dish Name <span className="text-rose-500 font-bold ml-0.5">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Margherita Pizza"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full h-11 bg-slate-50 border border-slate-200 px-3.5 rounded-xl text-sm outline-none focus:border-[#114536] text-slate-900 font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">
                                        Base Price (₹) <span className="text-rose-500 font-bold ml-0.5">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="250.00"
                                        value={formData.basePrice}
                                        onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                        className="w-full h-11 bg-slate-50 border border-slate-200 px-3.5 rounded-xl text-sm outline-none focus:border-[#114536] text-slate-900 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">
                                        Category <span className="text-rose-500 font-bold ml-0.5">*</span>
                                    </label>
                                    <select
                                        required
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full h-11 bg-slate-50 border border-slate-200 px-3.5 rounded-xl text-sm outline-none focus:border-[#114536] text-slate-900 font-bold"
                                    >
                                        <option value="" disabled>-- Select Category --</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Portion Sizes & Pricing Chip Cards Manager */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-800 block">
                                        Portion Sizes & Pricing Chips
                                    </label>
                                    <span className="text-[10px] text-slate-500 font-semibold">
                                        Base: ₹{Number(formData.basePrice || 0).toFixed(2)}
                                    </span>
                                </div>

                                {/* List of active portion chip cards */}
                                <div className="flex flex-wrap gap-2">
                                    {formData.portions && formData.portions.map((p, idx) => {
                                        const isEditing = editingPortionIdx === idx;
                                        const calculatedPrice = p.price !== undefined ? Number(p.price).toFixed(2) : (Number(formData.basePrice || 0) * (p.multiplier || 1)).toFixed(2);

                                        if (isEditing) {
                                            return (
                                                <div
                                                    key={idx}
                                                    className="bg-emerald-50/70 border border-[#114536]/40 shadow-xs rounded-xl p-1.5 flex items-center gap-1.5 text-xs font-bold animate-fade-in"
                                                >
                                                    <span className="text-[#114536] font-extrabold px-1 truncate max-w-[100px]" title={editPortionLabel}>
                                                        {editPortionLabel}
                                                    </span>
                                                    <div className="flex items-center gap-0.5">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={editPortionPrice}
                                                            onChange={(e) => setEditPortionPrice(e.target.value)}
                                                            placeholder="Price"
                                                            className="w-20 h-7 bg-white border border-slate-300 px-2 rounded-md text-xs font-bold outline-none focus:border-[#114536] text-slate-900"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveEditPortion(idx)}
                                                        className="p-1 bg-[#114536] hover:bg-[#0d372b] text-white rounded-md transition-colors"
                                                        title="Save Changes"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingPortionIdx(null)}
                                                        className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition-colors"
                                                        title="Cancel"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div
                                                key={idx}
                                                className="bg-white border border-slate-200 shadow-2xs rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-slate-800 hover:border-slate-300 transition-all"
                                            >
                                                <span className="text-[#114536] font-extrabold">{p.label}</span>
                                                <span className="text-slate-500 text-[11px] font-semibold bg-slate-100 px-1.5 py-0.5 rounded-md">
                                                    ₹{calculatedPrice}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleStartEditPortion(idx, p)}
                                                    className="text-slate-400 hover:text-[#114536] transition-colors ml-0.5"
                                                    title="Edit portion size and price"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                {formData.portions.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = formData.portions.filter((_, i) => i !== idx);
                                                            setFormData({ ...formData, portions: updated });
                                                        }}
                                                        className="text-slate-400 hover:text-rose-600 transition-colors"
                                                        title="Remove portion size"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Add New Portion Chip Form with Preset Dropdown & Other Option */}
                                <div className="pt-2 border-t border-slate-200/60 space-y-2">
                                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                                        <select
                                            value={selectedPresetPortion}
                                            onChange={(e) => setSelectedPresetPortion(e.target.value)}
                                            className="w-48 h-9 bg-white border border-slate-200 px-2.5 rounded-lg text-xs font-bold outline-none focus:border-[#114536]"
                                        >
                                            {['Regular', 'Large', 'Small', 'Half', 'Full', 'Medium', 'Family Pack']
                                                .filter(label => !formData.portions?.some(p => p.label.toLowerCase() === label.toLowerCase()))
                                                .map(label => (
                                                    <option key={label} value={label}>{label}</option>
                                                ))
                                            }
                                            <option value="Other">Other (Custom Size)...</option>
                                        </select>

                                        {selectedPresetPortion === 'Other' && (
                                            <input
                                                type="text"
                                                placeholder="Enter custom size..."
                                                value={customPortionLabel}
                                                onChange={(e) => setCustomPortionLabel(e.target.value)}
                                                className="flex-1 min-w-[140px] h-9 bg-white border border-slate-200 px-3 rounded-lg text-xs font-medium outline-none focus:border-[#114536]"
                                            />
                                        )}

                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="Price (e.g. 150)"
                                            value={portionPrice}
                                            onChange={(e) => setPortionPrice(e.target.value)}
                                            className="w-32 h-9 bg-white border border-slate-200 px-2.5 rounded-lg text-xs font-medium outline-none focus:border-[#114536]"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const finalLabel = selectedPresetPortion === 'Other' ? customPortionLabel.trim() : selectedPresetPortion;
                                                if (!finalLabel) return;
                                                
                                                if (formData.portions?.some(p => p.label.toLowerCase() === finalLabel.toLowerCase())) {
                                                    toast.error(`"${finalLabel}" size already exists!`);
                                                    return;
                                                }

                                                let defaultPrice = Number(portionPrice) || Number(formData.basePrice) || 0;

                                                const newChip = {
                                                    value: finalLabel.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                                                    label: finalLabel,
                                                    price: defaultPrice
                                                };

                                                setFormData({
                                                    ...formData,
                                                    portions: [...(formData.portions || []), newChip]
                                                });
                                                setCustomPortionLabel('');
                                                setPortionPrice('');
                                            }}
                                            className="h-9 px-4 bg-[#114536] hover:bg-[#0d372b] text-white rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add Chip
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                                <label className="text-xs font-bold text-slate-800 block">Dish Images (Max 3)</label>
                                <div className="grid grid-cols-1 gap-4">
                                    {[0, 1, 2].map((idx) => {
                                        // Only show the next input if previous is filled
                                        if (idx > 0 && (!formData.images || idx > formData.images.length)) return null;
                                        
                                        return (
                                            <div key={idx} className="relative">
                                                <ImageFileInput
                                                    value={formData.images?.[idx] || ''}
                                                    onChange={(croppedImg) => {
                                                        const newImages = [...(formData.images || [])];
                                                        newImages[idx] = croppedImg;
                                                        setFormData({ ...formData, images: newImages });
                                                    }}
                                                    label={idx === 0 ? "Primary Image (Required)" : `Additional Image ${idx + 1}`}
                                                    aspect={4 / 3}
                                                    required={idx === 0}
                                                />
                                                {idx > 0 && formData.images?.[idx] && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newImages = formData.images.filter((_, i) => i !== idx);
                                                            setFormData({ ...formData, images: newImages });
                                                        }}
                                                        className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1.5 shadow-md hover:bg-rose-600 transition-colors z-10"
                                                        title="Remove Image"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                                <textarea
                                    rows="2"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm outline-none focus:border-[#114536] text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Preparation Details</label>
                                <textarea
                                    rows="2"
                                    placeholder="e.g. Hand-tossed pizza dough topped with San Marzano tomatoes, fresh mozzarella..."
                                    value={formData.preparation}
                                    onChange={(e) => setFormData({ ...formData, preparation: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm outline-none focus:border-[#114536] text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Ingredients (comma-separated for display only)</label>
                                <textarea
                                    rows="2"
                                    placeholder="e.g. Pasta, Carrots, Zucchini, Bell Peppers, Cream..."
                                    value={formData.ingredientsList || ''}
                                    onChange={(e) => setFormData({ ...formData, ingredientsList: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm outline-none focus:border-[#114536] text-slate-900"
                                />
                            </div>

                            {/* Ingredient Customizations Options Manager */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-800 block">
                                        Customizable Ingredients (Customer Side Preferences)
                                    </label>
                                    <span className="text-[10px] text-slate-500 font-semibold">
                                        {Array.isArray(formData.ingredients) ? formData.ingredients.length : 0} items
                                    </span>
                                </div>

                                {/* List of active customizable ingredient chips */}
                                <div className="flex flex-wrap gap-2">
                                    {Array.isArray(formData.ingredients) && formData.ingredients.map((ing, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white border border-slate-200 shadow-2xs rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-slate-800"
                                        >
                                            <span className="text-[#114536]">{ing}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = formData.ingredients.filter((_, i) => i !== idx);
                                                    setFormData({ ...formData, ingredients: updated });
                                                }}
                                                className="text-slate-400 hover:text-rose-600 transition-colors ml-0.5"
                                                title="Remove ingredient customization"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Customization Input */}
                                <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add customizable item (e.g. Cheese, Mayo, Jalapenos, Garlic)..."
                                        value={newCustomizationItem}
                                        onChange={(e) => setNewCustomizationItem(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddIngredient();
                                            }
                                        }}
                                        className="flex-1 h-9 bg-white border border-slate-200 px-3 rounded-lg text-xs font-medium outline-none focus:border-[#114536]"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddIngredient}
                                        className="h-9 px-3 bg-[#114536] hover:bg-[#0d372b] text-white rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add Item
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Allergens (comma-separated)</label>
                                    <input
                                        type="text"
                                        placeholder="Milk, Gluten"
                                        value={formData.allergens}
                                        onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                                        className="w-full h-11 bg-slate-50 border border-slate-200 px-3.5 rounded-xl text-sm outline-none focus:border-[#114536] text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Taste Profile (comma-separated)</label>
                                    <input
                                        type="text"
                                        placeholder="Savory, Rich, Fresh"
                                        value={formData.tasteProfile}
                                        onChange={(e) => setFormData({ ...formData, tasteProfile: e.target.value })}
                                        className="w-full h-11 bg-slate-50 border border-slate-200 px-3.5 rounded-xl text-sm outline-none focus:border-[#114536] text-slate-900"
                                    />
                                </div>
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
                                    className="w-1/2 h-11 btn-primary text-sm"
                                >
                                    Save Dish
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reusable Confirm Delete Modal */}
            <ConfirmDeleteModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setDishToDelete(null);
                }}
                onConfirm={handleConfirmDeleteDish}
                title="Delete Dish"
                message="Are you sure you want to delete this dish from the menu? This action cannot be undone."
                itemTitle={dishToDelete?.name}
                loading={isDeleting}
            />
        </div>
    );
}
