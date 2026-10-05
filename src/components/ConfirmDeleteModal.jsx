import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmDeleteModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Delete Item',
    message = 'Are you sure you want to delete this item? This action cannot be undone.',
    itemTitle = '',
    confirmText = 'Delete',
    cancelText = 'Cancel',
    loading = false
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-7 w-full max-w-md shadow-2xl text-slate-900 animate-scale-up relative">
                <button
                    onClick={onClose}
                    disabled={loading}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        {title}
                    </h3>

                    <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed">
                        {message}
                    </p>
                </div>

                <div className="flex gap-3 pt-6 mt-6 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="w-1/2 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="w-1/2 h-11 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                {confirmText}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
