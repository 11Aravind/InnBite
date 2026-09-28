import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QuantityControl from '../components/QuantityControl';
import { useCart } from 'react-use-cart';
import { apiService } from '../utils/apiService';
import Skeleton from 'react-loading-skeleton';
import ImageWithSkeleton from '../components/ImageWithSkeleton';
import { Sparkles, MessageSquare, Plus, Check } from 'lucide-react';

const FoodDetails = () => {
    const navigate = useNavigate();
    const { foodId } = useParams();
    const { addItem } = useCart();

    const [foodData, setFoodData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedPortion, setSelectedPortion] = useState(null);

    // Customization State
    const [ingredientOptions, setIngredientOptions] = useState({
        Cheese: 'Normal',
        Onion: 'Normal',
        Spice: 'Normal',
        Garlic: 'Normal'
    });
    const [specialInstruction, setSpecialInstruction] = useState('');

    useEffect(() => {
        window.scrollTo(0, 0);
        setLoading(true);
        apiService.getDishById(foodId)
            .then(data => {
                if (data) {
                    setFoodData(data);
                    const defaultPortion = (data.portions && data.portions.length > 0)
                        ? data.portions[0].value
                        : "regular";
                    setSelectedPortion(defaultPortion);
                }
            })
            .catch(err => console.error('Error fetching dish:', err))
            .finally(() => setLoading(false));
    }, [foodId]);

    if (loading) {
        return (
            <div className="p-4 bg-white min-h-screen">
                <Skeleton height={200} borderRadius={16} />
                <Skeleton height={28} width="60%" style={{ marginTop: 16 }} />
                <Skeleton height={20} width="30%" style={{ marginTop: 8 }} />
                <Skeleton height={60} style={{ marginTop: 16 }} />
            </div>
        );
    }

    if (!foodData) return <div className="p-8 text-center text-gray-500 font-bold">Food item not found</div>;

    const portions = foodData.portions && foodData.portions.length > 0
        ? foodData.portions
        : [{ value: "regular", label: "Regular", multiplier: 1 }];

    const portionObj = portions.find(p => p.value === selectedPortion) || portions[0];
    const basePrice = Number(foodData.basePrice || foodData.base_price || 0);
    const price = (basePrice * (portionObj?.multiplier || 1)).toFixed(2);
    const images = foodData.images && foodData.images.length > 0 ? foodData.images : ['/placeholderfood.png'];
    const ingredients = foodData.ingredients || ['Cheese', 'Onion', 'Garlic', 'Herbs'];
    const allergens = foodData.allergens || [];

    const handleBack = () => {
        navigate(-1);
    };

    const handleIngredientChange = (name, level) => {
        setIngredientOptions(prev => ({
            ...prev,
            [name]: level
        }));
    };

    const handleAddToCart = () => {
        // Filter out normal options to keep customizations clean
        const activeCustomizations = {};
        Object.entries(ingredientOptions).forEach(([key, val]) => {
            if (val !== 'Normal') {
                activeCustomizations[key] = val;
            }
        });

        // Requirement Sec 30: Unique item ID ensures quantity-level customization differentiation
        const customHash = JSON.stringify(activeCustomizations) + '_' + specialInstruction.trim();
        const uniqueCartItemId = `${foodData.id}-${selectedPortion || 'reg'}-${customHash.replace(/[^a-zA-Z0-9]/g, '')}`;

        addItem(
            {
                id: uniqueCartItemId,
                dish_id: foodData.id,
                name: foodData.name,
                price: Number(price),
                image: images[0],
                portion: portionObj.label,
                customizations: activeCustomizations,
                special_instruction: specialInstruction.trim(),
                specialInstruction: specialInstruction.trim()
            },
            quantity
        );
        navigate('/cart');
    };

    return (
        <div className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-between font-sans pb-24">
            <div>
                {/* Header */}
                <div className="flex items-center bg-white p-4 justify-between border-b border-slate-100 shadow-sm sticky top-0 z-20">
                    <button
                        onClick={handleBack}
                        className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 hover:bg-slate-200 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 className="text-slate-900 text-base font-extrabold tracking-tight">
                        InnBite Menu
                    </h2>
                    <div className="w-10" />
                </div>

                {/* Main Content Card */}
                <div className="p-4 max-w-lg mx-auto space-y-6">
                    {/* Image */}
                    <div className="bg-white rounded-3xl p-3 shadow-sm border border-slate-200/80">
                        <ImageWithSkeleton
                            src={images[0]}
                            alt={foodData.name}
                            aspectRatio="aspect-square"
                            className="w-full max-h-72 rounded-2xl object-cover shadow-inner"
                        />
                    </div>

                    {/* Title & Price */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                {foodData.name}
                            </h1>
                            <span className="text-xl font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-xl border border-rose-100">
                                ₹{price}
                            </span>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed pt-1 font-medium">
                            {foodData.description}
                        </p>
                    </div>

                    {/* Portions */}
                    {portions.length > 0 && (
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                                Select Portion Size
                            </h3>
                            <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
                                {portions.map((portion) => (
                                    <button
                                        key={portion.value}
                                        type="button"
                                        onClick={() => setSelectedPortion(portion.value)}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedPortion === portion.value
                                            ? 'bg-slate-900 text-white shadow-md'
                                            : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                    >
                                        {portion.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Customization Options (Req Sec 29) */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80 space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                                Ingredient Customizations
                            </h3>
                        </div>

                        {['Cheese', 'Onion', 'Spice', 'Garlic'].map((ing) => (
                            <div key={ing} className="border-b border-slate-100 pb-3.5 last:border-0 last:pb-0">
                                <span className="text-xs font-bold text-slate-700 block mb-2">{ing} Preference</span>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {['Less', 'Normal', 'Extra', 'No'].map((lvl) => {
                                        const label = lvl === 'No' ? `No ${ing}` : lvl;
                                        const isSelected = (ingredientOptions[ing] || 'Normal') === lvl;
                                        return (
                                            <button
                                                key={lvl}
                                                type="button"
                                                onClick={() => handleIngredientChange(ing, lvl)}
                                                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${isSelected
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Special Instructions */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80">
                        <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-indigo-500" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Special Instructions
                            </h3>
                        </div>
                        <textarea
                            rows="2"
                            placeholder="e.g. Less oil, extra crispy, no garlic..."
                            value={specialInstruction}
                            onChange={(e) => setSpecialInstruction(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-slate-900 transition-all resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Add to Cart Floating Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-2xl z-30">
                <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 bg-slate-100 px-3 py-1.5 rounded-2xl border border-slate-200">
                        <button
                            type="button"
                            onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                            className="w-8 h-8 rounded-xl bg-white text-slate-900 font-bold shadow-sm flex items-center justify-center text-sm"
                        >
                            -
                        </button>
                        <span className="font-extrabold text-sm text-slate-900 w-4 text-center">{quantity}</span>
                        <button
                            type="button"
                            onClick={() => setQuantity(prev => prev + 1)}
                            className="w-8 h-8 rounded-xl bg-white text-slate-900 font-bold shadow-sm flex items-center justify-center text-sm"
                        >
                            +
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleAddToCart}
                        className="flex-1 py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-slate-900/10 flex items-center justify-between transition-all"
                    >
                        <span>Add to Order</span>
                        <span>₹{(price * quantity).toFixed(2)}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FoodDetails;