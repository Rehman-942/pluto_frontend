import { apiService } from './api';

export const proxyUploadService = {
  /**
   * Upload video through backend proxy (avoids CORS issues)
   * @param {File} file - Video file to upload
   * @param {Object} videoData - Video metadata
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Upload result
   */
  uploadVideo: async (file, videoData, onProgress = null) => {
    console.log('=== PROXY UPLOAD DEBUG ===');
    console.log('File:', file);
    console.log('VideoData:', videoData);
    console.log('VideoData type:', typeof videoData);
    console.log('VideoData keys:', videoData ? Object.keys(videoData) : 'undefined');

    if (!videoData) {
      throw new Error('VideoData is undefined');
    }

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', videoData.title || 'Untitled Video');
    formData.append('description', videoData.description || '');
    formData.append('visibility', videoData.visibility || 'public');
    formData.append('tags', JSON.stringify(videoData.tags || []));

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
