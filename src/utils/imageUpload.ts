/**
 * Reads an uploaded image File and resizes it to a maximum dimension (default: 600px),
 * returning a clean, compressed base64 JPEG data URL suitable for local storage,
 * database persistence, and untainted html2canvas exports.
 */
export function fileToResizedDataUrl(file: File, maxSize: number = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select an image file (PNG, JPG, or WEBP).'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read image file data.'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };

      img.onerror = () => resolve(result);
      img.src = result;
    };

    reader.onerror = () => reject(new Error('File reader encountered an error.'));
    reader.readAsDataURL(file);
  });
}
