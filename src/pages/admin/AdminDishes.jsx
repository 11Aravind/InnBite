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
    Sparkles,
    X,
    SlidersHorizontal,
    CheckCircle2,
    XCircle,
    Check,
    RefreshCw,
    ArrowUp,
    ArrowDown,
    ChevronsUp,
    ChevronsDown
} from 'lucide-react';

export default function AdminDishes() {
    const [dishes, setDishes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
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

    // Image Position Reordering Handlers (Move Top, Move Up, Move Down, Move Bottom, Remove)
    const handleMoveImageUp = (idx) => {
        if (idx <= 0 || !formData.images) return;
        const updated = [...formData.images];
        const temp = updated[idx];
        updated[idx] = updated[idx - 1];
        updated[idx - 1] = temp;
        setFormData({ ...formData, images: updated });
    };

    const handleMoveImageDown = (idx) => {
        if (!formData.images || idx >= formData.images.length - 1) return;
        const updated = [...formData.images];
        const temp = updated[idx];
        updated[idx] = updated[idx + 1];
        updated[idx + 1] = temp;
        setFormData({ ...formData, images: updated });
    };

    const handleMoveImageTop = (idx) => {
        if (idx <= 0 || !formData.images) return;
        const updated = [...formData.images];
        const [target] = updated.splice(idx, 1);
        updated.unshift(target);
        setFormData({ ...formData, images: updated });
        toast.success(`Moved image to Position #1 (Top / Primary Image)`);
    };

    const handleMoveImageBottom = (idx) => {
        if (!formData.images || idx >= formData.images.length - 1) return;
        const updated = [...formData.images];
        const [target] = updated.splice(idx, 1);
        updated.push(target);
        setFormData({ ...formData, images: updated });
        toast.success(`Moved image to Bottom position`);
    };

    const handleRemoveImage = (idx) => {
        if (!formData.images) return;
        const updated = formData.images.filter((_, i) => i !== idx);
        setFormData({ ...formData, images: updated });
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
        setCustomPortionLabel('');
        setPortionPrice('');
        setNewCustomizationItem('');
        setEditingPortionIdx(null);

        const defaultPresetList = ['Regular', 'Large', 'Small', 'Half', 'Full', 'Medium', 'Family Pack'];

        if (dish) {
            setEditingDish(dish);
            const parsedIngredients = Array.isArray(dish.ingredients)
                ? dish.ingredients
                : (typeof dish.ingredients === 'string' && dish.ingredients.trim())
                    ? dish.ingredients.split(',').map(s => s.trim()).filter(Boolean)
                    : ['Cheese', 'Onion', 'Garlic', 'Spice'];

            const initialPortions = (dish.portions && dish.portions.length > 0) ? dish.portions : [
                { value: "regular", label: "Regular", price: Number(dish.basePrice || dish.base_price || 0) }
            ];

            const availablePreset = defaultPresetList.find(p => !initialPortions.some(existing => existing.label.toLowerCase() === p.toLowerCase())) || 'Other';
            setSelectedPresetPortion(availablePreset);

            setFormData({
                name: dish.name || '',
                description: dish.description || '',
                preparation: dish.preparation || dish.preparation_details || '',
                basePrice: dish.basePrice || dish.base_price || '',
                category: dish.category || dish.category_id || '',
                images: (dish.images && Array.isArray(dish.images)) ? dish.images.slice(0, 5) : (dish.image || dish.image_url ? [dish.image || dish.image_url] : []),
                ingredients: parsedIngredients,
                allergens: Array.isArray(dish.allergens) ? dish.allergens.join(', ') : '',
                ingredientsList: Array.isArray(dish.ingredients_list) ? dish.ingredients_list.join(', ') : '',
                tasteProfile: Array.isArray(dish.tasteProfile || dish.taste_profile) ? (dish.tasteProfile || dish.taste_profile).join(', ') : '',
                isPopular: Boolean(dish.is_popular || dish.isPopular),
                isSpecial: Boolean(dish.is_special || dish.isSpecial),
                isAvailable: dish.is_available !== undefined ? dish.is_available : true,
                isVeg: dish.is_veg !== undefined ? Boolean(dish.is_veg) : dish.isVeg !== undefined ? Boolean(dish.isVeg) : true,
                portions: initialPortions
            });
        } else {
            setEditingDish(null);
            const initialPortions = [
                { value: "regular", label: "Regular", price: 0 }
            ];
            const availablePreset = defaultPresetList.find(p => !initialPortions.some(existing => existing.label.toLowerCase() === p.toLowerCase())) || 'Other';
            setSelectedPresetPortion(availablePreset);

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
                isVeg: true,
                portions: initialPortions,
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

        const basePriceNum = Number(formData.basePrice) || 0;

        const processedPortions = (formData.portions && formData.portions.length > 0)
            ? formData.portions.map(p => {
                const pPrice = Number(p.price);
                const isReg = p.label.toLowerCase() === 'regular' || formData.portions.length === 1;
                const finalPrice = (isNaN(pPrice) || pPrice === 0) && isReg && basePriceNum > 0
                    ? basePriceNum
                    : (isNaN(pPrice) ? 0 : pPrice);
                return {
                    ...p,
                    price: finalPrice
                };
            })
            : [{ value: "regular", label: "Regular", price: basePriceNum }];

        const payload = {
            id: editingDish?.id,
            name: formData.name,
            description: formData.description,
            preparation: formData.preparation,
            basePrice: basePriceNum,
            base_price: basePriceNum,
            category: formData.category,
            category_id: formData.category,
            images: formData.images,
            portions: processedPortions,
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
            is_available: formData.isAvailable,
            is_veg: formData.isVeg !== false
        };

        setIsSaving(true);
        try {
            await apiService.saveDish(payload);
            toast.success(`Dish "${payload.name}" saved successfully!`);
            setIsModalOpen(false);
            loadData();
        } catch (err) {
            console.error('Save dish error:', err);
            toast.error(err.message || 'Failed to save dish into database.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleAvailability = async (dish) => {
        const newStatus = !(dish.is_available !== false);

        // Optimistically update UI
        setDishes(prev => prev.map(d => d.id === dish.id ? { ...d, is_available: newStatus } : d));

        try {
            await apiService.toggleDishAvailability(dish.id, newStatus);
            toast.success(`"${dish.name}" is now ${newStatus ? 'Available' : 'Out of Stock'}`);
        } catch (err) {
            console.error('Error toggling dish availability:', err);
            toast.error('Failed to update stock status in Supabase');
            loadData();
        }
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
            header: 'Regular Price',
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
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Left Column: Basic Details & Portions */}
                                <div className="lg:col-span-7 space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                                Regular Price (₹) <span className="text-rose-500 font-bold ml-0.5">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                placeholder="250.00"
                                                value={formData.basePrice}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const newPriceNum = val !== '' ? Number(val) : 0;
                                                    
                                                    let hasRegular = false;
                                                    let updatedPortions = (formData.portions || []).map(p => {
                                                        if ((p.label || p.value || '').toLowerCase() === 'regular') {
                                                            hasRegular = true;
                                                            return { ...p, price: newPriceNum };
                                                        }
                                                        return p;
                                                    });

                                                    if (!hasRegular && updatedPortions.length === 0) {
                                                        updatedPortions = [{ value: 'regular', label: 'Regular', price: newPriceNum }];
                                                    }

                                                    setFormData({
                                                        ...formData,
                                                        basePrice: val,
                                                        portions: updatedPortions
                                                    });
                                                }}
                                                className="w-full h-11 bg-slate-50 border border-slate-200 px-3.5 rounded-xl text-sm outline-none focus:border-[#114536] text-slate-900 font-bold"
                                            />
                                        </div>
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

                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-800 block">
                                                Portion Sizes & Pricing Chips
                                            </label>
                                            <span className="text-[10px] text-slate-500 font-semibold">
                                                Regular: ₹{Number(formData.basePrice || 0).toFixed(2)}
                                            </span>
                                        </div>

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
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingPortionIdx(null)}
                                                                className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition-colors"
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
                                                        <span className="text-[#114536] font-extrabold">{p.label || p.value}</span>
                                                        <span className="text-slate-500 text-[11px] font-semibold bg-slate-100 px-1.5 py-0.5 rounded-md">
                                                            ₹{calculatedPrice}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStartEditPortion(idx, p)}
                                                            className="text-slate-400 hover:text-[#114536] transition-colors ml-0.5"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        {formData.portions.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const updated = formData.portions.filter((_, i) => i !== idx);
                                                                    setFormData({ ...formData, portions: updated });
                                                                    const presetList = ['Regular', 'Large', 'Small', 'Half', 'Full', 'Medium', 'Family Pack'];
                                                                    const nextAvail = presetList.find(preset => !updated.some(existing => (existing.label || existing.value || '').toLowerCase() === preset.toLowerCase())) || 'Other';
                                                                    setSelectedPresetPortion(nextAvail);
                                                                }}
                                                                className="text-slate-400 hover:text-rose-600 transition-colors"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="pt-2 border-t border-slate-200/60 space-y-2">
                                            <div className="flex items-center gap-2 w-full">
                                                <select
                                                    value={selectedPresetPortion}
                                                    onChange={(e) => setSelectedPresetPortion(e.target.value)}
                                                    className={`${selectedPresetPortion === 'Other' ? 'w-[100px]' : 'flex-1'} shrink-0 h-9 bg-white border border-slate-200 px-2 rounded-lg text-xs font-bold outline-none focus:border-[#114536] truncate`}
                                                >
                                                    {['Regular', 'Large', 'Small', 'Half', 'Full', 'Medium', 'Family Pack']
                                                        .filter(label => !formData.portions?.some(p => (p.label || p.value || '').toLowerCase() === label.toLowerCase()))
                                                        .map(label => (
                                                            <option key={label} value={label}>{label}</option>
                                                        ))
                                                    }
                                                    <option value="Other">Other...</option>
                                                </select>

                                                {selectedPresetPortion === 'Other' && (
                                                    <input
                                                        type="text"
                                                        placeholder="Custom..."
                                                        value={customPortionLabel}
                                                        onChange={(e) => setCustomPortionLabel(e.target.value)}
                                                        className="flex-1 min-w-0 h-9 bg-white border border-slate-200 px-2 rounded-lg text-xs font-medium outline-none focus:border-[#114536]"
                                                    />
                                                )}

                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Price..."
                                                    value={portionPrice}
                                                    onChange={(e) => setPortionPrice(e.target.value)}
                                                    className="w-20 sm:w-24 shrink-0 h-9 bg-white border border-slate-200 px-2 rounded-lg text-xs font-medium outline-none focus:border-[#114536]"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const finalLabel = selectedPresetPortion === 'Other' ? customPortionLabel.trim() : selectedPresetPortion;
                                                        if (!finalLabel) {
                                                            toast.error('Please specify a portion size label');
                                                            return;
                                                        }
                                                        
                                                        if (formData.portions?.some(p => (p.label || p.value || '').toLowerCase() === finalLabel.toLowerCase())) {
                                                            toast.error(`"${finalLabel}" size already exists!`);
                                                            return;
                                                        }

                                                        let defaultPrice = portionPrice !== '' ? Number(portionPrice) : (Number(formData.basePrice) || 0);

                                                        const newChip = {
                                                            value: finalLabel.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                                                            label: finalLabel,
                                                            price: defaultPrice
                                                        };

                                                        const updatedPortions = [...(formData.portions || []), newChip];
                                                        setFormData({
                                                            ...formData,
                                                            portions: updatedPortions
                                                        });
                                                        setCustomPortionLabel('');
                                                        setPortionPrice('');

                                                        const presetList = ['Regular', 'Large', 'Small', 'Half', 'Full', 'Medium', 'Family Pack'];
                                                        const nextAvailable = presetList.find(p => !updatedPortions.some(existing => (existing.label || existing.value || '').toLowerCase() === p.toLowerCase())) || 'Other';
                                                        setSelectedPresetPortion(nextAvailable);
                                                    }}
                                                    className="h-9 px-4 bg-[#114536] hover:bg-[#0d372b] text-white rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1"
                                                >
                                                    <Plus className="w-3.5 h-3.5" /> Add Chip
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Dish Images & Position Reordering Controls */}
                                <div className="lg:col-span-5">
                                    <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 h-full">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                <span>Dish Images</span>
                                                <span className="text-[10px] text-slate-500 font-normal">(Reorder & Set Primary)</span>
                                            </label>
                                            <span className="text-[10px] font-bold text-[#114536] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                {formData.images?.length || 0}/5 uploaded
                                            </span>
                                        </div>

                                        {/* Uploaded Images List with Position Controls */}
                                        <div className="space-y-3">
                                            {formData.images && formData.images.map((imgUrl, idx) => (
                                                <div key={idx} className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-2.5 transition-all">
                                                    {/* Card Header: Position Badge & Remove Button */}
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-1.5">
                                                            {idx === 0 ? (
                                                                <span className="px-2 py-0.5 bg-[#114536] text-white text-[11px] font-extrabold rounded-full flex items-center gap-1 shadow-xs">
                                                                    <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                                                                    <span>Top / Primary Image</span>
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-extrabold rounded-full border border-slate-200">
                                                                    Position #{idx + 1}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveImage(idx)}
                                                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                            title="Remove image"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    {/* Image Preview / Crop Picker */}
                                                    <ImageFileInput
                                                        value={imgUrl}
                                                        onChange={(croppedImg) => {
                                                            let newImages = [...(formData.images || [])];
                                                            if (croppedImg) {
                                                                newImages[idx] = croppedImg;
                                                            } else {
                                                                newImages = newImages.filter((_, i) => i !== idx);
                                                            }
                                                            setFormData({ ...formData, images: newImages });
                                                        }}
                                                        label={idx === 0 ? "Primary Image" : `Image #${idx + 1}`}
                                                        aspect={1 / 1}
                                                        dimensions="800 x 800 px (1:1 Square)"
                                                        required={idx === 0}
                                                    />

                                                    {/* Position Control Buttons (Move Top, Move Up, Move Down, Move Bottom) */}
                                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 flex-wrap">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Change Position:</span>
                                                        <div className="flex items-center gap-1">
                                                            {/* Move to Top (Primary) */}
                                                            <button
                                                                type="button"
                                                                disabled={idx === 0}
                                                                onClick={() => handleMoveImageTop(idx)}
                                                                className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-[#114536] hover:border-emerald-300 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 flex items-center gap-0.5 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                                                                title="Move to Position #1 (Primary / Top Image)"
                                                            >
                                                                <ChevronsUp className="w-3.5 h-3.5" />
                                                                <span>Top</span>
                                                            </button>

                                                            {/* Move Up 1 Step */}
                                                            <button
                                                                type="button"
                                                                disabled={idx === 0}
                                                                onClick={() => handleMoveImageUp(idx)}
                                                                className="p-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                                                                title="Move Up 1 Position"
                                                            >
                                                                <ArrowUp className="w-3.5 h-3.5" />
                                                            </button>

                                                            {/* Move Down 1 Step */}
                                                            <button
                                                                type="button"
                                                                disabled={idx === formData.images.length - 1}
                                                                onClick={() => handleMoveImageDown(idx)}
                                                                className="p-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                                                                title="Move Down 1 Position"
                                                            >
                                                                <ArrowDown className="w-3.5 h-3.5" />
                                                            </button>

                                                            {/* Move to Bottom */}
                                                            <button
                                                                type="button"
                                                                disabled={idx === formData.images.length - 1}
                                                                onClick={() => handleMoveImageBottom(idx)}
                                                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 flex items-center gap-0.5 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                                                                title="Move to Bottom Position"
                                                            >
                                                                <ChevronsDown className="w-3.5 h-3.5" />
                                                                <span>Bottom</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Add New Image Slot (if under max 5) */}
                                            {(!formData.images || formData.images.length < 5) && (
                                                <div className="bg-white border-2 border-dashed border-slate-200 hover:border-[#114536]/50 rounded-2xl p-3 transition-colors">
                                                    <ImageFileInput
                                                        value=""
                                                        onChange={(croppedImg) => {
                                                            if (croppedImg) {
                                                                setFormData({
                                                                    ...formData,
                                                                    images: [...(formData.images || []), croppedImg]
                                                                });
                                                            }
                                                        }}
                                                        label={!formData.images || formData.images.length === 0 ? "+ Upload Primary Dish Image *" : `+ Add Image #${(formData.images?.length || 0) + 1}`}
                                                        aspect={1 / 1}
                                                        dimensions="800 x 800 px (1:1 Square)"
                                                        required={!formData.images || formData.images.length === 0}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Preparation Details</label>
                                    <textarea
                                        rows="2"
                                        placeholder="e.g. Hand-tossed pizza dough topped with San Marzano tomatoes..."
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

                            {/* Dietary Type Selector (Veg / Non-Veg) */}
                            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                                <label className="text-xs font-bold text-slate-800 block">Dietary Type</label>
                                <div className="flex gap-3 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, isVeg: true })}
                                        className={`flex-1 py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${formData.isVeg !== false ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-xs' : 'bg-white text-slate-600 border-slate-200'}`}
                                    >
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                                        <span>Vegetarian (Veg)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, isVeg: false })}
                                        className={`flex-1 py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${formData.isVeg === false ? 'bg-rose-50 text-rose-900 border-rose-300 shadow-xs' : 'bg-white text-slate-600 border-slate-200'}`}
                                    >
                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                                        <span>Non-Vegetarian (Non-Veg)</span>
                                    </button>
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
                                    disabled={isSaving}
                                    className="w-1/2 h-11 btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                                >
                                    {isSaving ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Saving Dish...</span>
                                        </>
                                    ) : (
                                        <span>Save Dish</span>
                                    )}
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