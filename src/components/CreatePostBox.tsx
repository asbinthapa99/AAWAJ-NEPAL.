'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthProvider';
import { compressImage } from '@/lib/image';
import { Avatar } from './ui/Avatar';
import {
    Image as ImageIcon,
    X,
    Loader2,
    Send,
    Megaphone,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CreatePostBoxProps {
    onPostCreated?: () => void;
    onRaiseIssue?: () => void;
}

export default function CreatePostBox({ onPostCreated, onRaiseIssue }: CreatePostBoxProps) {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!user) return null;

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
        if (!ALLOWED_TYPES.includes(file.type)) return;
        if (file.size > 8 * 1024 * 1024) return;

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
        setExpanded(true);
    };

    const removeImage = () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSubmit = async () => {
        if (!content.trim() && !imageFile) return;
        setLoading(true);

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
                setLoading(false);
                return;
            }

            if (data) {
                const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(data.path);
                image_url = urlData.publicUrl;
            }
        }

        const { error, data: post } = await supabase
            .from('posts')
            .insert({
                author_id: user.id,
                title: content.trim().slice(0, 100) || 'Post',
                content: content.trim(),
                category: 'other',
                urgency: 'low',
                district: profile?.district || null,
                image_url,
            })
            .select()
            .single();

        if (!error && post) {
            setContent('');
            removeImage();
            setExpanded(false);
            onPostCreated?.();
        }

        setLoading(false);
    };

    const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';

    return (
        <div className="bg-card rounded-xl shadow-sm border border-border p-4 mb-4">
            {/* Top row: avatar + input */}
            <div className="flex items-center gap-3">
                <Avatar
                    src={profile?.avatar_url || undefined}
                    fallback={displayName}
                    size="md"
                />
                <div
                    onClick={() => setExpanded(true)}
                    className={`flex-1 px-4 py-2.5 bg-muted rounded-full cursor-text text-sm ${expanded
                        ? 'hidden'
                        : 'text-muted-foreground hover:bg-accent transition-colors'
                        }`}
                >
                    What&apos;s on your mind, {displayName.split(' ')[0]}?
                </div>
            </div>

            {/* Expanded text area */}
            {expanded && (
                <div className="mt-3">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`What's on your mind, ${displayName.split(' ')[0]}?`}
                        rows={3}
                        autoFocus
                        className="w-full px-3 py-2 bg-transparent outline-none text-[15px] text-foreground placeholder:text-muted-foreground resize-none"
                    />

                    {/* Image preview */}
                    {imagePreview && (
                        <div className="relative mt-2 rounded-lg overflow-hidden border border-border">
                            <img src={imagePreview} alt="Preview" className="w-full max-h-[300px] object-cover" />
                            <button
                                onClick={removeImage}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Action bar */}
            <div className={`flex items-center justify-between mt-3 pt-3 border-t border-border`}>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-success hover:bg-success/10 transition-colors"
                    >
                        <ImageIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Photo</span>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                    />

                    <button
                        type="button"
                        onClick={onRaiseIssue}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                        <Megaphone className="w-5 h-5" />
                        <span className="hidden sm:inline">Raise Issue</span>
                    </button>
                </div>

                {expanded && (
                    <button
                        onClick={handleSubmit}
                        disabled={loading || (!content.trim() && !imageFile)}
                        className="flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        Post
                    </button>
                )}
            </div>
        </div>
    );
}
