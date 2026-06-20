import { MEDIA_LIMITS, ALLOWED_IMAGE_TYPES, BLOCKED_EXTENSIONS, MESSAGE_TYPES } from '../config/mediaConfig';

export const getFileExtension = (fileName) => {
  if (!fileName) return '';
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

export const sanitizeFileName = (fileName) => {
  if (!fileName) return 'unnamed_file';
  // Remove spaces, special chars, keep alphanumeric, dash, underscore, dot
  let safe = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '');
  // Prevent path traversal
  safe = safe.replace(/\.+/g, '.');
  return safe || 'unnamed_file';
};

export const isAllowedImageType = (mimeType) => {
  return ALLOWED_IMAGE_TYPES.includes(mimeType?.toLowerCase());
};

export const getMessageTypeFromMime = (mimeType) => {
  if (!mimeType) return MESSAGE_TYPES.FILE;
  if (mimeType.startsWith('image/')) return MESSAGE_TYPES.IMAGE;
  if (mimeType.startsWith('video/')) return MESSAGE_TYPES.VIDEO;
  if (mimeType.startsWith('audio/')) return MESSAGE_TYPES.VOICE; // 'voice' in current schema
  return MESSAGE_TYPES.FILE;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validateMediaFile = (file) => {
  if (!file) return { valid: false, error: "No file selected." };

  const ext = getFileExtension(file.name);
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: "This file type is not allowed for security reasons." };
  }

  const messageType = getMessageTypeFromMime(file.type);

  // Phase 1 Restriction: Only allow images
  if (messageType !== MESSAGE_TYPES.IMAGE) {
    return { valid: false, error: "Currently, only image sharing is supported." };
  }

  if (!isAllowedImageType(file.type)) {
    return { valid: false, error: "Unsupported image format. Please use JPEG, PNG, or WebP." };
  }

  if (file.size > MEDIA_LIMITS.imageMaxBytes) {
    return { 
      valid: false, 
      error: `Image size exceeds the ${formatFileSize(MEDIA_LIMITS.imageMaxBytes)} limit.` 
    };
  }

  return { valid: true, error: null, messageType };
};
