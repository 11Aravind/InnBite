import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../../utils/apiService';
import DataTable from '../../components/DataTable';
import { ImageFileInput } from '../../components/ImageUploadCropModal';
import {
    Plus,
    Edit2,
    Trash2,
    Image as ImageIcon,
    X,
    Link as LinkIcon
} from 'lucide-react';

export default function AdminBanners() {
    const [banners, setBanners] = useState([]);
    const [dishes, setDishes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);

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

    const handleOpenModal = (banner = null) => {
        if (banner) {
            setEditingBanner(banner);
            setTitle(banner.title || '');
            setImageUrl(banner.image_url || banner.image || '');
            setDishId(banner.dish_id || '');
        } else {
            setEditingBanner(null);
            setTitle('');
            setImageUrl('');
            setDishId('');
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        await apiService.saveBanner({
            id: editingBanner?.id,
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

    const getLinkedDishName = (id) => {
        if (!id) return null;
        const dish = dishes.find(d => d.id === id);
        return dish ? dish.name : id;
    };

    // TanStack Table Column Definitions
    const columns = useMemo(() => [
        {
            accessorKey: 'title',
            header: 'Banner Preview & Title',
            cell: ({ row }) => {
                const b = row.original;
                return (
                    <div className="flex items-center gap-3.5">
                        <div className="w-20 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-2xs">
                            <img src={b.image_url || b.image} alt={b.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm">{b.title}</h4>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5 truncate max-w-xs">{b.image_url}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: 'dish_id',
            header: 'Linked Dish Target',
            cell: ({ row }) => {
                const b = row.original;
                return b.dish_id ? (
                    <span className="bg-amber-50 text-amber-800 px-3 py-1 rounded-lg border border-amber-200 font-bold text-xs inline-flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5 text-amber-600" />
                        {getLinkedDishName(b.dish_id)}
                    </span>
                ) : (
                    <span className="text-slate-400 italic">No linked dish</span>
                );
            }
        },
        {
            accessorKey: 'id',
            header: 'Banner ID',
            cell: ({ row }) => <span className="font-mono text-slate-500 text-xs">{row.original.id}</span>
        },
        {
            id: 'actions',
            header: 'Actions',
            meta: { align: 'right', headerAlign: 'right' },
            cell: ({ row }) => {
                const b = row.original;
                return (
                    <div className="flex items-center justify-end gap-1.5">
                        <button
                            onClick={() => handleOpenModal(b)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                            title="Edit Banner"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => handleDelete(b.id)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-colors"
                            title="Delete Banner"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            }
        }
    ], [dishes]);

    return (
        <div className="space-y-6 text-slate-900 font-sans">
            {/* Header Title Bar */}
            <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        Promotional Banners <ImageIcon className="w-5 h-5 text-rose-500" />
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">Manage promotional carousel banners powered by TanStack Table</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4.5 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Add New Banner</span>
                </button>
            </div>

            {/* TanStack Data Table Component */}
            <DataTable
                data={banners}
                columns={columns}
                loading={loading}
                searchPlaceholder="Search banners by title or dish..."
                defaultPageSize={5}
                emptyMessage="No banners found"
                emptyIcon={ImageIcon}
            />

            {/* Modal for Add / Edit Banner */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl text-slate-900">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">{editingBanner ? 'Edit Promo Banner' : 'Add Promo Banner'}</h2>
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
                                    className="w-full h-11 bg-slate-50 border border-slate-200 px-3.5 rounded-xl text-sm outline-none text-slate-900 focus:border-rose-500 font-medium"
                                />
                            </div>
                            <ImageFileInput
                                value={imageUrl}
                                onChange={(croppedImg) => setImageUrl(croppedImg)}
                                label="Upload Banner Image (File Upload & Crop) *"
                                aspect={16 / 9}
                            />
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Link to Dish (Optional)</label>
                                <select
                                    value={dishId}
                                    onChange={(e) => setDishId(e.target.value)}
                                    className="w-full h-11 bg-slate-50 border border-slate-200 px-3.5 rounded-xl text-sm outline-none text-slate-900 focus:border-rose-500 font-bold"
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
