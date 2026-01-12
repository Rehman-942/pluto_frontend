import axios from 'axios';
import { apiService } from './api';

export const azureUploadService = {
  /**
   * Get SAS token for video upload
   * @returns {Promise<Object>} SAS token data
   */
  getVideoUploadToken: async () => {
    const response = await apiService.post('/upload/video-sas');
    return response.data.data;
  },

  /**
   * Upload video directly to Azure Blob Storage
   * @param {File} file - Video file to upload
   * @param {string} uploadUrl - Azure SAS upload URL
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<void>}
   */
  uploadVideoToAzure: async (file, uploadUrl, onProgress = null) => {
    console.log('=== AZURE UPLOAD DEBUG ===');
    console.log('File:', { name: file.name, size: file.size, type: file.type });
    console.log('Upload URL:', uploadUrl);
    
    const config = {
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        // Don't set Content-Type to avoid CORS preflight issues
      },
      onUploadProgress: (progressEvent) => {
        console.log('Upload progress:', progressEvent.loaded, '/', progressEvent.total);
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    };

    try {
      console.log('Starting Azure upload...');
      // Upload directly to Azure using PUT request
      const response = await axios.put(uploadUrl, file, config);
      console.log('Azure upload success:', response.status);
    } catch (error) {
      console.error('Azure upload failed:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw error;
    }
  },

  /**
   * Complete video upload by creating database record
   * @param {Object} videoData - Video metadata
   * @returns {Promise<Object>} Created video data
   */
  completeVideoUpload: async (videoData) => {
    const response = await apiService.post('/upload/video-complete', videoData);
    return response.data.data;
  },

  /**
   * Get thumbnail upload SAS tokens
   * @param {string} videoId - Video ID
   * @param {number} count - Number of thumbnails
   * @returns {Promise<Object>} Thumbnail SAS tokens
   */
  getThumbnailUploadTokens: async (videoId, count = 3) => {
    const response = await apiService.post(`/upload/thumbnail-sas/${videoId}`, { count });
    return response.data.data;
  },

  /**
   * Upload thumbnail to Azure
   * @param {Blob} thumbnailBlob - Thumbnail image blob
   * @param {string} uploadUrl - Azure SAS upload URL
   * @returns {Promise<void>}
   */
  uploadThumbnailToAzure: async (thumbnailBlob, uploadUrl) => {
    const config = {
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        // Don't set Content-Type to avoid CORS preflight issues
      },
    };

    await axios.put(uploadUrl, thumbnailBlob, config);
  },

  /**
   * Update video with thumbnails
   * @param {string} videoId - Video ID
   * @param {Array} thumbnails - Thumbnail data array
   * @returns {Promise<Object>} Updated video data
   */
  updateVideoThumbnails: async (videoId, thumbnails) => {
    const response = await apiService.patch(`/upload/video-thumbnails/${videoId}`, { thumbnails });
    return response.data;
  },

  /**
   * Generate thumbnails from video file
   * @param {File} videoFile - Video file
   * @param {number} count - Number of thumbnails to generate
   * @returns {Promise<Array>} Array of thumbnail blobs
   */
  generateThumbnails: async (videoFile, count = 3) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const thumbnails = [];

      video.addEventListener('loadedmetadata', () => {
        const duration = video.duration;
        const interval = duration / (count + 1);
        
        canvas.width = 320;
        canvas.height = 180;

        let currentIndex = 0;

        const captureFrame = () => {
          if (currentIndex >= count) {
            resolve(thumbnails);
            return;
          }

          const time = interval * (currentIndex + 1);
          video.currentTime = time;
        };

        video.addEventListener('seeked', () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob((blob) => {
            thumbnails.push({
              index: currentIndex,
              timestamp: video.currentTime,
              blob: blob
            });
            
            currentIndex++;
            if (currentIndex < count) {
              captureFrame();
            } else {
              resolve(thumbnails);
            }
          }, 'image/jpeg', 0.8);
        });

        video.addEventListener('error', reject);
        captureFrame();
      });

      video.addEventListener('error', reject);
      video.src = URL.createObjectURL(videoFile);
    });
  },

  /**
   * Full video upload workflow
   * @param {File} file - Video file
   * @param {Object} metadata - Video metadata (title, description, etc.)
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Uploaded video data
   */
  uploadVideo: async (file, metadata, onProgress = null) => {
    try {
      // Step 1: Get upload SAS token
      onProgress?.(5, 'Getting upload authorization...');
      const sasData = await azureUploadService.getVideoUploadToken();

      // Step 2: Upload video to Azure
      onProgress?.(10, 'Uploading video...');
      await azureUploadService.uploadVideoToAzure(file, sasData.uploadUrl, (progress) => {
        // Map upload progress to 10-70%
        const mappedProgress = 10 + (progress * 0.6);
        onProgress?.(mappedProgress, 'Uploading video...');
      });

      // Step 3: Complete video upload (create database record)
      onProgress?.(75, 'Processing video...');
      const videoData = {
        videoPublicId: sasData.videoPublicId,
        blobUrl: sasData.blobUrl,
        title: metadata.title,
        description: metadata.description || '',
        visibility: metadata.visibility || 'public',
        tags: metadata.tags || [],
        metadata: {
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size
        }
      };

      const video = await azureUploadService.completeVideoUpload(videoData);

      // Step 4: Generate and upload thumbnails
      onProgress?.(80, 'Generating thumbnails...');
      try {
        const thumbnailBlobs = await azureUploadService.generateThumbnails(file, 3);
        
        onProgress?.(90, 'Uploading thumbnails...');
        const thumbnailTokens = await azureUploadService.getThumbnailUploadTokens(video.video._id, thumbnailBlobs.length);

        const thumbnailData = [];
        for (let i = 0; i < thumbnailBlobs.length; i++) {
          const token = thumbnailTokens.thumbnails[i];
          const thumbData = thumbnailBlobs[i];
          
          await azureUploadService.uploadThumbnailToAzure(thumbData.blob, token.uploadUrl);
          
          thumbnailData.push({
            url: token.blobUrl,
            timestamp: thumbData.timestamp,
            index: thumbData.index
          });
        }

        // Update video with thumbnails
        await azureUploadService.updateVideoThumbnails(video.video._id, thumbnailData);
        
        onProgress?.(100, 'Upload complete!');
      } catch (thumbnailError) {
        console.warn('Thumbnail generation failed, but video upload succeeded:', thumbnailError);
        onProgress?.(100, 'Upload complete (thumbnails will be generated later)');
      }

      return video;
    } catch (error) {
      console.error('Video upload failed:', error);
      throw error;
    }
  }
};

export default azureUploadService;
