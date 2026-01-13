import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Skeleton,
  Tabs,
  Tab,
  useMediaQuery,
} from '@mui/material';
import {
  FavoriteOutlined,
  Favorite,
  Visibility,
  Comment,
  TrendingUp,
  Videocam,
  VideoLibrary,
} from '@mui/icons-material';
import VideoThumbnail from '../components/Video/VideoThumbnail';
import { useTheme } from '@mui/material/styles';
import { useQuery } from 'react-query';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Helmet } from 'react-helmet-async';
import { videoService } from '../services/videos';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [tabValue, setTabValue] = useState(0);
  const [videos, setVideos] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const { data: latestVideos, isLoading: latestLoading } = useQuery(
    ['videos', 'latest', page],
    () => videoService.getVideos({ page, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' }),
    {
      enabled: tabValue === 0,
      keepPreviousData: true,
    }
  );

  const { data: trendingVideos, isLoading: trendingLoading } = useQuery(
    ['videos', 'trending', page],
    () => videoService.getTrendingVideos({ page, limit: 20, timeframe: '7d' }),
    {
      enabled: tabValue === 1,
      keepPreviousData: true,
    }
  );

  useEffect(() => {
    if (tabValue === 0 && latestVideos?.data.videos) {
      if (page === 1) {
        setVideos(latestVideos.data.videos);
      } else {
        setVideos(prev => [...prev, ...latestVideos.data.videos]);
      }
      setHasMore(latestVideos.data.pagination.hasMore);
    }
  }, [latestVideos, tabValue, page]);

  useEffect(() => {
    if (tabValue === 1 && trendingVideos?.data.videos) {
      if (page === 1) {
        setVideos(trendingVideos.data.videos);
      } else {
        setVideos(prev => [...prev, ...trendingVideos.data.videos]);
      }
      setHasMore(trendingVideos.data.pagination.hasMore);
    }
  }, [trendingVideos, tabValue, page]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(1);
    setVideos([]);
    setHasMore(true);
  };

  const loadMoreVideos = () => {
    setPage(prev => prev + 1);
  };

  const handleLike = async (videoId) => {
    if (!isAuthenticated) {
      toast.error('Please log in to like videos');
      navigate('/login');
      return;
    }

    try {
      const response = await videoService.likeVideo(videoId);
      
      // Update local state
      setVideos(prev => prev.map(video => {
        if (video._id === videoId) {
          return {
            ...video,
            isLiked: !video.isLiked,
            stats: {
              ...video.stats,
              likesCount: video.isLiked 
                ? video.stats.likesCount - 1 
                : video.stats.likesCount + 1
            }
          };
        }
        return video;
      }));
    } catch (error) {
      toast.error('Failed to like video');
    }
  };

  const VideoCard = ({ video }) => (
    <Card 
      sx={{ 
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        }
      }}
      onClick={() => navigate(`/video/${video._id}`)}
    >
      <VideoThumbnail
        videoUrl={video.video?.original?.url}
        thumbnailUrl={video.thumbnails?.poster?.url || video.thumbnails?.medium?.url || video.thumbnails?.[0]?.url}
        alt={video.title}
        height={isMobile ? 200 : 240}
        onClick={() => navigate(`/video/${video._id}`)}
      />
      <CardContent sx={{ pb: 1 }}>
        <Typography variant="subtitle1" fontWeight={600} noWrap>
          {video.title}
        </Typography>
        
        {video.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mt: 0.5
            }}
          >
            {video.description}
          </Typography>
        )}

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {video.tags.slice(0, 3).map((tag, index) => (
              <Chip 
                key={index} 
                label={`#${tag}`} 
                size="small" 
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/search?q=${encodeURIComponent(tag)}`);
                }}
              />
            ))}
            {video.tags.length > 3 && (
              <Typography variant="caption" color="text.secondary">
                +{video.tags.length - 3} more
              </Typography>
            )}
          </Box>
        )}

        {/* Creator Info */}
        {video.creatorId && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
            <Avatar 
              src={video.creatorId.avatar?.url} 
              sx={{ width: 32, height: 32, mr: 1 }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/user/${video.creatorId.username}`);
              }}
            >
              {video.creatorId.firstName?.[0]}
            </Avatar>
            <Typography 
              variant="body2" 
              fontWeight={500}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/user/${video.creatorId.username}`);
              }}
              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              {video.creatorId.firstName} {video.creatorId.lastName}
            </Typography>
          </Box>
        )}

        {/* Stats */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleLike(video._id);
              }}
              color={video.isLiked ? 'error' : 'default'}
            >
              {video.isLiked ? <Favorite color="error" /> : <FavoriteOutlined />}
            </IconButton>
            <Typography variant="caption">{video.stats?.likesCount || 0}</Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Visibility fontSize="small" color="action" />
              <Typography variant="caption">{video.stats?.viewsCount || 0}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Comment fontSize="small" color="action" />
              <Typography variant="caption">{video.stats?.commentsCount || 0}</Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const VideoSkeleton = () => (
    <Card>
      <Skeleton variant="rectangular" height={240} />
      <CardContent>
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width="40%" sx={{ ml: 1 }} />
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Helmet>
        <title>Pluto - Discover Amazing Videos</title>
        <meta name="description" content="Discover and share amazing videos with Pluto community" />
      </Helmet>

      {/* Hero Section */}
      {!isAuthenticated && (
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            py: 8,
            mb: 4,
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h2" component="h1" gutterBottom fontWeight={700}>
                  Share Your World
                </Typography>
                <Typography variant="h5" component="p" gutterBottom sx={{ opacity: 0.9 }}>
                  Join thousands of videographers sharing their best moments
                </Typography>
                <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/register')}
                    sx={{
                      bgcolor: 'white',
                      color: 'primary.main',
                      '&:hover': { bgcolor: 'grey.100' }
                    }}
                  >
                    Get Started
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/explore')}
                    sx={{ borderColor: 'white', color: 'white' }}
                  >
                    Explore Videos
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <VideoLibrary sx={{ fontSize: 120, opacity: 0.8 }} />
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
      )}

      <Container maxWidth="lg">
        {/* Welcome Message for Authenticated Users */}
        {isAuthenticated && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Welcome back, {user?.firstName}! 👋
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Discover new videos from the community
            </Typography>
          </Box>
        )}

        {/* Tabs */}
        <Box sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="photo tabs">
            <Tab 
              label="Latest" 
              icon={<Videocam />}
            />
            <Tab 
              label="Trending" 
              icon={<TrendingUp />}
            />
          </Tabs>
        </Box>

        {/* Videos Grid */}
        <InfiniteScroll
          dataLength={videos.length}
          next={loadMoreVideos}
          hasMore={hasMore}
          loader={
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {[...Array(6)].map((_, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <VideoSkeleton />
                </Grid>
              ))}
            </Grid>
          }
          endMessage={
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ textAlign: 'center', mt: 4, mb: 2 }}
            >
              You've seen all videos! 🎥
            </Typography>
          }
        >
          <Grid container spacing={3}>
            {videos.map((video) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={video._id}>
                <VideoCard video={video} />
              </Grid>
            ))}
          </Grid>
        </InfiniteScroll>

        {/* Loading State */}
        {(latestLoading || trendingLoading) && videos.length === 0 && (
          <Grid container spacing={3}>
            {[...Array(8)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <VideoSkeleton />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Empty State */}
        {!latestLoading && !trendingLoading && videos.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <VideoLibrary sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No videos found
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Be the first to share a video with the community!
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/upload')}
              sx={{ mt: 2 }}
            >
              Upload Video
            </Button>
          </Box>
        )}
      </Container>
    </>
  );
};

export default Home;
