import React, { useState, useEffect } from 'react';
import { apiService } from '../../utils/apiService';

export default function AdminBanners() {
    const [banners, setBanners] = useState([]);
    const [dishes, setDishes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [title, setTitle] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [dishId, setDishId] = useState('');

    const loadData = async () => {
        setLoading(true);
        const [homeData, dishesData] = await Promise.all([
            apiService.getHomePageData(),
            apiService.getDishes()
        ]);
        setBanners(homeData.banners || []);
        setDishes(dishesData || []);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        await apiService.saveBanner({
            title,
            image_url: imageUrl,
            dish_id: dishId || null
        });
        setIsModalOpen(false);
        setTitle('');
        setImageUrl('');
        setDishId('');
        loadData();
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete promotional banner?')) {
            await apiService.deleteBanner(id);
            loadData();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Promotional Banners</h1>
                    <p className="text-xs text-gray-500">Manage top carousel banner cards on the home screen</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2.5 bg-black hover:bg-gray-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-sm"
                >
                    <span>🖼️ Add New Banner</span>
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading banners...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {banners.map((b) => (
                        <div key={b.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <div
                                className="w-full h-40 bg-center bg-cover rounded-xl mb-3"
                                style={{ backgroundImage: `url("${b.image_url}")` }}
                            />
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm">{b.title}</h3>
                                    {b.dish_id && <span className="text-[11px] text-amber-600 font-semibold block">Linked Dish ID: {b.dish_id}</span>}
                                </div>
                                <button onClick={() => handleDelete(b.id)} className="px-3 py-1 bg-red-50 text-xs font-bold rounded-lg text-red-600">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Add Promo Banner</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Banner Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full h-11 bg-gray-50 border border-gray-200 px-3 rounded-xl text-sm outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Banner Image URL *</label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://..."
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    className="w-full h-11 bg-gray-50 border border-gray-200 px-3 rounded-xl text-sm outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Link to Dish (Optional)</label>
                                <select
                                    value={dishId}
                                    onChange={(e) => setDishId(e.target.value)}
                                    className="w-full h-11 bg-gray-50 border border-gray-200 px-3 rounded-xl text-sm outline-none"
                                >
                                    <option value="">-- No link --</option>
                                    {dishes.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="w-1/2 h-11 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm">Cancel</button>
                                <button type="submit" className="w-1/2 h-11 bg-black text-white font-bold rounded-xl text-sm">Save Banner</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
