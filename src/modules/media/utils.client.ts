/**
 * Client-side utilities for media handling
 */

const MAX_FILE_SIZE_MB = 10; // Maximum file size before warning
const RECOMMENDED_MAX_DIMENSION = 4096; // Recommended max dimension

/**
 * Validate file before upload
 * Provides warnings for large files (they will be compressed server-side)
 */
export function validateImageFile(file: File): { valid: boolean; warning?: string; error?: string } {
  // Check if it's an image
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' };
  }

  // File size check (just a warning, server will compress)
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > MAX_FILE_SIZE_MB) {
    return {
      valid: true,
      warning: `Large file detected (${fileSizeMB.toFixed(1)}MB). The image will be automatically compressed to optimize storage and loading times.`
    };
  }

  return { valid: true };
}

/**
 * Get image dimensions from file
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    
    img.src = url;
  });
}

/**
 * Display file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if image dimensions are very large
 */
export async function checkImageDimensions(file: File): Promise<{ valid: boolean; warning?: string }> {
  const dimensions = await getImageDimensions(file);
  
  if (!dimensions) {
    return { valid: true };
  }
  
  const { width, height } = dimensions;
  
  if (width > RECOMMENDED_MAX_DIMENSION || height > RECOMMENDED_MAX_DIMENSION) {
    return {
      valid: true,
      warning: `Very large image (${width}×${height}px). It will be automatically resized to 1000×1000px maximum while maintaining aspect ratio.`
    };
  }
  
  return { valid: true };
}
