import { apiService } from './api';

export const proxyUploadService = {
  /**
   * Upload video with optional thumbnail through backend proxy (avoids CORS issues)
   * @param {Object} uploadData - Upload data containing videoFile, thumbnailFile, and videoData
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Upload result
   */
  uploadVideo: async (uploadData, onProgress = null) => {
    console.log('=== PROXY UPLOAD DEBUG ===');
    console.log('UploadData:', uploadData);
    console.log('VideoFile:', uploadData.videoFile);
    console.log('ThumbnailFile:', uploadData.thumbnailFile);
    console.log('VideoData:', uploadData.videoData);
    console.log('VideoData type:', typeof uploadData.videoData);
    console.log('VideoData keys:', uploadData.videoData ? Object.keys(uploadData.videoData) : 'undefined');

    if (!uploadData.videoData) {
      throw new Error('VideoData is undefined');
    }

    if (!uploadData.videoFile) {
      throw new Error('VideoFile is required');
    }

    const formData = new FormData();
    formData.append('video', uploadData.videoFile);
    
    // Add thumbnail if provided
    if (uploadData.thumbnailFile) {
      console.log('Adding thumbnail file:', uploadData.thumbnailFile.name);
      formData.append('thumbnail', uploadData.thumbnailFile);
    }
    
    formData.append('title', uploadData.videoData.title || 'Untitled Video');
    formData.append('description', uploadData.videoData.description || '');
    formData.append('visibility', uploadData.videoData.visibility || 'public');
    formData.append('tags', JSON.stringify(uploadData.videoData.tags || []));

    try {
      console.log('Starting proxy upload...');
      const response = await apiService.post('/upload-proxy/video-proxy', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log('Upload progress:', percentCompleted + '%');
            onProgress(percentCompleted);
          }
        },
      });

      console.log('Proxy upload success:', response.data);
      console.log('Response.data structure:', Object.keys(response.data));
      console.log('Response.data.data structure:', response.data.data ? Object.keys(response.data.data) : 'undefined');
      console.log('Video object:', response.data.data?.video);
      return response.data;
    } catch (error) {
      console.error('Proxy upload failed:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      throw error;
    }
  },
};
