import React, { useState, useEffect } from 'react';
import { apiService } from '../../utils/apiService';
import { Plus, Edit2, Trash2, FolderKanban, X } from 'lucide-react';

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

    return (
        <div className="space-y-6 text-slate-100">
            <div className="flex flex-wrap justify-between items-center gap-4 pb-2 border-b border-slate-800">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        Food Categories <FolderKanban className="w-5 h-5 text-rose-500" />
                    </h1>
                    <p className="text-xs text-slate-400">Manage categories displayed on the customer home screen</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add New Category</span>
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-500">Loading categories...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat) => (
                        <div key={cat.id} className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
                            <div className="flex items-center gap-3.5">
                                <div
                                    className="w-12 h-12 bg-center bg-cover rounded-xl shrink-0 ring-1 ring-white/10"
                                    style={{ backgroundImage: `url("${cat.image_url || cat.image || '/placeholderfood.png'}")` }}
                                />
                                <div>
                                    <h3 className="font-bold text-white text-sm">{cat.name}</h3>
                                    <p className="text-xs text-slate-400">{cat.description || 'No description'}</p>
                                </div>
                            </div>

                            <div className="flex gap-1.5">
                                <button onClick={() => handleOpenModal(cat)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(cat.id)} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/20 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl text-slate-100">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
                            <h2 className="text-lg font-bold text-white">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1">Category Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full h-11 bg-slate-800/80 border border-slate-700 px-3.5 rounded-xl text-sm outline-none text-white focus:border-rose-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1">Image URL</label>
                                <input
                                    type="url"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    className="w-full h-11 bg-slate-800/80 border border-slate-700 px-3.5 rounded-xl text-sm outline-none text-white focus:border-rose-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1">Description</label>
                                <textarea
                                    rows="2"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-slate-800/80 border border-slate-700 p-3 rounded-xl text-sm outline-none text-white focus:border-rose-500"
                                />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="w-1/2 h-11 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm">Cancel</button>
                                <button type="submit" className="w-1/2 h-11 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-rose-500/20">Save Category</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
