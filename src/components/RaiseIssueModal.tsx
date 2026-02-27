'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthProvider';
import { categories, districts } from '@/lib/categories';
import { PostCategory, UrgencyLevel } from '@/lib/types';
import { URGENCY_CONFIG } from '@/lib/constants';
import { compressImage } from '@/lib/image';
import {
    Megaphone,
    Loader2,
    AlertTriangle,
    MapPin,
    Tag,
    Image as ImageIcon,
    X,
} from 'lucide-react';

interface RaiseIssueModalProps {
    onClose: () => void;
    onCreated?: () => void;
}

export default function RaiseIssueModal({ onClose, onCreated }: RaiseIssueModalProps) {
    const { user, profile } = useAuth();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<PostCategory>('other');
    const [urgency, setUrgency] = useState<UrgencyLevel>('medium');
    const [district, setDistrict] = useState(profile?.district || '');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!user) return null;

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
        if (!ALLOWED_TYPES.includes(file.type)) {
            setError('Only JPG, PNG, WebP, or HEIC images are allowed.');
            return;
        }
        if (file.size > 8 * 1024 * 1024) {
            setError('Image must be under 8MB.');
            return;
        }

        setError('');
        if (imagePreview) URL.revokeObjectURL(imagePreview);

        const compressed = await compressImage(file, {
            maxWidth: 1600,
            maxHeight: 1600,
            quality: 0.75,
            mimeType: 'image/jpeg',
            fileName: `post_${Date.now()}.jpg`,
        });

        setImageFile(compressed);
        setImagePreview(URL.createObjectURL(compressed));
    };

    const removeImage = () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            setError('Please fill in the title and description.');
            return;
        }

        setLoading(true);
        setError('');
        const supabase = createClient();

        // Ensure profile exists
        await supabase.from('profiles').upsert({
            id: user.id,
            username: user.user_metadata?.username || `user_${user.id.slice(0, 8)}`,
            email: user.email ?? '',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        }, { onConflict: 'id', ignoreDuplicates: true });

        let image_url: string | null = null;

        if (imageFile) {
            const fileName = `post_${user.id}_${Date.now()}.jpg`;
            const { data, error: uploadError } = await supabase.storage
                .from('post-images')
                .upload(fileName, imageFile, { contentType: imageFile.type, upsert: false });

            if (uploadError) {
                setError('Image upload failed: ' + uploadError.message);
                setLoading(false);
                return;
            }

            if (data) {
                const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(data.path);
                image_url = urlData.publicUrl;
            }
        }

        const { error: postError } = await supabase
            .from('posts')
            .insert({
                author_id: user.id,
                title: title.trim(),
                content: content.trim(),
                category,
                urgency,
                district: district || null,
                image_url,
            })
            .select()
            .single();

        if (postError) {
            setError(postError.message);
            setLoading(false);
        } else {
            onCreated?.();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white dark:bg-[#242526] rounded-xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-[#393a3b] my-8">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-[#393a3b]">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-[#e4e6eb] flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-red-500" />
                        Raise an Issue
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && (
                        <div className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Issue title (e.g., Road problem in Kathmandu)"
                        required
                        maxLength={150}
                        className="w-full px-4 py-2.5 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-lg text-sm outline-none text-gray-900 dark:text-[#e4e6eb] placeholder-gray-500 focus:ring-2 focus:ring-[#1877F2]/30"
                    />

                    {/* Category + Urgency */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-[#b0b3b8] mb-1 flex items-center gap-1">
                                <Tag className="w-3 h-3" /> Category
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as PostCategory)}
                                className="w-full px-3 py-2 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-lg text-sm outline-none text-gray-900 dark:text-[#e4e6eb] appearance-none"
                            >
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.icon} {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-[#b0b3b8] mb-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Urgency
                            </label>
                            <div className="flex gap-1">
                                {(Object.keys(URGENCY_CONFIG) as UrgencyLevel[]).map((level) => (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => setUrgency(level)}
                                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${urgency === level
                                                ? `${URGENCY_CONFIG[level].bgColor} ${URGENCY_CONFIG[level].color}`
                                                : 'bg-[#f0f2f5] dark:bg-[#3a3b3c] text-gray-400'
                                            }`}
                                    >
                                        {URGENCY_CONFIG[level].label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* District */}
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-[#b0b3b8] mb-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Location
                        </label>
                        <select
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            className="w-full px-3 py-2 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-lg text-sm outline-none text-gray-900 dark:text-[#e4e6eb] appearance-none"
                        >
                            <option value="">Select district (optional)</option>
                            {districts.map((d) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Describe the issue in detail..."
                        required
                        rows={4}
                        className="w-full px-4 py-2.5 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-lg text-sm outline-none text-gray-900 dark:text-[#e4e6eb] placeholder-gray-500 resize-none focus:ring-2 focus:ring-[#1877F2]/30"
                    />

                    {/* Image */}
                    {imagePreview ? (
                        <div className="relative rounded-lg overflow-hidden">
                            <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                            <button
                                type="button"
                                onClick={removeImage}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <label className="flex items-center justify-center gap-2 px-4 py-6 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-lg border border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-[#1877F2] transition-colors">
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-500 dark:text-[#b0b3b8]">Add photo evidence</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </label>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading || !title.trim() || !content.trim()}
                        className="w-full py-2.5 bg-[#1877F2] text-white rounded-lg font-semibold hover:bg-[#166FE5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Posting...
                            </>
                        ) : (
                            <>
                                <Megaphone className="w-4 h-4" />
                                Publish Issue
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
