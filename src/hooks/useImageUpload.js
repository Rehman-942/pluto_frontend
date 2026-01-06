import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

// Hook for handling image upload with preview and validation
export const useImageUpload = (options = {}) => {
  const {
    maxSize = 50 * 1024 * 1024, // 50MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    onUpload = null,
    onError = null,
  } = options;

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const validateFile = useCallback((file) => {
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: `File type not allowed. Supported types: ${allowedTypes.join(', ')}` 
      };
    }

    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `File size must be less than ${(maxSize / (1024 * 1024)).toFixed(1)}MB` 
      };
    }

    return { valid: true };
  }, [allowedTypes, maxSize]);

  const handleFileSelect = useCallback((file) => {
    const validation = validateFile(file);
    
    if (!validation.valid) {
      toast.error(validation.error);
      if (onError) onError(validation.error);
      return false;
    }

    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);

    return true;
  }, [validateFile, onError]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !onUpload) {
      return null;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const result = await onUpload(selectedFile, setProgress);
      toast.success('Upload successful!');
      return result;
    } catch (error) {
      toast.error(error.message || 'Upload failed');
      if (onError) onError(error.message);
      throw error;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [selectedFile, onUpload, onError]);

  const reset = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsUploading(false);
    setProgress(0);
  }, []);

  const removeFile = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    reset();
  }, [previewUrl, reset]);

  return {
    selectedFile,
    previewUrl,
    isUploading,
    progress,
    handleFileSelect,
    handleUpload,
    reset,
    removeFile,
    validateFile,
  };
};

export default useImageUpload;
