import { MediaType } from '../types';

export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const SUPPORTED_EXTENSIONS = {
  image: ['jpg', 'jpeg', 'png', 'webp'],
  audio: ['mp3', 'wav', 'm4a', 'ogg'],
  video: ['mp4', 'mov', 'webm'],
} as const;

export const SUPPORTED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  audio: [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/wave',
    'audio/m4a',
    'audio/x-m4a',
    'audio/mp4',
    'audio/ogg',
    'audio/vorbis',
  ],
  video: [
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-matroska',
  ],
} as const;

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  mediaType?: MediaType;
  file?: File;
}

export interface UrlValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedUrl?: string;
}

/**
 * Formats byte size into human-readable representation (e.g. "4.2 MB", "850 KB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Extracts the file extension in lower case without the dot.
 */
export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
};

/**
 * Detects the MediaType ('image' | 'audio' | 'video') from MIME type or file extension.
 */
export const detectMediaType = (file: File): MediaType | null => {
  const mime = file.type.toLowerCase();
  const ext = getFileExtension(file.name);

  // Check by MIME first
  if (SUPPORTED_MIME_TYPES.image.includes(mime as any) || SUPPORTED_EXTENSIONS.image.includes(ext as any)) {
    return 'image';
  }
  if (SUPPORTED_MIME_TYPES.audio.includes(mime as any) || SUPPORTED_EXTENSIONS.audio.includes(ext as any)) {
    return 'audio';
  }
  if (SUPPORTED_MIME_TYPES.video.includes(mime as any) || SUPPORTED_EXTENSIONS.video.includes(ext as any)) {
    return 'video';
  }

  return null;
};

/**
 * Validates a media file for supported type and size limit.
 */
export const validateMediaFile = (file: File): FileValidationResult => {
  if (!file) {
    return {
      isValid: false,
      error: 'No file was provided for inspection.',
    };
  }

  // Size Check (50 MB limit)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const fileSizeFormatted = formatFileSize(file.size);
    return {
      isValid: false,
      error: `File is too large (${fileSizeFormatted}). Please choose a file smaller than ${MAX_FILE_SIZE_MB} MB.`,
    };
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: 'The selected file is empty (0 bytes). Please choose a valid media file.',
    };
  }

  // Type & Extension Check
  const detectedType = detectMediaType(file);
  if (!detectedType) {
    return {
      isValid: false,
      error: 'Unsupported file type. Please choose JPG, PNG, WEBP, MP3, WAV, M4A, OGG, MP4, MOV, or WEBM.',
    };
  }

  return {
    isValid: true,
    mediaType: detectedType,
    file,
  };
};

/**
 * Validates that a string has standard URL format (http/https)
 */
export const validateMediaUrl = (url: string): UrlValidationResult => {
  const trimmed = url.trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Please enter a media URL.',
    };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'Please enter a valid web URL starting with http:// or https://',
      };
    }

    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return {
        isValid: false,
        error: 'Please enter a complete URL with a valid domain name (e.g. https://example.com/media.mp4)',
      };
    }

    return {
      isValid: true,
      sanitizedUrl: parsed.toString(),
    };
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format. Please ensure it begins with https:// or http://',
    };
  }
};
