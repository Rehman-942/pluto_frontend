import React, { useState, useRef, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { PlayArrow, Videocam } from '@mui/icons-material';

const VideoThumbnail = ({ 
  videoUrl,
  thumbnailUrl, 
  alt, 
  width = "100%", 
  height = 200,
  showPlayButton = true,
  onClick 
}) => {
  const [extractedThumbnail, setExtractedThumbnail] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionFailed, setExtractionFailed] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Extract thumbnail from video
  const extractThumbnail = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;

    try {
      // Set canvas size to video dimensions
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to data URL
      const dataURL = canvas.toDataURL('image/jpeg', 0.7);
      setExtractedThumbnail(dataURL);
      setIsExtracting(false);
      
      console.log('✅ Thumbnail extracted successfully');
    } catch (error) {
      if (error.name === 'SecurityError') {
        console.warn('⚠️ CORS error: Video server does not allow thumbnail extraction');
        console.log('💡 Using video poster frame as fallback...');
        // Try to use video poster attribute as fallback
        tryPosterFallback();
      } else {
        console.error('❌ Error extracting thumbnail:', error);
      }
      setExtractionFailed(true);
      setIsExtracting(false);
    }
  };

  // Fallback to video poster or show placeholder
  const tryPosterFallback = () => {
    const video = videoRef.current;
    if (video && video.poster) {
      console.log('🎬 Using video poster as thumbnail');
      setExtractedThumbnail(video.poster);
    } else {
      console.log('📺 Showing video placeholder (CORS restricted)');
    }
  };

  // Handle video events
  const handleVideoLoaded = () => {
    const video = videoRef.current;
    if (video && video.duration) {
      console.log('Video loaded, seeking for thumbnail...');
      // Seek to 2 seconds or 10% of duration for better thumbnail
      const seekTime = Math.min(2, video.duration * 0.1);
      video.currentTime = seekTime;
    }
  };

  const handleSeeked = () => {
    console.log('Video seeked, extracting frame...');
    extractThumbnail();
  };

  const handleVideoError = (error) => {
    console.error('Video loading failed:', error);
    setExtractionFailed(true);
    setIsExtracting(false);
  };

  // Start extraction when videoUrl is available
  useEffect(() => {
    if (videoUrl && !thumbnailUrl && !extractedThumbnail && !isExtracting && !extractionFailed) {
      console.log('🚀 Starting thumbnail extraction for:', videoUrl);
      setIsExtracting(true);
    }
  }, [videoUrl, thumbnailUrl, extractedThumbnail, isExtracting, extractionFailed]);

  // Render extracted thumbnail or existing thumbnail
  const thumbnailSrc = extractedThumbnail || thumbnailUrl;
  
  if (thumbnailSrc) {
    return (
      <Box
        sx={{
          width,
          height,
          position: 'relative',
          cursor: onClick ? 'pointer' : 'default',
          overflow: 'hidden'
        }}
        onClick={onClick}
      >
        <img
          src={thumbnailSrc}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onError={() => {
            console.warn('⚠️ Thumbnail image failed to load');
            setExtractionFailed(true);
          }}
        />
        
        {showPlayButton && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              borderRadius: '50%',
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              opacity: 0.9,
              transition: 'opacity 0.2s',
              '&:hover': {
                opacity: 1
              }
            }}
          >
            <PlayArrow sx={{ fontSize: 32 }} />
          </Box>
        )}

        {/* Hidden video and canvas for extraction */}
        {videoUrl && isExtracting && (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              onLoadedMetadata={handleVideoLoaded}
              onSeeked={handleSeeked}
              onError={handleVideoError}
              style={{ display: 'none' }}
              muted
              playsInline
              preload="metadata"
              crossOrigin="anonymous"
            />
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />
          </>
        )}
      </Box>
    );
  }

  // Show loading state while extracting
  if (isExtracting && videoUrl) {
    return (
      <Box
        sx={{
          width,
          height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'grey.100',
          cursor: onClick ? 'pointer' : 'default',
          position: 'relative'
        }}
        onClick={onClick}
      >
        <CircularProgress size={30} sx={{ mb: 1 }} />
        <Videocam sx={{ fontSize: 24, color: 'grey.500' }} />
        
        {/* Hidden video and canvas for extraction */}
        <video
          ref={videoRef}
          src={videoUrl}
          onLoadedMetadata={handleVideoLoaded}
          onSeeked={handleSeeked}
          onError={handleVideoError}
          style={{ display: 'none' }}
          muted
          playsInline
          preload="metadata"
          crossOrigin="anonymous"
        />
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </Box>
    );
  }

  // Fallback placeholder
  return (
    <Box
      sx={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        '&:hover': {
          background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
        }
      }}
      onClick={onClick}
    >
      <Videocam sx={{ fontSize: 48, opacity: 0.9 }} />
      {showPlayButton && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '50%',
            width: 56,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}
        >
          <PlayArrow sx={{ fontSize: 32 }} />
        </Box>
      )}
    </Box>
  );
};

export default VideoThumbnail;
