import apiClient from './api';

// Video service for API interactions
class VideoService {
  // Get all videos with pagination and filters
  async getVideos(params = {}) {
    const response = await apiClient.get('/videos', { params });
    return response.data;
  }

  // Get trending videos
  async getTrendingVideos(params = {}) {
    const response = await apiClient.get('/videos/trending', { params });
    return response.data;
  }

  // Get single video by ID
  async getVideo(id) {
    const response = await apiClient.get(`/videos/${id}`);
    return response.data;
  }

  // Get videos by user ID
  async getUserVideos(userId, params = {}) {
    const response = await apiClient.get(`/videos/user/${userId}`, { params });
    return response.data;
  }

  // Upload new video
  async uploadVideo(videoData, onProgress) {
    const formData = new FormData();
    
    // Append file
    formData.append('video', videoData.file);
    
    // Append other data
    if (videoData.title) formData.append('title', videoData.title);
    if (videoData.description) formData.append('description', videoData.description);
    if (videoData.visibility) formData.append('visibility', videoData.visibility);
    if (videoData.tags && videoData.tags.length > 0) {
      videoData.tags.forEach(tag => formData.append('tags', tag));
    }

    const response = await apiClient.post('/videos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    });
    
    // Clear cache
    apiClient.clearCache('videos');
    
    return response.data;
  }

  // Update video
  async updateVideo(id, videoData) {
    const response = await apiClient.put(`/videos/${id}`, videoData);
    
    // Clear cache
    apiClient.clearCache('videos');
    apiClient.clearCache(`video-${id}`);
    
    return response.data;
  }

  // Delete video
  async deleteVideo(id) {
    const response = await apiClient.delete(`/videos/${id}`);
    
    // Clear cache
    apiClient.clearCache('videos');
    apiClient.clearCache(`video-${id}`);
    
    return response.data;
  }

  // Like/unlike video
  async toggleLike(id) {
    const response = await apiClient.post(`/videos/${id}/like`);
    
    // Clear cache
    apiClient.clearCache(`video-${id}`);
    
    return response.data;
  }

  // Update watch time for video
  async updateWatchTime(id, watchTime) {
    const response = await apiClient.post(`/videos/${id}/view`, { watchTime });
    return response.data;
  }

  // Search videos
  async searchVideos(query, params = {}) {
    const searchParams = { ...params };
    if (query) searchParams.search = query;
    
    const response = await apiClient.get('/videos', { params: searchParams });
    return response.data;
  }
}

export const videoService = new VideoService();
export default videoService;
