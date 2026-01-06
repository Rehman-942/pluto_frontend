import { apiService } from './api';

export const commentService = {
  // Get comments for a photo
  getPhotoComments: async (photoId, params = {}) => {
    const response = await apiService.get(`/comments/photo/${photoId}`, params, { useCache: true });
    return response;
  },

  // Get comment thread
  getCommentThread: async (commentId, params = {}) => {
    const response = await apiService.get(`/comments/${commentId}/thread`, params, { useCache: true });
    return response;
  },

  // Create new comment
  createComment: async (commentData) => {
    const response = await apiService.post('/comments', commentData);
    
    // Clear comments cache for the photo
    apiService.clearCache(`/comments/photo/${commentData.photoId}`);
    if (commentData.parentId) {
      apiService.clearCache(`/comments/${commentData.parentId}/thread`);
    }
    
    return response;
  },

  // Update comment
  updateComment: async (id, commentData) => {
    const response = await apiService.put(`/comments/${id}`, commentData);
    
    // Clear comment-related caches
    apiService.clearCache('/comments');
    
    return response;
  },

  // Delete comment
  deleteComment: async (id) => {
    const response = await apiService.delete(`/comments/${id}`);
    
    // Clear comment-related caches
    apiService.clearCache('/comments');
    
    return response;
  },

  // Like/unlike comment
  likeComment: async (id) => {
    const response = await apiService.post(`/comments/${id}/like`);
    
    // Clear comment caches
    apiService.clearCache('/comments');
    
    return response;
  },

  // Report comment
  reportComment: async (id, reason) => {
    const response = await apiService.post(`/comments/${id}/report`, { reason });
    return response;
  },

  // Get user's comments
  getUserComments: async (userId, params = {}) => {
    const response = await apiService.get(`/comments/user/${userId}`, params, { useCache: true });
    return response;
  },
};
