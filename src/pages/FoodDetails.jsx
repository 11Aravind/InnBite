import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QuantityControl from '../components/QuantityControl';
import { useCart } from 'react-use-cart';
import { apiService } from '../utils/apiService';
import Skeleton from 'react-loading-skeleton';
import ImageWithSkeleton from '../components/ImageWithSkeleton';
import { Sparkles, MessageSquare, Plus, Check, AlertTriangle, ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { APP_CONFIG } from '../config';
import { useSettings } from '../context/SettingsContext';

const FoodDetails = () => {
    const navigate = useNavigate();
    const { appName } = useSettings();
    const { foodId } = useParams();
    const { addItem, totalUniqueItems } = useCart();

    const [foodData, setFoodData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedPortion, setSelectedPortion] = useState(null);

    // Customization State
    const [ingredientOptions, setIngredientOptions] = useState({});
    const [specialInstruction, setSpecialInstruction] = useState('');

    const [settings, setSettings] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        setLoading(true);
        Promise.all([
            apiService.getDishById(foodId),
            apiService.getRestaurantSettings()
        ])
            .then(([data, settingsData]) => {
                if (data) {
                    setFoodData(data);
                    const defaultPortion = (data.portions && data.portions.length > 0)
                        ? data.portions[0].value
                        : "regular";
                    setSelectedPortion(defaultPortion);
                }
                if (settingsData) {
                    setSettings(settingsData);
                }
            })
            .catch(err => console.error('Error fetching data:', err))
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
        : [{ value: "regular", label: "Regular", price: Number(foodData.basePrice || foodData.base_price || 0) }];

    const portionObj = portions.find(p => p.value === selectedPortion) || portions[0];
    const basePrice = Number(foodData.basePrice || foodData.base_price || 0);
    const price = (portionObj?.price !== undefined ? Number(portionObj.price) : (basePrice * (portionObj?.multiplier || 1))).toFixed(2);
    const images = foodData.images && foodData.images.length > 0 ? foodData.images : ['/placeholderfood.png'];
    const ingredients = (foodData.ingredients && Array.isArray(foodData.ingredients))
        ? foodData.ingredients
        : (typeof foodData.ingredients === 'string' && foodData.ingredients.trim())
            ? foodData.ingredients.split(',').map(s => s.trim()).filter(Boolean)
            : [];
    
    let ingredientsList = Array.isArray(foodData.ingredients_list) && foodData.ingredients_list.length > 0
        ? foodData.ingredients_list 
        : typeof foodData.ingredients_list === 'string' && foodData.ingredients_list.trim()
            ? foodData.ingredients_list.split(',').map(s => s.trim()).filter(Boolean)
            : [];
            
    if (ingredientsList.length === 0 && ingredients.length > 0) {
        ingredientsList = ingredients;
    }

    const allergensList = Array.isArray(foodData.allergens)
        ? foodData.allergens
        : typeof foodData.allergens === 'string'
            ? foodData.allergens.split(',').map(s => s.trim()).filter(Boolean)
            : [];

    const tasteProfileList = Array.isArray(foodData.tasteProfile || foodData.taste_profile)
        ? (foodData.tasteProfile || foodData.taste_profile)
        : typeof (foodData.tasteProfile || foodData.taste_profile) === 'string'
            ? (foodData.tasteProfile || foodData.taste_profile).split(',').map(s => s.trim()).filter(Boolean)
            : [];

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

        toast.success(`${quantity}x ${foodData.name} added to order!`, {
            icon: '🛒',
            style: {
                borderRadius: '16px',
                background: '#114536',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '14px',
                padding: '12px 18px',
            },
            duration: 2500,
        });
    };

    return (
        <div className="relative flex size-full min-h-screen flex-col bg-white justify-between font-sans">
            <div>
                {/* Header */}
                <div className="flex items-center bg-white p-4 pb-2 justify-between sticky top-0 z-20">
                    <div 
                        className="text-[#171312] flex size-12 shrink-0 items-center cursor-pointer"
                        onClick={handleBack}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                            <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                        </svg>
                    </div>
                    <h2 className="text-[#171312] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center uppercase">
                        {appName}
                    </h2>
                    <div className="flex items-center gap-3">
                        <button className="flex cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 w-10 bg-transparent text-[#171312] transition-transform active:scale-95">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22px" height="22px" fill="currentColor" viewBox="0 0 256 256">
                                <path d="M222.37,158.46l-47.11-21.11-.13-.06a16,16,0,0,0-15.17,1.4,8.12,8.12,0,0,0-.75.56L134.87,160c-15.42-7.49-31.34-23.29-38.83-38.51l20.78-24.71c.2-.25.39-.5.57-.77a16,16,0,0,0,1.32-15.06l0-.12L97.54,33.64a16,16,0,0,0-16.62-9.52A56.26,56.26,0,0,0,32,80c0,79.4,64.6,144,144,144a56.26,56.26,0,0,0,55.88-48.92A16,16,0,0,0,222.37,158.46ZM176,208A128.14,128.14,0,0,1,48,80,40.2,40.2,0,0,1,82.87,40a.61.61,0,0,0,0,.12l21,47L83.2,111.86a6.13,6.13,0,0,0-.57.77,16,16,0,0,0-1,15.7c9.06,18.53,27.73,37.06,46.46,46.11a16,16,0,0,0,15.75-1.14,8.44,8.44,0,0,0,.74-.56L168.89,152l47,21.05h0s.08,0,.11,0A40.21,40.21,0,0,1,176,208Z"></path>
                            </svg>
                        </button>
                        <button 
                            onClick={() => navigate('/cart')}
                            className="relative flex cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 w-10 bg-[#f4f1f1] text-[#171312] transition-transform active:scale-95"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            {totalUniqueItems > 0 && (
                                <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#f05a4a] text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                                    {totalUniqueItems}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Image Carousel */}
                <div className="flex overflow-x-auto snap-x snap-mandatory [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4">
                    <div className="flex gap-3 w-max py-2">
                        {images.map((img, idx) => (
                            <div key={idx} className={`flex-none ${images.length > 1 ? 'w-[88vw]' : 'w-[calc(100vw-32px)]'} max-w-[400px] snap-center`}>
                                <ImageWithSkeleton
                                    src={img}
                                    alt={`${foodData.name} ${idx + 1}`}
                                    aspectRatio="aspect-square"
                                    className="w-full bg-center bg-no-repeat bg-cover rounded-xl shadow-sm"
                                />
                            </div>
                        ))}
                    </div>
                </div>
                {images.length > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                        {images.map((_, idx) => (
                            <div key={idx} className="w-2 h-2 rounded-full bg-[#171312]/30"></div>
                        ))}
                    </div>
                )}

                {/* Title & Price */}
                <h1 className="text-[#171312] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 text-left pb-3 pt-5">
                    {foodData.name}
                </h1>
                <p className="text-[#836c67] text-sm font-normal leading-normal pb-3 pt-1 px-4">
                    ₹{price}
                </p>
                <p className="text-[#171312] text-base font-normal leading-normal pb-3 pt-1 px-4">
                    {foodData.description}
                </p>

                {/* Portions */}
                {portions.length > 0 && (
                    <div className="flex px-4 py-3">
                        <div className="flex h-10 flex-1 items-center justify-center rounded-full bg-[#f4f1f1] p-1">
                            {portions.map((portion) => {
                                const isChecked = selectedPortion === portion.value;
                                return (
                                    <label
                                        key={portion.value}
                                        className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-full px-2 text-sm font-medium leading-normal transition-all ${isChecked ? 'bg-white shadow-[0_0_4px_rgba(0,0,0,0.1)] text-[#171312]' : 'text-[#836c67]'}`}
                                    >
                                        <span className="truncate">{portion.label}</span>
                                        <input 
                                            type="radio" 
                                            name="portionSelection" 
                                            className="invisible w-0" 
                                            value={portion.value}
                                            checked={isChecked}
                                            onChange={() => setSelectedPortion(portion.value)}
                                        />
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Ingredients Display */}
                {ingredientsList.length > 0 && (
                    <>
                        <h3 className="text-[#171312] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Ingredients</h3>
                        <div className="flex gap-3 p-3 overflow-x-auto snap-x snap-mandatory [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <div className="flex flex-nowrap gap-3">
                                {ingredientsList.map((ing, idx) => (
                                    <div key={idx} className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-[#f4f1f1] px-4">
                                        <p className="text-[#171312] text-sm font-medium leading-normal whitespace-nowrap">{ing}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}





                {/* Preparation */}
                {foodData.preparation && (
                    <>
                        <h3 className="text-[#171312] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Preparation</h3>
                        <p className="text-[#171312] text-base font-normal leading-normal pb-3 pt-1 px-4">
                            {foodData.preparation}
                        </p>
                    </>
                )}

                {/* Allergens */}
                {allergensList.length > 0 && (
                    <div className="flex items-center gap-4 bg-white px-4 min-h-14">
                        <div className="text-[#171312] flex items-center justify-center rounded-lg bg-[#f4f1f1] shrink-0 size-10">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                                <path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z"></path>
                            </svg>
                        </div>
                        <p className="text-[#171312] text-base font-normal leading-normal flex-1 truncate">
                            Contains: {allergensList.join(', ')}
                        </p>
                    </div>
                )}

                {/* Taste Profile */}
                {tasteProfileList.length > 0 && (
                    <div className="flex items-center gap-4 bg-white px-4 min-h-14">
                        <div className="text-[#171312] flex items-center justify-center rounded-lg bg-[#f4f1f1] shrink-0 size-10">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                                <path d="M200.77,53.89A103.27,103.27,0,0,0,128,24h-1.07A104,104,0,0,0,24,128c0,43,26.58,79.06,69.36,94.17A32,32,0,0,0,136,192a16,16,0,0,1,16-16h46.21a31.81,31.81,0,0,0,31.2-24.88,104.43,104.43,0,0,0,2.59-24A103.28,103.28,0,0,0,200.77,53.89Zm13,93.71A15.89,15.89,0,0,1,198.21,160H152a32,32,0,0,0-32,32,16,16,0,0,1-21.31,15.07C62.49,194.3,40,164,40,128a88,88,0,0,1,87.09-88h.9a88.35,88.35,0,0,1,88,87.25A88.86,88.86,0,0,1,213.81,147.6ZM140,76a12,12,0,1,1-12-12A12,12,0,0,1,140,76ZM96,100A12,12,0,1,1,84,88,12,12,0,0,1,96,100Zm0,56a12,12,0,1,1-12-12A12,12,0,0,1,96,156Zm88-56a12,12,0,1,1-12-12A12,12,0,0,1,184,100Z"></path>
                            </svg>
                        </div>
                        <p className="text-[#171312] text-base font-normal leading-normal flex-1 truncate">
                            Taste Profile: {tasteProfileList.join(', ')}
                        </p>
                    </div>
                )}



                {/* Special Instructions */}
                <div className="px-4 py-4">
                    <h3 className="text-[#171312] text-lg font-bold leading-tight tracking-[-0.015em] pb-2">Special Instructions</h3>
                    <textarea
                        rows="2"
                        placeholder="e.g. Less oil, extra crispy..."
                        value={specialInstruction}
                        onChange={(e) => setSpecialInstruction(e.target.value)}
                        className="w-full p-3 bg-[#f4f1f1] border-none rounded-xl text-sm font-medium text-[#171312] outline-none focus:ring-2 focus:ring-slate-300 transition-all resize-none placeholder:text-[#836c67]"
                    />
                </div>
                
                <div className="pb-[84px]"></div>
            </div>

            {/* Bottom Add to Cart Floating Bar */}
            <div className="flex justify-stretch fixed rounded-t-lg bottom-0 left-0 right-0 bg-white shadow-[0_-2px_6px_-1px_rgba(0,0,0,0.1)] z-30">
                <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 justify-between max-w-lg mx-auto w-full">
                    <div className="flex min-w-[84px] items-center justify-between rounded-full h-12 px-2 bg-[#f4f1f1] text-[#171312]">
                        <button type="button" onClick={() => setQuantity(prev => Math.max(1, prev - 1))} className="w-10 h-10 flex items-center justify-center text-xl font-bold cursor-pointer">-</button>
                        <span className="font-bold text-base w-4 text-center">{quantity}</span>
                        <button type="button" onClick={() => setQuantity(prev => prev + 1)} className="w-10 h-10 flex items-center justify-center text-xl font-bold cursor-pointer">+</button>
                    </div>
                    <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={settings?.is_closed}
                        className={`flex flex-1 max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-5 text-base font-bold leading-normal tracking-[0.015em] gap-2 transition-transform ${settings?.is_closed ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-[#edc3ba] text-[#171312] active:scale-95'}`}
                    >
                        {!settings?.is_closed && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                                <path d="M222.14,58.87A8,8,0,0,0,216,56H54.68L49.79,29.14A16,16,0,0,0,34.05,16H16a8,8,0,0,0,0,16h18L59.56,172.29a24,24,0,0,0,5.33,11.27,28,28,0,1,0,44.4,8.44h45.42A27.75,27.75,0,0,0,152,204a28,28,0,1,0,28-28H83.17a8,8,0,0,1-7.87-6.57L72.13,152h116a24,24,0,0,0,23.61-19.71l12.16-66.86A8,8,0,0,0,222.14,58.87Z" />
                            </svg>
                        )}
                        <span className="truncate">{settings?.is_closed ? 'Shop is Closed' : 'Add Item'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FoodDetails;