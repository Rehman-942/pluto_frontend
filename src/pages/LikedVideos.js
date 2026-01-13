import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Chip,
  IconButton,
  Skeleton,
  Button,
} from '@mui/material';
import {
  FavoriteOutlined,
  Favorite,
  PlayArrow,
  Visibility,
  Schedule,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { videoService } from '../services/videos';
import toast from 'react-hot-toast';

const LikedVideos = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const queryClient = useQueryClient();

  // Fetch liked videos (this would need a new API endpoint)
  const { data: likedVideosData, isLoading } = useQuery(
    ['likedVideos', user?._id],
    () => videoService.getLikedVideos(), // This endpoint needs to be implemented
    {
      enabled: !!isAuthenticated,
      onError: () => {
        // For now, return empty array since endpoint doesn't exist
        return { data: { videos: [] } };
      }
    }
  );

  const videos = likedVideosData?.data?.videos || [];

  // Unlike video mutation
  const unlikeMutation = useMutation(
    (videoId) => videoService.toggleLike(videoId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['likedVideos']);
        toast.success('Video removed from liked videos');
      },
      onError: () => {
        toast.error('Failed to unlike video');
      }
    }
  );

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleVideoClick = (videoId) => {
    navigate(`/video/${videoId}`);
  };

  const handleUnlike = (e, videoId) => {
    e.stopPropagation();
    unlikeMutation.mutate(videoId);
  };

  const VideoSkeleton = () => (
    <Card>
      <Skeleton variant="rectangular" height={200} />
      <CardContent>
        <Skeleton variant="text" height={24} />
        <Skeleton variant="text" width="60%" height={20} />
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="text" width="40%" height={16} />
        </Box>
      </CardContent>
    </Card>
  );

  const VideoCard = ({ video }) => (
    <Card 
      sx={{ 
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        }
      }}
      onClick={() => handleVideoClick(video._id)}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="200"
          image={video.thumbnails?.medium?.url || video.thumbnails?.poster?.url}
          alt={video.title}
          sx={{ objectFit: 'cover' }}
        />
        
        {/* Play Button Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0,
            transition: 'opacity 0.2s',
            '.MuiCard-root:hover &': {
              opacity: 1,
            },
          }}
        >
          <IconButton
            sx={{
              bgcolor: 'rgba(0,0,0,0.7)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
            }}
          >
            <PlayArrow sx={{ fontSize: 32 }} />
          </IconButton>
        </Box>

        {/* Duration Badge */}
        {video.video?.original?.duration && (
          <Chip
            label={formatDuration(video.video.original.duration)}
            size="small"
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              bgcolor: 'rgba(0,0,0,0.7)',
              color: 'white',
              fontSize: '0.75rem',
            }}
          />
        )}
      </Box>

      <CardContent>
        <Typography variant="h6" noWrap gutterBottom>
          {video.title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Avatar
            src={video.creatorId?.avatar?.url}
            sx={{ width: 24, height: 24 }}
          >
            {video.creatorId?.firstName?.[0]}
          </Avatar>
          <Typography variant="body2" color="text.secondary" noWrap>
            {video.creatorId?.firstName} {video.creatorId?.lastName}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Visibility fontSize="small" color="action" />
              <Typography variant="caption">
                {formatNumber(video.stats?.viewsCount || 0)}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {formatRelativeTime(video.createdAt)}
            </Typography>
          </Box>
          
          <IconButton
            size="small"
            color="error"
            onClick={(e) => handleUnlike(e, video._id)}
            disabled={unlikeMutation.isLoading}
          >
            <Favorite fontSize="small" />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );

  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Please log in to view your liked videos
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/login')}
          sx={{ mt: 2 }}
        >
          Log In
        </Button>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title>Liked Videos - Pluto</title>
        <meta name="description" content="Your collection of liked videos on Pluto" />
      </Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
            Liked Videos
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Your favorite videos from the community
          </Typography>
        </Box>

        {/* Videos Grid */}
        {isLoading ? (
          <Grid container spacing={3}>
            {[...Array(12)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <VideoSkeleton />
              </Grid>
            ))}
          </Grid>
        ) : videos.length > 0 ? (
          <Grid container spacing={3}>
            {videos.map((video) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={video._id}>
                <VideoCard video={video} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Favorite sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No liked videos yet
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Start exploring and like videos you enjoy!
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
            >
              Discover Videos
            </Button>
          </Box>
        )}
      </Container>
    </>
  );
};

export default LikedVideos;
