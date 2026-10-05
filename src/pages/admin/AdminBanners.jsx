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
    Image as ImageIcon,
    X,
    Link as LinkIcon,
    RefreshCw
} from 'lucide-react';

export default function AdminBanners() {
    const [banners, setBanners] = useState([]);
    const [dishes, setDishes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
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

        if (!imageUrl) {
            toast.error('Please upload a banner image');
            return;
        }

        setIsSaving(true);
        try {
            await apiService.saveBanner({
                id: editingBanner?.id,
                title,
                image_url: imageUrl,
                dish_id: dishId || null
            });
            toast.success(`Banner "${title}" saved successfully!`);
            setIsModalOpen(false);
            setTitle('');
            setImageUrl('');
            setDishId('');
            loadData();
        } catch (err) {
            console.error('Save banner error:', err);
            toast.error(err.message || 'Failed to save banner.');
        } finally {
            setIsSaving(false);
        }
    };

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [bannerToDelete, setBannerToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (banner) => {
        setBannerToDelete(banner);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!bannerToDelete) return;
        setIsDeleting(true);
        try {
            await apiService.deleteBanner(bannerToDelete.id);
            toast.success(`Banner "${bannerToDelete.title}" deleted successfully!`);
            setDeleteModalOpen(false);
            setBannerToDelete(null);
            loadData();
        } catch (err) {
            console.error('Delete banner error:', err);
            toast.error('Failed to delete banner. Please try again.');
        } finally {
            setIsDeleting(false);
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
            header: 'Link Target / Dish',
            cell: ({ row }) => {
                const b = row.original;
                const targetName = getLinkedDishName(b.dish_id);
                return b.dish_id ? (
                    <span className="bg-amber-50 text-amber-800 px-3 py-1 rounded-lg border border-amber-200 font-bold text-xs inline-flex items-center gap-1.5 truncate max-w-[200px]" title={b.dish_id}>
                        <LinkIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{targetName}</span>
                    </span>
                ) : (
                    <span className="text-slate-400 italic">No link</span>
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
                            onClick={() => handleDeleteClick(b)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-colors cursor-pointer"
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
                        Promotional Banners <ImageIcon className="w-5 h-5 text-themePrimary" />
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">Manage promotional carousel banners powered by TanStack Table</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-6 py-3 btn-primary text-xs shrink-0 cursor-pointer"
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
                                <label className="text-xs font-bold text-slate-700 block mb-1">
                                    Banner Title <span className="text-rose-500 font-bold ml-0.5">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full h-11 bg-slate-50 border border-slate-200 px-3.5 rounded-xl text-sm outline-none text-slate-900 focus:border-themePrimary font-medium"
                                />
                            </div>
                            <ImageFileInput
                                value={imageUrl}
                                onChange={(croppedImg) => setImageUrl(croppedImg)}
                                label="Upload Banner Image (File Upload & Crop)"
                                aspect={16 / 9}
                                dimensions="1200 x 675 px (16:9 Widescreen)"
                                required={true}
                            />
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Link URL (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="https://example.com/some-page"
                                    value={dishId}
                                    onChange={(e) => setDishId(e.target.value)}
                                    className="w-full h-11 bg-slate-50 border border-slate-200 px-3.5 rounded-xl text-sm outline-none text-slate-900 focus:border-themePrimary font-medium"
                                />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="w-1/2 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-1/2 h-11 btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                                >
                                    {isSaving ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Saving Banner...</span>
                                        </>
                                    ) : (
                                        <span>Save Banner</span>
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
                    setBannerToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                title="Delete Promo Banner"
                message="Are you sure you want to delete this promotional banner?"
                itemTitle={bannerToDelete?.title}
                loading={isDeleting}
            />
        </div>
    );
}
