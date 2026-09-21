import React, { useState, useEffect } from 'react';
import { apiService } from '../../utils/apiService';

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
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Food Categories</h1>
                    <p className="text-xs text-gray-500">Manage categories displayed on the customer home screen</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2.5 bg-black hover:bg-gray-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-sm"
                >
                    <span>📁 Add New Category</span>
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading categories...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat) => (
                        <div key={cat.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-12 h-12 bg-center bg-cover rounded-xl shrink-0"
                                    style={{ backgroundImage: `url("${cat.image_url || cat.image || '/placeholderfood.png'}")` }}
                                />
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm">{cat.name}</h3>
                                    <p className="text-xs text-gray-400">{cat.description || 'No description'}</p>
                                </div>
                            </div>

                            <div className="flex gap-1">
                                <button onClick={() => handleOpenModal(cat)} className="px-2.5 py-1 bg-gray-100 text-xs font-bold rounded-lg text-gray-700">Edit</button>
                                <button onClick={() => handleDelete(cat.id)} className="px-2.5 py-1 bg-red-50 text-xs font-bold rounded-lg text-red-600">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Category Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full h-11 bg-gray-50 border border-gray-200 px-3 rounded-xl text-sm outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Image URL</label>
                                <input
                                    type="url"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    className="w-full h-11 bg-gray-50 border border-gray-200 px-3 rounded-xl text-sm outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Description</label>
                                <textarea
                                    rows="2"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none"
                                />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="w-1/2 h-11 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm">Cancel</button>
                                <button type="submit" className="w-1/2 h-11 bg-black text-white font-bold rounded-xl text-sm">Save Category</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
