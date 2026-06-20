/**
 * Generates an object URL for local preview.
 * Remeber to call URL.revokeObjectURL() when the image is no longer needed.
 */
export const generateLocalPreview = (file) => {
  if (!file) return null;
  try {
    return URL.createObjectURL(file);
  } catch (error) {
    console.error("Failed to generate local preview:", error);
    return null;
  }
};

/**
 * Reads the natural width and height of an image file.
 * Returns a Promise that resolves to { width, height }.
 */
export const getImageDimensions = (file) => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve({ width: null, height: null });
      return;
    }

    const url = generateLocalPreview(file);
    if (!url) {
      resolve({ width: null, height: null });
      return;
    }

    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: null, height: null });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
};

// For Phase 1, we use the original image file as its own thumbnail locally via object URL.
// True thumbnail downsampling (e.g., via Canvas API) can be added here in Phase 2 if performance necessitates it.
export const generateImageThumbnail = async (file) => {
  // Currently returns the original file for the thumb to keep original HD quality intact everywhere
  return file; 
};
