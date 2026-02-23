export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/webp';
  fileName?: string;
}

export async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.75,
    mimeType = 'image/jpeg',
    fileName = file.name.replace(/\.[^.]+$/, '') + '.jpg',
  } = options;

  const imageBitmap = await createImageBitmap(file);
  const scale = Math.min(maxWidth / imageBitmap.width, maxHeight / imageBitmap.height, 1);
  const targetWidth = Math.round(imageBitmap.width * scale);
  const targetHeight = Math.round(imageBitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

  const blob: Blob | null = await new Promise((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });

  if (!blob) return file;
  return new File([blob], fileName, { type: mimeType });
}
