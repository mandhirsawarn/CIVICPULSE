/**
 * Utility to safely compress images on the client side using HTML5 Canvas.
 * Prevents QuotaExceededError in localStorage by keeping Base64 strings small.
 */

export const compressImage = (file: File, maxWidth = 1280, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
      reject(new Error('Invalid file type. Only JPG, PNG, and WebP are allowed.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with specified quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => reject(new Error('Failed to load image.'));
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
};
