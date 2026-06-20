// Configuration limits for Orvix HD Media System

export const MEDIA_LIMITS = {
  imageMaxBytes: 10 * 1024 * 1024, // 10 MB limit for Phase 1
  videoMaxBytes: 50 * 1024 * 1024,
  fileMaxBytes: 25 * 1024 * 1024,
  videoMaxDurationSeconds: 120,
};

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
];

// Dangerous extensions to strictly block even in future phases
export const BLOCKED_EXTENSIONS = [
  "exe", "apk", "bat", "sh", "js", "html", "php", "cmd", "msi", "jar", "scr", "vbs"
];

export const STORAGE_PROVIDER = {
  NONE: "none",
};

export const MESSAGE_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  VIDEO: "video",
  FILE: "file",
};
