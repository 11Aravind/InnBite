import React, { useState, useEffect } from 'react';
import { apiService } from '../../utils/apiService';
import { Plus, Trash2, Image as ImageIcon, X, Link as LinkIcon } from 'lucide-react';

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
        <div className="space-y-6 text-slate-900">
            <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        Promotional Banners <ImageIcon className="w-5 h-5 text-rose-500" />
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">Manage top carousel banner cards on the customer home screen</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add New Banner</span>
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-400">Loading banners...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {banners.map((b) => (
                        <div key={b.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                            <div
                                className="w-full h-44 bg-center bg-cover rounded-xl mb-3 border border-slate-100"
                                style={{ backgroundImage: `url("${b.image_url}")` }}
                            />
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">{b.title}</h3>
                                    {b.dish_id && (
                                        <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1 mt-0.5">
                                            <LinkIcon className="w-3 h-3" /> Linked Dish: {b.dish_id}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(b.id)}
                                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl text-slate-900">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">Add Promo Banner</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Banner Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full h-11 bg-slate-50 border border-slate-200 px-3.5 rounded-xl text-sm outline-none text-slate-900 focus:border-rose-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Banner Image URL *</label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://..."
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    className="w-full h-11 bg-slate-50 border border-slate-200 px-3.5 rounded-xl text-sm outline-none text-slate-900 focus:border-rose-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Link to Dish (Optional)</label>
                                <select
                                    value={dishId}
                                    onChange={(e) => setDishId(e.target.value)}
                                    className="w-full h-11 bg-slate-50 border border-slate-200 px-3.5 rounded-xl text-sm outline-none text-slate-900 focus:border-rose-500"
                                >
                                    <option value="">-- No link --</option>
                                    {dishes.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="w-1/2 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm">Cancel</button>
                                <button type="submit" className="w-1/2 h-11 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-rose-500/20">Save Banner</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
