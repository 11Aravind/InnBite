import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../../utils/apiService';
import DataTable from '../../components/DataTable';
import { ImageFileInput } from '../../components/ImageUploadCropModal';
import {
    Plus,
    Edit2,
    Trash2,
    FolderKanban,
    X
} from 'lucide-react';

export default function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const loadData = async () => {
        setLoading(true);
        const data = await apiService.getCategories();
        setCategories(data || []);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleOpenModal = (cat = null) => {
        if (cat) {
            setEditingCategory(cat);
            setName(cat.name || '');
            setDescription(cat.description || '');
            setImageUrl(cat.image_url || cat.image || '');
        } else {
            setEditingCategory(null);
            setName('');
            setDescription('');
            setImageUrl('');
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        await apiService.saveCategory({
            id: editingCategory?.id,
            name,
            description,
            image_url: imageUrl || '/placeholderfood.png',
            image: imageUrl || '/placeholderfood.png'
        });
        setIsModalOpen(false);
        loadData();
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete category?')) {
            await apiService.deleteCategory(id);
            loadData();
        }
    };

    // TanStack Table Column Definitions
    const columns = useMemo(() => [
        {
            accessorKey: 'name',
            header: 'Category Details',
            cell: ({ row }) => {
                const cat = row.original;
                const img = cat.image_url || cat.image || '/placeholderfood.png';
                return (
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-2xs">
                            <img src={img} alt={cat.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm">{cat.name}</h4>
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: 'description',
            header: 'Description',
            cell: ({ row }) => {
                const desc = row.original.description;
                return (
                    <span className="text-slate-600 font-medium">
                        {desc || <span className="text-slate-400 italic">No description</span>}
                    </span>
                );
            }
        },
        {
            accessorKey: 'id',
            header: 'Category Code / ID',
            cell: ({ row }) => (
                <span className="font-mono text-slate-500 text-xs font-bold">{row.original.id}</span>
            )
        },
        {
            id: 'actions',
            header: 'Actions',
            meta: { align: 'right', headerAlign: 'right' },
            cell: ({ row }) => {
                const cat = row.original;
                return (
                    <div className="flex items-center justify-end gap-1.5">
                        <button
                            onClick={() => handleOpenModal(cat)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                            title="Edit Category"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => handleDelete(cat.id)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-colors"
                            title="Delete Category"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            }
        }
    ], []);

    return (
        <div className="space-y-6 text-slate-900 font-sans">
            {/* Header Title Bar */}
            <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        Food Categories <FolderKanban className="w-5 h-5 text-rose-500" />
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">Manage food menu categories powered by TanStack Table</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-6 py-3 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-rose-500/20 inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Add New Category</span>
                </button>
            </div>

            {/* TanStack Data Table Component */}
            <DataTable
                data={categories}
                columns={columns}
                loading={loading}
                searchPlaceholder="Search categories by name or description..."
                defaultPageSize={5}
                emptyMessage="No categories found"
                emptyIcon={FolderKanban}
            />

            {/* Modal for Add / Edit Category */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl text-slate-900">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Category Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full h-11 bg-slate-50 border border-slate-200 px-3.5 rounded-xl text-sm outline-none text-slate-900 focus:border-rose-500 font-medium"
                                />
                            </div>
                            <ImageFileInput
                                value={imageUrl}
                                onChange={(croppedImg) => setImageUrl(croppedImg)}
                                label="Upload Category Image (File Upload & Crop)"
                                aspect={1 / 1}
                            />
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                                <textarea
                                    rows="2"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm outline-none text-slate-900 focus:border-rose-500"
                                />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="w-1/2 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm">Cancel</button>
                                <button type="submit" className="w-1/2 h-11 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-rose-500/20">Save Category</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
