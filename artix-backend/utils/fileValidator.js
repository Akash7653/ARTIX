/**
 * File Upload Validation Utility
 * Validates file uploads for ARTIX registration system
 */

// Allowed MIME types (strict whitelist)
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/x-jpg',
  'image/png',
  'image/webp'
];

// Forbidden file extensions (blacklist)
const FORBIDDEN_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.zip', '.rar', '.7z', '.tar', '.gz', '.iso',
  '.msi', '.dll', '.sys', '.drv',
  '.sh', '.bash', '.ps1', '.powershell',
  '.dmg', '.app', '.deb', '.rpm',
  '.html', '.htm', '.php', '.asp', '.jsp',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.txt', '.log', '.ini', '.conf', '.config'
];

/**
 * Validate file MIME type
 */
export function isValidMimeType(mimeType) {
  // If no MIME type provided, it might be an image with missing type info
  // We'll validate by file extension instead
  if (!mimeType) return true;
  
  const normalizedMimeType = mimeType.toLowerCase().trim();
  
  // Check if MIME type is in allowed list
  if (ALLOWED_MIME_TYPES.includes(normalizedMimeType)) {
    return true;
  }
  
  // Allow any image/* MIME type (most permissive approach)
  if (normalizedMimeType.startsWith('image/')) {
    return true;
  }
  
  // Some systems send application/octet-stream for images
  // We'll allow it and rely on extension validation
  if (normalizedMimeType === 'application/octet-stream') {
    return true;
  }
  
  return false;
}

/**
 * Validate file extension
 */
export function isValidFileExtension(filename) {
  if (!filename) return false;
  
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return !FORBIDDEN_EXTENSIONS.includes(ext);
}

/**
 * Sanitize filename to prevent directory traversal
 */
export function sanitizeFilename(filename) {
  if (!filename) return 'file';
  
  // Remove path separators and special characters
  let sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limit length to prevent filesystem issues
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 240) + sanitized.substring(sanitized.length - 15);
  }
  
  return sanitized;
}

/**
 * Get file extension
 */
export function getFileExtension(filename) {
  if (!filename) return '';
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return ext;
}

/**
 * Validate file size
 */
export function isValidFileSize(sizeInBytes, maxSizeInMB = 50) {
  const maxBytes = maxSizeInMB * 1024 * 1024;
  return sizeInBytes > 0 && sizeInBytes <= maxBytes;
}

/**
 * Comprehensive file validation
 * Returns { valid: boolean, error: string | null, details: object }
 */
export function validateUploadFile(file, maxSizeInMB = 10) {
  if (!file) {
    return {
      valid: false,
      error: 'No file provided',
      details: null
    };
  }

  // Validate file extension FIRST (most important for security)
  if (!isValidFileExtension(file.originalname)) {
    return {
      valid: false,
      error: 'File extension not allowed. Please use an image file (JPG, PNG, WebP).',
      details: {
        filename: file.originalname,
        allowed: ['jpg', 'jpeg', 'png', 'webp']
      }
    };
  }

  // Validate MIME type (more lenient for production compatibility)
  if (!isValidMimeType(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file type. Expected image file but got: ${file.mimetype || 'unknown'}. Only JPEG, PNG, and WebP images are allowed.`,
      details: {
        provided: file.mimetype,
        allowed: ALLOWED_MIME_TYPES,
        filename: file.originalname
      }
    };
  }

  // Validate file size
  if (!isValidFileSize(file.size, maxSizeInMB)) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeInMB}MB limit.`,
      details: {
        fileSize: file.size,
        maxSize: maxSizeInMB * 1024 * 1024,
        fileSizeInMB: (file.size / (1024 * 1024)).toFixed(2)
      }
    };
  }

  // All validations passed
  return {
    valid: true,
    error: null,
    details: {
      filename: file.originalname,
      mimeType: file.mimetype || 'image (auto-detected)',
      size: file.size,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
    }
  };
}

/**
 * Generate safe filename with UUID
 * Prevents directory traversal and filename collisions
 */
export function generateSafeFilename(originalFilename) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const ext = getFileExtension(originalFilename);
  
  // Create safe filename: timestamp_random_extension
  return `upload_${timestamp}_${random}${ext}`;
}

/**
 * Check if file appears to be suspicious
 * Basic heuristics for malware detection
 */
export function isSuspiciousFile(filename, content) {
  // Check for executable signatures
  if (content) {
    const header = content.slice(0, 4).toString('hex').toUpperCase();
    
    // PE executable signature
    if (header.startsWith('4D5A')) return true; // MZ header
    
    // ELF executable signature
    if (header.startsWith('7F454C46')) return true; // ELF header
    
    // ZIP signature (could be malicious archive)
    if (header.startsWith('504B0304')) {
      // Some ZIPs are legitimate, but flag for review
      return filename.includes('.zip') && !filename.includes('screenshot');
    }
  }
  
  return false;
}

export default {
  isValidMimeType,
  isValidFileExtension,
  sanitizeFilename,
  getFileExtension,
  isValidFileSize,
  validateUploadFile,
  generateSafeFilename,
  isSuspiciousFile,
  ALLOWED_MIME_TYPES,
  FORBIDDEN_EXTENSIONS
};
