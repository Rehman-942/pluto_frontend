import React, { useRef, useState, useEffect, forwardRef } from 'react';
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Tooltip,
  Fade,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  FullscreenExit,
  Settings,
  Forward10,
  Replay10,
  PictureInPicture,
} from '@mui/icons-material';
import { videoService } from '../../services/videos';

const VideoPlayer = forwardRef(({ 
  video, 
  autoPlay = false, 
  onWatchTimeUpdate,
  className = '',
  ...props 
}, ref) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const watchTimeRef = useRef(0);
  const lastWatchTimeUpdate = useRef(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [quality, setQuality] = useState('original');
  const [buffered, setBuffered] = useState(0);

  // Available video qualities
  const qualities = [
    { label: 'Auto', value: 'auto' },
    { label: '1080p', value: 'hd' },
    { label: '720p', value: 'sd' },
    { label: '480p', value: 'mobile' },
    { label: 'Original', value: 'original' }
  ];

  // Get video URL based on quality
  const getVideoUrl = () => {
    if (!video?.video) return '';
    
    switch (quality) {
      case 'hd':
        return video.video.qualities?.hd?.url || video.video.original.url;
      case 'sd':
        return video.video.qualities?.sd?.url || video.video.original.url;
      case 'mobile':
        return video.video.qualities?.mobile?.url || video.video.original.url;
      case 'original':
      default:
        return video.video.original.url;
    }
  };

  // Format time display
  const formatTime = (timeInSeconds) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  // Handle volume change
  const handleVolumeChange = (event, newValue) => {
    const volumeValue = newValue / 100;
    setVolume(volumeValue);
    if (videoRef.current) {
      videoRef.current.volume = volumeValue;
      videoRef.current.muted = volumeValue === 0;
      setMuted(volumeValue === 0);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  // Handle seek
  const handleSeek = (event, newValue) => {
    if (videoRef.current) {
      videoRef.current.currentTime = (newValue / 100) * duration;
    }
  };

  // Skip forward/backward
  const skipTime = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Toggle picture-in-picture
  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP not supported or failed:', error);
    }
  };

  // Show/hide controls
  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Update watch time
  const updateWatchTime = () => {
    const currentWatchTime = Math.floor(watchTimeRef.current);
    const timeSinceLastUpdate = currentWatchTime - lastWatchTimeUpdate.current;
    
    if (timeSinceLastUpdate >= 10) { // Update every 10 seconds
      if (onWatchTimeUpdate && video?._id) {
        onWatchTimeUpdate(timeSinceLastUpdate);
        videoService.updateWatchTime(video._id, timeSinceLastUpdate).catch(console.error);
      }
      lastWatchTimeUpdate.current = currentWatchTime;
    }
  };

  // Video event handlers
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
      if (isPlaying) {
        watchTimeRef.current += 0.1; // Approximate increment
        updateWatchTime();
      }
    };

    const handleProgress = () => {
      if (videoElement.buffered.length > 0) {
        const bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
        const bufferedPercent = (bufferedEnd / videoElement.duration) * 100;
        setBuffered(bufferedPercent);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      updateWatchTime(); // Final update on video end
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('progress', handleProgress);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('canplay', handleCanPlay);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('progress', handleProgress);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('waiting', handleWaiting);
      videoElement.removeEventListener('canplay', handleCanPlay);
    };
  }, [isPlaying]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (!containerRef.current?.contains(event.target)) return;
      
      switch (event.key) {
        case ' ':
          event.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          skipTime(-10);
          break;
        case 'ArrowRight':
          event.preventDefault();
          skipTime(10);
          break;
        case 'ArrowUp':
          event.preventDefault();
          handleVolumeChange(null, Math.min(100, volume * 100 + 10));
          break;
        case 'ArrowDown':
          event.preventDefault();
          handleVolumeChange(null, Math.max(0, volume * 100 - 10));
          break;
        case 'f':
          event.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          event.preventDefault();
          toggleMute();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [volume, isPlaying]);

  if (!video?.video) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <Typography>No video available</Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      className={className}
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        bgcolor: 'black',
        overflow: 'hidden',
        borderRadius: 1,
        ...props.sx
      }}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={getVideoUrl()}
        poster={video.thumbnails?.poster?.url}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
        autoPlay={autoPlay}
        playsInline
        onDoubleClick={toggleFullscreen}
        onClick={togglePlay}
      />

      {/* Loading Spinner */}
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 3
          }}
        >
          <CircularProgress size={60} sx={{ color: 'white' }} />
        </Box>
      )}

      {/* Controls Overlay */}
      <Fade in={showControls || !isPlaying}>
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
            p: 2,
            zIndex: 2
          }}
        >
          {/* Progress Bar */}
          <Box sx={{ mb: 2 }}>
            <Slider
              value={duration ? (currentTime / duration) * 100 : 0}
              onChange={handleSeek}
              sx={{
                color: 'primary.main',
                height: 4,
                '& .MuiSlider-thumb': {
                  width: 12,
                  height: 12,
                  '&:hover': { boxShadow: '0 0 0 8px rgba(25, 118, 210, 0.16)' }
                },
                '& .MuiSlider-track': { border: 'none' },
                '& .MuiSlider-rail': { color: 'rgba(255, 255, 255, 0.3)' }
              }}
            />
            {/* Buffer Bar */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: 4,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                transform: 'translateY(-50%)',
                zIndex: -1
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  width: `${buffered}%`,
                  bgcolor: 'rgba(255, 255, 255, 0.4)'
                }}
              />
            </Box>
          </Box>

          {/* Controls Bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Play/Pause */}
            <IconButton onClick={togglePlay} sx={{ color: 'white' }}>
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>

            {/* Skip Backward */}
            <IconButton onClick={() => skipTime(-10)} sx={{ color: 'white' }}>
              <Replay10 />
            </IconButton>

            {/* Skip Forward */}
            <IconButton onClick={() => skipTime(10)} sx={{ color: 'white' }}>
              <Forward10 />
            </IconButton>

            {/* Volume Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 120 }}>
              <IconButton onClick={toggleMute} sx={{ color: 'white' }}>
                {muted ? <VolumeOff /> : <VolumeUp />}
              </IconButton>
              <Slider
                value={muted ? 0 : volume * 100}
                onChange={handleVolumeChange}
                sx={{
                  color: 'white',
                  width: 80,
                  mx: 1,
                  '& .MuiSlider-thumb': { width: 8, height: 8 }
                }}
              />
            </Box>

            {/* Time Display */}
            <Typography variant="body2" sx={{ color: 'white', minWidth: 'auto' }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Typography>

            {/* Spacer */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Picture-in-Picture */}
            <Tooltip title="Picture-in-Picture">
              <IconButton onClick={togglePiP} sx={{ color: 'white' }}>
                <PictureInPicture />
              </IconButton>
            </Tooltip>

            {/* Quality Settings */}
            <Tooltip title="Quality">
              <IconButton sx={{ color: 'white' }}>
                <Settings />
              </IconButton>
            </Tooltip>

            {/* Fullscreen */}
            <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }}>
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Box>
        </Box>
      </Fade>

      {/* Click to play overlay when paused */}
      {!isPlaying && !isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2
          }}
        >
          <IconButton
            onClick={togglePlay}
            sx={{
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.8)' },
              width: 80,
              height: 80
            }}
          >
            <PlayArrow sx={{ fontSize: 50 }} />
          </IconButton>
        </Box>
      )}
    </Box>
  );
});

export default VideoPlayer;
