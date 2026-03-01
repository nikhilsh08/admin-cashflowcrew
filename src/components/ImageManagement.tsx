import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UploadDropzone } from '../lib/uploadthing';
import { Copy, Trash2, Images, Loader2 } from 'lucide-react';
import { toast } from 'sonner';



interface ImageRecord {
    _id?: string;
    id?: string;
    url: string;
    key?: string;
    name?: string;
    createdAt?: string;
}

const ImageManagement: React.FC = () => {
    const [images, setImages] = useState<ImageRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState("")

    const fetchImages = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/admin/images`, {
                withCredentials: true
            });
            // Handle different possible response shapes
            setToken(res.data.token);
            const fetchedImages = res.data.images || res.data.data || res.data || [];
            if (Array.isArray(fetchedImages)) {
                setImages(fetchedImages);
            } else {
                setImages([]);
            }
        } catch (error: any) {
            console.error(error);
            toast.error('Failed to fetch images list. Ensure backend /api/admin/images is working.');
        } finally {
            console.log("images:", images);
            setLoading(false);
        }
    };

    useEffect(() => {

        fetchImages();
    }, []);

    const handleDelete = async (image: ImageRecord) => {
        const idToDelete = image._id || image.id || image.key;
        if (!idToDelete) {
            toast.error('Cannot delete: No ID or Key found for image');
            return;
        }

        try {
            if (!confirm('Are you sure you want to delete this image?')) return;

            await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/admin/images?id=${idToDelete}`, {
                withCredentials: true
            });

            toast.success('Image deleted successfully');
            fetchImages();
        } catch (error: any) {
            console.error(error);
            toast.error('Failed to delete image. Ensure backend DELETE endpoint works.');
        }
    };

    const handleCopyUrl = (url: string) => {
        if (!url) return;
        navigator.clipboard.writeText(url);
        toast.success('Image URL copied to clipboard');
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Image Management</h1>
                <p className="text-gray-500">Upload and manage your content images here. Uses UploadThing for storage.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <h2 className="text-lg font-semibold mb-6">Upload New Image</h2>
                <div className="border border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center p-4">
                    <UploadDropzone
                        endpoint="imageUploader"
                        headers={{
                            Authorization: `Bearer ${token}`
                        }}
                        onClientUploadComplete={(res) => {
                            if (res && res.length > 0) {
                                setLoading(false);
                                toast.success(`${res.length} image(s) uploaded successfully!`);
                            }
                            // Wait a tiny bit for backend DB to sync if it's not synchronous
                            setTimeout(() => {
                                fetchImages();
                            }, 1000);
                        }}
                        onUploadError={(error: Error) => {
                            toast.error(`Upload Failed: ${error.message}`);
                        }}
                        config={{ mode: "auto" }}
                    />


                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Images className="w-5 h-5 text-indigo-600" />
                        Uploaded Images
                    </h2>
                    <button
                        onClick={fetchImages}
                        className="text-sm px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors font-medium"
                    >
                        Refresh List
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                        <p className="text-gray-500">Loading your images...</p>
                    </div>
                ) : images.length === 0 ? (
                    <div className="text-center py-16 px-4">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Images className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-900 font-medium mb-1">No images found</p>
                        <p className="text-gray-500 text-sm">Upload some images using the dropzone above!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 shadow-inner border border-gray-50 bg-gray-50 p-6 rounded-xl md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {images.map((image, index) => (
                            <div
                                key={image._id || image.id || image.key || index}
                                className="group relative rounded-xl border border-gray-200 overflow-hidden bg-white aspect-square shadow-sm hover:shadow-md transition-shadow flex items-center justify-center"
                            >
                                <img
                                    src={image.url}
                                    alt={image.name || 'Uploaded content'}
                                    className="object-cover w-full h-full"
                                    loading="lazy"
                                />

                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center backdrop-blur-[1px]">
                                    <div className="flex items-center justify-center gap-3">
                                        <button
                                            onClick={() => handleCopyUrl(image.url)}
                                            className="p-3 bg-white/90 hover:bg-white rounded-full transition-transform hover:scale-105 text-gray-800 shadow-sm"
                                            title="Copy URL"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(image)}
                                            className="p-3 bg-red-500/90 hover:bg-red-500 rounded-full transition-transform hover:scale-105 text-white shadow-sm"
                                            title="Delete Image"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-2 left-2 right-2 flex justify-center text-xs text-white/90 truncate px-2 font-medium">
                                        {image.name || 'Image File'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageManagement;
