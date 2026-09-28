import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, Crop, Upload, Check, Link as LinkIcon, Image as ImageIcon, Trash2 } from 'lucide-react';
import { getCroppedImg } from '../utils/cropImage';

export default function ImageUploadCropModal({
    isOpen,
    onClose,
    imageSrc,
    aspect = 1,
    title = "Crop Image",
    onCropSave
}) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        try {
            setIsSaving(true);
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropSave(croppedImage);
            onClose();
        } catch (err) {
            console.error('Error cropping image:', err);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !imageSrc) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col text-slate-900 max-h-[90vh]">
                {/* Modal Header */}
                <div className="p-4 px-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                        <Crop className="w-5 h-5 text-[#114536]" /> {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Cropper Viewport Container */}
                <div className="relative w-full h-80 bg-slate-950">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={setCrop}
                        onCropComplete={handleCropComplete}
                        onZoomChange={setZoom}
                        showGrid={true}
                    />
                </div>

                {/* Controls & Zoom Slider */}
                <div className="p-5 space-y-4 bg-white">
                    <div className="flex items-center gap-3">
                        <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-600">Zoom:</span>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.05}
                            aria-label="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#114536]"
                        />
                        <span className="text-xs font-mono font-bold text-slate-500 w-10 text-right">
                            {zoom.toFixed(1)}x
                        </span>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-1/2 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={isSaving}
                            onClick={handleSave}
                            className="w-1/2 h-11 bg-[#114536] hover:bg-[#0d372b] text-white font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-[#114536]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>{isSaving ? 'Processing...' : 'Apply Cropped Image'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Reusable File Upload & URL Picker with Aspect-Ratio Crop Trigger
 */
export function ImageFileInput({
    value,
    onChange,
    label = "Upload Image File *",
    aspect = 1,
    allowUrl = false
}) {
    const [mode, setMode] = useState('file'); // 'file' | 'url'
    const [rawImage, setRawImage] = useState(null);
    const [isCropOpen, setIsCropOpen] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setRawImage(reader.result);
                setIsCropOpen(true);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const activeMode = allowUrl ? mode : 'file';

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">{label}</label>
                {allowUrl && (
                    <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                        <button
                            type="button"
                            onClick={() => setMode('file')}
                            className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${mode === 'file' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <Upload className="w-3 h-3" /> File Upload
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('url')}
                            className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${mode === 'url' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <LinkIcon className="w-3 h-3" /> Image URL
                        </button>
                    </div>
                )}
            </div>

            {activeMode === 'file' ? (
                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                    {/* File Select Dropzone Box */}
                    <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-[#114536] bg-slate-50 hover:bg-emerald-50/20 rounded-2xl p-3 cursor-pointer transition-colors text-center group min-h-[90px]">
                        <Upload className="w-5 h-5 text-slate-400 group-hover:text-[#114536] mb-1 transition-colors" />
                        <span className="text-xs font-bold text-slate-700 group-hover:text-[#114536]">Choose File to Crop</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WEBP supported</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </label>

                    {/* Image Preview Card with Re-crop Trigger */}
                    {value && (
                        <div className="relative w-full sm:w-28 h-24 sm:h-auto rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 group">
                            <img src={value} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                                <label className="p-1.5 bg-white text-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors shadow-sm" title="Change file">
                                    <Upload className="w-3.5 h-3.5" />
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                </label>
                                {rawImage && (
                                    <button
                                        type="button"
                                        onClick={() => setIsCropOpen(true)}
                                        className="p-1.5 bg-[#114536] text-white rounded-lg hover:bg-[#0d372b] transition-colors shadow-sm"
                                        title="Re-crop image"
                                    >
                                        <Crop className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => onChange('')}
                                    className="p-1.5 bg-slate-800 text-slate-200 rounded-lg hover:bg-black transition-colors shadow-sm"
                                    title="Remove image"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 px-3.5 rounded-xl text-xs outline-none text-slate-900 focus:border-[#114536] font-medium"
                    />
                    {value && (
                        <div className="w-full h-24 rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
                            <img src={value} alt="URL Preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>
            )}

            {/* Crop Modal */}
            <ImageUploadCropModal
                isOpen={isCropOpen}
                onClose={() => setIsCropOpen(false)}
                imageSrc={rawImage}
                aspect={aspect}
                onCropSave={(croppedImg) => onChange(croppedImg)}
            />
        </div>
    );
}
