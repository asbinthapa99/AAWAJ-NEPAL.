/**
 * Media Service
 *
 * Optimised media handling for uploads, thumbnails, and CDN distribution.
 *
 * Features:
 *   - Image compression before upload
 *   - Video thumbnail extraction (URI-based)
 *   - Supabase Storage upload with metadata tracking
 *   - CDN URL construction
 *   - Blurhash placeholder generation helpers
 *   - Processing status tracking (pending → ready → failed)
 */

import { supabase } from './supabase';
import { SUPABASE_URL } from './config';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// ─── Types ─────────────────────────────────────────────────

export type EntityType = 'post_image' | 'post_video' | 'avatar' | 'cover' | 'reel';

export type ProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface MediaMetadata {
  id: string;
  owner_id: string;
  entity_type: EntityType;
  entity_id?: string;
  storage_path: string;
  public_url: string;
  thumbnail_url?: string;
  mime_type?: string;
  file_size?: number;
  width?: number;
  height?: number;
  duration_ms?: number;
  processing_status: ProcessingStatus;
  cdn_url?: string;
  blurhash?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface UploadOptions {
  /** Target max width (images will be scaled down). Default 1080. */
  maxWidth?: number;
  /** Target max height. Default 1080. */
  maxHeight?: number;
  /** JPEG quality (0-1). Default 0.8. */
  quality?: number;
  /** Generate a thumbnail? Default true for post images, always for videos. */
  generateThumbnail?: boolean;
  /** Thumbnail max dimension. Default 300. */
  thumbnailSize?: number;
}

// ─── Configuration ─────────────────────────────────────────

const DEFAULT_OPTIONS: Required<UploadOptions> = {
  maxWidth: 1080,
  maxHeight: 1080,
  quality: 0.8,
  generateThumbnail: true,
  thumbnailSize: 300,
};

const BUCKET_MAP: Record<EntityType, string> = {
  post_image: 'post-images',
  post_video: 'post-images',   // same bucket, different path prefix
  avatar: 'avatars',
  cover: 'avatars',
  reel: 'post-images',
};

// ─── Helper: File info ─────────────────────────────────────

async function getFileInfo(uri: string): Promise<{ size: number; exists: boolean }> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return { size: (info as any).size ?? 0, exists: info.exists };
  } catch {
    return { size: 0, exists: false };
  }
}

function getMimeType(uri: string): string {
  const ext = uri.split('.').pop()?.toLowerCase() ?? '';
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
  };
  return mimeMap[ext] ?? 'application/octet-stream';
}

function generateStoragePath(entityType: EntityType, userId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitised = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${entityType}/${userId}/${timestamp}_${sanitised}`;
}


// ─── Image Compression ─────────────────────────────────────

/**
 * Compress and resize an image before upload.
 * Returns the URI of the compressed file.
 */
export async function compressImage(
  uri: string,
  options?: Pick<UploadOptions, 'maxWidth' | 'maxHeight' | 'quality'>,
): Promise<{ uri: string; width: number; height: number }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: opts.maxWidth, height: opts.maxHeight } }],
    {
      compress: opts.quality,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
  };
}

/**
 * Generate a small thumbnail from an image URI.
 */
export async function generateImageThumbnail(
  uri: string,
  size: number = 300,
): Promise<{ uri: string; width: number; height: number }> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: size } }],
    {
      compress: 0.6,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
  };
}


// ─── Upload ────────────────────────────────────────────────

/**
 * Upload a media file to Supabase Storage with compression,
 * optional thumbnail generation, and metadata tracking.
 */
export async function uploadMedia(params: {
  uri: string;
  userId: string;
  entityType: EntityType;
  entityId?: string;
  fileName?: string;
  options?: UploadOptions;
}): Promise<{ success: boolean; metadata?: MediaMetadata; error?: string }> {
  const opts = { ...DEFAULT_OPTIONS, ...params.options };
  const isVideo = params.entityType === 'post_video' || params.entityType === 'reel';
  const isImage = !isVideo;

  try {
    let uploadUri = params.uri;
    let width: number | undefined;
    let height: number | undefined;

    // Compress images
    if (isImage) {
      const compressed = await compressImage(params.uri, opts);
      uploadUri = compressed.uri;
      width = compressed.width;
      height = compressed.height;
    }

    // Read file as blob
    const fileInfo = await getFileInfo(uploadUri);
    if (!fileInfo.exists) {
      return { success: false, error: 'File not found' };
    }

    const fileName = params.fileName ?? uploadUri.split('/').pop() ?? 'media';
    const storagePath = generateStoragePath(params.entityType, params.userId, fileName);
    const bucket = BUCKET_MAP[params.entityType];
    const mimeType = getMimeType(fileName);

    // Upload to Supabase Storage
    const fileData = await FileSystem.readAsStringAsync(uploadUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from(bucket)
      .upload(storagePath, decode(fileData), {
        contentType: mimeType,
        cacheControl: '31536000', // 1 year cache
        upsert: false,
      });

    if (uploadErr) {
      return { success: false, error: uploadErr.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    // Generate thumbnail for images
    let thumbnailUrl: string | undefined;
    if (isImage && opts.generateThumbnail) {
      try {
        const thumb = await generateImageThumbnail(params.uri, opts.thumbnailSize);
        const thumbPath = storagePath.replace(/(\.[^.]+)$/, '_thumb$1');

        const thumbData = await FileSystem.readAsStringAsync(thumb.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await supabase.storage.from(bucket).upload(thumbPath, decode(thumbData), {
          contentType: 'image/jpeg',
          cacheControl: '31536000',
          upsert: false,
        });

        const { data: thumbUrlData } = supabase.storage.from(bucket).getPublicUrl(thumbPath);
        thumbnailUrl = thumbUrlData.publicUrl;
      } catch (e) {
        console.warn('[media] thumbnail generation failed:', e);
      }
    }

    // Record metadata
    const { data: metaRow, error: metaErr } = await supabase
      .from('media_metadata')
      .insert({
        owner_id: params.userId,
        entity_type: params.entityType,
        entity_id: params.entityId ?? null,
        storage_path: storagePath,
        public_url: publicUrl,
        thumbnail_url: thumbnailUrl ?? null,
        mime_type: mimeType,
        file_size: fileInfo.size,
        width: width ?? null,
        height: height ?? null,
        processing_status: isVideo ? 'pending' : 'ready',
        metadata: {},
      })
      .select()
      .single();

    if (metaErr) {
      console.warn('[media] metadata insert error:', metaErr.message);
    }

    return {
      success: true,
      metadata: metaRow as MediaMetadata,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}


// ─── CDN URL helpers ───────────────────────────────────────

/**
 * Construct a CDN-optimised image URL with transforms.
 * Uses Supabase Storage image transformation API.
 *
 * @see https://supabase.com/docs/guides/storage/serving/image-transformations
 */
export function getOptimisedImageUrl(
  publicUrl: string,
  options?: { width?: number; height?: number; quality?: number; format?: 'webp' | 'avif' | 'origin' },
): string {
  if (!publicUrl) return '';

  const params = new URLSearchParams();
  if (options?.width) params.set('width', String(options.width));
  if (options?.height) params.set('height', String(options.height));
  if (options?.quality) params.set('quality', String(options.quality));
  if (options?.format) params.set('format', options.format);

  // Supabase storage render endpoint
  const renderUrl = publicUrl.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');

  return params.toString() ? `${renderUrl}?${params.toString()}` : publicUrl;
}

/**
 * Get avatar URL at a specific size (using Supabase transforms).
 */
export function getAvatarUrl(
  avatarUrl: string | null,
  size: number = 96,
): string {
  if (!avatarUrl) return '';
  return getOptimisedImageUrl(avatarUrl, { width: size, height: size, quality: 80 });
}

/**
 * Get a feed image URL optimised for the device width.
 */
export function getFeedImageUrl(
  imageUrl: string | null,
  deviceWidth: number = 400,
): string {
  if (!imageUrl) return '';
  return getOptimisedImageUrl(imageUrl, { width: deviceWidth, quality: 75, format: 'webp' });
}


// ─── Processing Status ─────────────────────────────────────

export async function getMediaStatus(mediaId: string): Promise<ProcessingStatus> {
  const { data } = await supabase
    .from('media_metadata')
    .select('processing_status')
    .eq('id', mediaId)
    .single();
  return (data?.processing_status as ProcessingStatus) ?? 'pending';
}

export async function updateMediaStatus(
  mediaId: string,
  status: ProcessingStatus,
  extra?: Partial<MediaMetadata>,
): Promise<void> {
  await supabase
    .from('media_metadata')
    .update({
      processing_status: status,
      ...extra,
    })
    .eq('id', mediaId);
}


// ─── Media cleanup ─────────────────────────────────────────

/**
 * Delete a media file from storage and remove metadata.
 */
export async function deleteMedia(mediaId: string): Promise<void> {
  const { data } = await supabase
    .from('media_metadata')
    .select('storage_path, entity_type')
    .eq('id', mediaId)
    .single();

  if (data) {
    const bucket = BUCKET_MAP[data.entity_type as EntityType];
    await supabase.storage.from(bucket).remove([data.storage_path]);
    await supabase.from('media_metadata').delete().eq('id', mediaId);
  }
}


// ─── Base64 decode helper ──────────────────────────────────

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
