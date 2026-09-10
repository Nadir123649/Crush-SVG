"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { apiFetch } from "@/lib/client/http";
import { showToast } from "@/lib/client/toast-bridge";

interface CoverImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    onDirty?: () => void;
}

interface PixelArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

async function getCroppedImg(imageSrc: string, pixelCrop: PixelArea): Promise<File> {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = imageSrc;
    });

    const canvas = document.createElement("canvas");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) return reject(new Error("Canvas toBlob failed"));
                resolve(new File([blob], "cover.png", { type: "image/png" }));
            },
            "image/png",
            1
        );
    });
}

export function CoverImageUpload({ value, onChange, onDirty }: CoverImageUploadProps) {
    const [rawImage, setRawImage] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelArea | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [uploading, setUploading] = useState(false);

    const onCropComplete = useCallback((_croppedArea: any, croppedPixels: PixelArea) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showToast("error", "Image must be less than 5MB", { id: "cover-image" });
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setRawImage(reader.result as string);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setIsCropping(true);
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    }, []);

    const handleCropUpload = useCallback(async () => {
        if (!rawImage || !croppedAreaPixels) return;
        setUploading(true);
        try {
            const croppedFile = await getCroppedImg(rawImage, croppedAreaPixels);
            const formData = new FormData();
            formData.append("file", croppedFile);
            const result = await apiFetch<{ url: string }>("/api/v1/upload/image", {
                method: "POST",
                body: formData,
            });
            if (result?.url) {
                onChange(result.url);
                onDirty?.();
            } else {
                showToast("error", "Failed to upload image", { id: "cover-image" });
            }
        } catch (err: any) {
            showToast("error", err?.message || "Failed to upload cropped image", { id: "cover-image" });
        } finally {
            setUploading(false);
            setIsCropping(false);
            setRawImage(null);
        }
    }, [rawImage, croppedAreaPixels, onChange, onDirty]);

    const handleCancelCrop = useCallback(() => {
        setIsCropping(false);
        setRawImage(null);
    }, []);

    return (
        <>
            <div>
                <label className="block font-body text-sm font-medium text-text-dark mb-2">Cover Image</label>
                <div className="border-2 border-dashed border-[#F2EDE8] rounded-[8px] p-6 text-center hover:border-brand-primary transition-colors">
                    {value ? (
                        <div className="relative max-w-full mx-auto">
                            <img
                                src={value}
                                alt="Cover preview"
                                className="max-h-48 rounded-[6px] object-contain"
                                referrerPolicy="no-referrer"
                            />
                            <button
                                type="button"
                                onClick={() => onChange("")}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                title="Remove cover image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                            </button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center gap-2 text-text-muted cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                            <span className="font-body text-sm">Drop cover image or click to upload</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </label>
                    )}
                </div>
                <p className="mt-1 font-body text-xs text-text-muted">16:9 aspect ratio recommended. Max 5MB.</p>
            </div>

            {/* Cropping Modal */}
            {isCropping && rawImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[16px] shadow-2xl w-[90vw] max-w-[600px] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#F2EDE8]">
                            <h3 className="font-heading font-semibold text-lg text-text-dark">Crop Cover Image</h3>
                            <p className="font-body text-sm text-text-muted mt-1">Adjust the crop area to fit 16:9</p>
                        </div>

                        <div className="relative w-full aspect-video bg-gray-900">
                            <Cropper
                                image={rawImage}
                                crop={crop}
                                zoom={zoom}
                                aspect={16 / 9}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                                cropShape="rect"
                                showGrid={false}
                            />
                        </div>

                        <div className="px-6 py-4 border-t border-[#F2EDE8] flex items-center gap-4">
                            <label className="flex items-center gap-2 flex-1">
                                <span className="font-body text-sm text-text-muted shrink-0">Zoom</span>
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="flex-1 accent-[#D94A1E]"
                                />
                            </label>
                        </div>

                        <div className="px-6 py-4 border-t border-[#F2EDE8] flex items-center justify-end gap-3 bg-gray-50">
                            <button
                                type="button"
                                onClick={handleCancelCrop}
                                disabled={uploading}
                                className="px-4 py-2 font-body text-sm font-medium text-text-muted hover:text-text-dark border border-gray-200 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleCropUpload}
                                disabled={uploading}
                                className="px-5 py-2 bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-body text-sm font-medium rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                        Uploading...
                                    </>
                                ) : (
                                    "Crop & Upload"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
