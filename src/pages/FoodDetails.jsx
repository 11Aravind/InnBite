import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QuantityControl from '../components/QuantityControl';
import { useCart } from 'react-use-cart';
import { apiService } from '../utils/apiService';
import Skeleton from 'react-loading-skeleton';
import ImageWithSkeleton from '../components/ImageWithSkeleton';

const FoodDetails = () => {
    const navigate = useNavigate();
    const { foodId } = useParams();
    const { addItem } = useCart();

    const [foodData, setFoodData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedPortion, setSelectedPortion] = useState(null);

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

    if (!foodData) return <div className="p-8 text-center text-gray-500">Food item not found</div>;

    const portions = foodData.portions && foodData.portions.length > 0
        ? foodData.portions
        : [{ value: "regular", label: "Regular", multiplier: 1 }];

    const portionObj = portions.find(p => p.value === selectedPortion) || portions[0];
    const basePrice = Number(foodData.basePrice || foodData.base_price || 0);
    const price = (basePrice * (portionObj?.multiplier || 1)).toFixed(2);
    const images = foodData.images && foodData.images.length > 0 ? foodData.images : ['/placeholderfood.png'];
    const ingredients = foodData.ingredients || [];
    const allergens = foodData.allergens || [];
    const tasteProfile = foodData.tasteProfile || foodData.taste_profile || [];

    const handleBack = () => {
        navigate(-1);
    };

    const handleIncrease = () => {
        setQuantity(prev => prev + 1);
    };

    const handleDecrease = () => {
        setQuantity(prev => Math.max(1, prev - 1));
    };

    const handleAddToCart = () => {
        addItem(
            {
                id: foodData.id + '-' + (selectedPortion || 'reg'),
                dish_id: foodData.id,
                name: foodData.name,
                price: Number(price),
                image: images[0],
                portion: portionObj.label,
            },
            quantity
        );
        navigate('/cart');
    };

    return (
        <>
            <div
                className="relative flex size-full min-h-screen flex-col bg-white justify-between group/design-root overflow-x-hidden"
                style={{ fontFamily: '"Plus Jakarta Sans", "Noto Sans", sans-serif' }}
            >
                <div>
                    <div className="flex items-center bg-white p-4 pb-2 justify-between">
                        <div
                            className="text-[#171312] flex size-12 shrink-0 items-center cursor-pointer"
                            onClick={handleBack}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24px"
                                height="24px"
                                fill="currentColor"
                                viewBox="0 0 256 256"
                            >
                                <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                            </svg>
                        </div>
                        <h2 className="text-[#171312] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
                            INNBITE
                        </h2>
                    </div>

                    {/* Image Carousel */}
                    <div className="flex overflow-x-auto snap-x snap-mandatory [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <div className="flex w-full">
                            {images.map((img, idx) => (
                                <div key={idx} className="flex-none w-full snap-center p-4">
                                    <ImageWithSkeleton
                                        src={img}
                                        alt={foodData.name}
                                        aspectRatio="aspect-square"
                                        className="w-full max-h-72 rounded-2xl shadow-md border border-slate-100"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <h1 className="text-[#171312] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 text-left pb-1 pt-3">
                        {foodData.name}
                    </h1>
                    <p className="text-[#e74c3c] text-xl font-bold leading-normal pb-3 px-4">
                        ₹{price}
                    </p>
                    <p className="text-[#555] text-base font-normal leading-relaxed pb-3 px-4">
                        {foodData.description}
                    </p>

                    {/* Portion Selectors */}
                    {portions.length > 0 && (
                        <div className="flex px-4 py-3">
                            <div className="flex h-11 flex-1 items-center justify-center rounded-full bg-[#f4f1f1] p-1">
                                {portions.map((portion) => (
                                    <label
                                        key={portion.value}
                                        className={`flex cursor-pointer h-full grow items-center justify-center rounded-full px-3 transition-all text-sm font-medium ${selectedPortion === portion.value ? 'bg-white shadow-sm text-[#171312] font-bold' : 'text-[#836c67]'}`}
                                    >
                                        <span className="truncate">{portion.label}</span>
                                        <input
                                            type="radio"
                                            name="portion"
                                            className="invisible w-0 hidden"
                                            value={portion.value}
                                            checked={selectedPortion === portion.value}
                                            onChange={() => setSelectedPortion(portion.value)}
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Ingredients */}
                    {ingredients.length > 0 && (
                        <>
                            <h3 className="text-[#171312] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
                                Ingredients
                            </h3>
                            <div className="flex gap-2 px-4 py-2 overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {ingredients.map((ingredient, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex h-8 items-center rounded-full bg-[#f4f1f1] px-4 text-sm font-medium text-[#171312] whitespace-nowrap"
                                    >
                                        {ingredient}
                                    </span>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Preparation */}
                    {foodData.preparation && (
                        <>
                            <h3 className="text-[#171312] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-1 pt-4">
                                Preparation
                            </h3>
                            <p className="text-[#555] text-sm font-normal leading-normal pb-3 px-4">
                                {foodData.preparation}
                            </p>
                        </>
                    )}

                    {/* Allergens */}
                    {allergens.length > 0 && (
                        <div className="flex items-center gap-3 bg-[#fff5f5] text-[#c0392b] border border-[#fbd5d5] rounded-xl mx-4 my-2 p-3">
                            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 256 256">
                                <path d="M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09Z" />
                            </svg>
                            <p className="text-sm font-medium">Contains: {allergens.join(", ")}</p>
                        </div>
                    )}

                    {/* Taste Profile */}
                    {tasteProfile.length > 0 && (
                        <div className="flex items-center gap-3 bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd] rounded-xl mx-4 my-2 p-3">
                            <span className="text-lg">✨</span>
                            <p className="text-sm font-medium">Taste Profile: {tasteProfile.join(", ")}</p>
                        </div>
                    )}
                </div>

                {/* Bottom Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 border-t border-[#f4f1f1] bg-white px-4 py-3 flex items-center justify-between gap-4 z-20">
                    <QuantityControl
                        quantity={quantity}
                        onIncrease={handleIncrease}
                        onDecrease={handleDecrease}
                    />
                    <button
                        className="flex-1 flex items-center justify-center gap-2 h-12 bg-[#171212] text-white rounded-full font-bold text-base hover:bg-black transition-colors"
                        onClick={handleAddToCart}
                    >
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                            <path d="M222.14,58.87A8,8,0,0,0,216,56H54.68L49.79,29.14A16,16,0,0,0,34.05,16H16a8,8,0,0,0,0,16h18L59.56,172.29a24,24,0,0,0,5.33,11.27,28,28,0,1,0,44.4,8.44h45.42A27.75,27.75,0,0,0,152,204a28,28,0,1,0,28-28H83.17a8,8,0,0,1-7.87-6.57L72.13,152h116a24,24,0,0,0,23.61-19.71l12.16-66.86A8,8,0,0,0,222.14,58.87Z" />
                        </svg>
                        <span>Add to Cart · ₹{(price * quantity).toFixed(2)}</span>
                    </button>
                </div>
            </div>
            <div className="pb-[84px]" />
        </>
    );
};

export default FoodDetails;