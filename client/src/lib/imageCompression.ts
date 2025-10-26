/**
 * Compress and resize an image file to optimize for upload
 * @param file - The image file to compress
 * @param maxWidth - Maximum width in pixels (default: 1200)
 * @param maxHeight - Maximum height in pixels (default: 1200)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 * @returns Promise<string> - Base64 encoded compressed image
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Use better image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with compression
        // Use JPEG for photos, PNG for images with transparency
        const mimeType = file.type === 'image/png' && hasTransparency(ctx, width, height)
          ? 'image/png'
          : 'image/jpeg';
        
        const base64 = canvas.toDataURL(mimeType, quality);
        resolve(base64);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Check if an image has transparency
 */
function hasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Check alpha channel (every 4th value)
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) {
        return true;
      }
    }
    return false;
  } catch {
    // If we can't check, assume no transparency
    return false;
  }
}

/**
 * Compress image for avatar/profile picture (smaller size)
 */
export async function compressAvatar(file: File): Promise<string> {
  return compressImage(file, 400, 400, 0.85);
}

/**
 * Compress image for chat messages
 */
export async function compressChatImage(file: File): Promise<string> {
  return compressImage(file, 1200, 1200, 0.8);
}

