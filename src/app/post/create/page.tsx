'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { categories } from '@/lib/categories';
import { districts } from '@/lib/categories';
import { PostCategory, UrgencyLevel } from '@/lib/types';
import { URGENCY_CONFIG } from '@/lib/constants';
import { compressImage } from '@/lib/image';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import PostingToast, { PostingStatus } from '@/components/PostingToast';
import {
  Megaphone,
  Loader2,
  AlertTriangle,
  MapPin,
  Tag,
  Image as ImageIcon,
  Video,
  X,
} from 'lucide-react';
import Link from 'next/link';

export default function CreatePostPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory>('other');
  const [urgency, setUrgency] = useState<UrgencyLevel>('medium');
  const [district, setDistrict] = useState(profile?.district || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [postingStatus, setPostingStatus] = useState<PostingStatus>('idle');
  const [postingError, setPostingError] = useState('');

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Megaphone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">
          Sign in to raise your voice
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          You need to be signed in to create a post.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB before compression
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPG, PNG, WebP, or HEIC images are allowed.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image must be under 8MB before compression.');
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

  const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/mov', 'video/quicktime'];

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      setError('Only MP4, WebM, or MOV videos are allowed.');
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      setError('Video must be under 100MB.');
      return;
    }

    setError('');
    // Remove image if video is picked (mutually exclusive)
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);

    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Please fill in the title and description.');
      return;
    }

    setLoading(true);
    setError('');
    setPostingError('');
    setPostingStatus('posting');

    const supabase = createClient();

    // Ensure profile exists (in case trigger didn't run at signup)
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      username: user.user_metadata?.username || `user_${user.id.slice(0, 8)}`,
      email: user.email ?? '',
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      district: user.user_metadata?.district || null,
    }, { onConflict: 'id', ignoreDuplicates: true });

    if (profileError) {
      console.error('Profile upsert failed:', profileError);
      setPostingStatus('error');
      setPostingError('Failed to verify profile: ' + profileError.message);
      setError('Failed to verify profile: ' + profileError.message);
      setLoading(false);
      return;
    }

    let image_url: string | null = null;
    let video_url: string | null = null;

    if (imageFile) {
      const fileName = `post_${user.id}_${Date.now()}.jpg`;
      const { data, error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, imageFile, {
          contentType: imageFile.type,
          upsert: false,
        });

      if (uploadError) {
        setPostingStatus('error');
        setPostingError('Image upload failed: ' + uploadError.message);
        setError('Image upload failed: ' + uploadError.message);
        setLoading(false);
        return;
      }

      if (data) {
        const { data: urlData } = supabase.storage
          .from('post-images')
          .getPublicUrl(data.path);
        image_url = urlData.publicUrl;
      }
    }

    if (videoFile) {
      const ext = videoFile.name.split('.').pop() || 'mp4';
      const fileName = `video_${user.id}_${Date.now()}.${ext}`;
      const { data, error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, videoFile, {
          contentType: videoFile.type,
          upsert: false,
        });

      if (uploadError) {
        setPostingStatus('error');
        setPostingError('Video upload failed: ' + uploadError.message);
        setError('Video upload failed: ' + uploadError.message);
        setLoading(false);
        return;
      }

      if (data) {
        const { data: urlData } = supabase.storage
          .from('post-images')
          .getPublicUrl(data.path);
        video_url = urlData.publicUrl;
      }
    }

    // Create post
    const postPayload = {
      author_id: user.id,
      title: title.trim(),
      content: content.trim(),
      category,
      urgency,
      district: district || null,
      image_url,
      video_url,
    };

    const { error: postError, data: post } = await supabase
      .from('posts')
      .insert(postPayload)
      .select()
      .single();

    if (postError) {
      console.error('Post creation failed:', postError);
      const msg = postError.message + (postError.details ? ' — ' + postError.details : '') + (postError.hint ? ' (Hint: ' + postError.hint + ')' : '');
      setPostingStatus('error');
      setPostingError(msg);
      setError(msg);
      setLoading(false);
    } else {
      setPostingStatus('success');
      setLoading(false);
      // Navigation happens after toast auto-dismisses (onDismiss callback)
    }
  };

  const inputClass = "w-full px-4 py-2.5 bg-muted border border-transparent focus:border-primary rounded-xl text-sm outline-none transition-colors text-foreground placeholder:text-muted-foreground";

  return (
    <div className="min-h-screen bg-background">
      {/* Posting / Posted toast */}
      <PostingToast
        status={postingStatus}
        errorMessage={postingError}
        onDismiss={() => router.push(`/dashboard`)}
      />      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-foreground">
            🗣️ Raise Your Voice
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tell Nepal about a problem that needs attention
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-2xl border border-border p-6 space-y-5"
        >
          {error && <Alert variant="error">{error}</Alert>}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Problem Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Road condition in Kathmandu is deteriorating"
              required
              maxLength={150}
              className={inputClass}
            />
            <p className="text-xs text-muted-foreground mt-1">{title.length}/150</p>
          </div>

          {/* Category & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <Tag className="w-3.5 h-3.5 inline mr-1" />
                Topic
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional)</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PostCategory)}
                className={inputClass + ' appearance-none'}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label} ({cat.labelNp})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                Urgency Level
              </label>
              <div className="flex gap-2">
                {(Object.keys(URGENCY_CONFIG) as UrgencyLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setUrgency(level)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${urgency === level
                        ? `${URGENCY_CONFIG[level].bgColor} ${URGENCY_CONFIG[level].color} ring-2 ring-current/20`
                        : 'bg-muted text-muted-foreground'
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
            <label className="block text-sm font-medium text-foreground mb-1.5">
              <MapPin className="w-3.5 h-3.5 inline mr-1" />
              Location (Optional)
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className={inputClass + ' appearance-none'}
            >
              <option value="">Select district</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Describe the Problem *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide details about the problem. What's happening? Where? How does it affect people? What should be done?"
              required
              rows={6}
              className={inputClass + ' resize-none'}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              📸 Attach Image (Optional)
            </label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className={`flex items-center justify-center gap-2 px-4 py-8 bg-muted rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors ${videoFile ? 'opacity-40 pointer-events-none' : ''}`}>
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {videoFile ? 'Remove video to attach an image' : 'Click to upload an image'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={!!videoFile}
                />
              </label>
            )}
          </div>

          {/* Video Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              🎬 Attach Video for Reels (Optional)
            </label>
            {videoPreview ? (
              <div className="relative rounded-xl overflow-hidden bg-black">
                <video
                  src={videoPreview}
                  controls
                  className="w-full max-h-64 object-contain"
                />
                <button
                  type="button"
                  onClick={removeVideo}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <span className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-purple-600/80 rounded-lg text-white text-xs font-semibold">
                  <Video className="w-3 h-3" /> Reel
                </span>
              </div>
            ) : (
              <label className={`flex items-center justify-center gap-2 px-4 py-8 bg-muted rounded-xl border-2 border-dashed border-purple-400/50 cursor-pointer hover:border-purple-500 transition-colors ${imageFile ? 'opacity-40 pointer-events-none' : ''}`}>
                <Video className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-muted-foreground">
                  {imageFile ? 'Remove image to attach a video' : 'Click to upload a video (MP4, WebM, MOV · max 100MB)'}
                </span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/mov,video/quicktime"
                  onChange={handleVideoChange}
                  className="hidden"
                  disabled={!!imageFile}
                />
              </label>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading || postingStatus === 'success' || !title.trim() || !content.trim()}
            loading={loading}
            size="lg"
            className="w-full"
          >
            <Megaphone className="w-5 h-5" />
            {postingStatus === 'posting' ? 'Publishing…' : postingStatus === 'success' ? '✅ Published!' : 'Publish Voice'}
          </Button>
        </form>
      </div>
    </div>
  );
}
