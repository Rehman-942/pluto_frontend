import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Card,
  CardMedia,
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
  PhotoCamera,
  Explore,
} from '@mui/icons-material';
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
  const [photos, setPhotos] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const { data: latestPhotos, isLoading: latestLoading } = useQuery(
    ['photos', 'latest', page],
    () => videoService.getVideos({ page, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' }),
    {
      enabled: tabValue === 0,
      keepPreviousData: true,
    }
  );

  const { data: trendingPhotos, isLoading: trendingLoading } = useQuery(
    ['photos', 'trending', page],
    () => videoService.getTrendingPhotos({ page, limit: 20, timeframe: '7d' }),
    {
      enabled: tabValue === 1,
      keepPreviousData: true,
    }
  );

  useEffect(() => {
    if (tabValue === 0 && latestPhotos?.data.photos) {
      if (page === 1) {
        setPhotos(latestPhotos.data.photos);
      } else {
        setPhotos(prev => [...prev, ...latestPhotos.data.photos]);
      }
      setHasMore(latestPhotos.data.pagination.hasMore);
    }
  }, [latestPhotos, tabValue, page]);

  useEffect(() => {
    if (tabValue === 1 && trendingPhotos?.data.photos) {
      if (page === 1) {
        setPhotos(trendingPhotos.data.photos);
      } else {
        setPhotos(prev => [...prev, ...trendingPhotos.data.photos]);
      }
      setHasMore(trendingPhotos.data.pagination.hasMore);
    }
  }, [trendingPhotos, tabValue, page]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(1);
    setPhotos([]);
    setHasMore(true);
  };

  const loadMorePhotos = () => {
    setPage(prev => prev + 1);
  };

  const handleLike = async (photoId) => {
    if (!isAuthenticated) {
      toast.error('Please log in to like photos');
      navigate('/login');
      return;
    }

    try {
      const response = await videoService.likeVideo(photoId);
      
      // Update local state
      setPhotos(prev => prev.map(photo => {
        if (photo._id === photoId) {
          return {
            ...photo,
            isLiked: !photo.isLiked,
            stats: {
              ...photo.stats,
              likesCount: photo.isLiked 
                ? photo.stats.likesCount - 1 
                : photo.stats.likesCount + 1
            }
          };
        }
        return photo;
      }));
    } catch (error) {
      toast.error('Failed to like photo');
    }
  };

  const PhotoCard = ({ photo }) => (
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
      onClick={() => navigate(`/photo/${photo._id}`)}
    >
      <CardMedia
        component="img"
        height={isMobile ? "200" : "240"}
        image={photo.images?.medium?.url || photo.images?.original?.url}
        alt={photo.title}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ pb: 1 }}>
        <Typography variant="subtitle1" fontWeight={600} noWrap>
          {photo.title}
        </Typography>
        
        {photo.description && (
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
            {photo.description}
          </Typography>
        )}

        {/* Tags */}
        {photo.tags && photo.tags.length > 0 && (
          <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {photo.tags.slice(0, 3).map((tag, index) => (
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
            {photo.tags.length > 3 && (
              <Typography variant="caption" color="text.secondary">
                +{photo.tags.length - 3} more
              </Typography>
            )}
          </Box>
        )}

        {/* Creator Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
          <Avatar 
            src={photo.creatorId?.avatar?.url} 
            sx={{ width: 32, height: 32, mr: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/user/${photo.creatorId?.username}`);
            }}
          >
            {photo.creatorId?.firstName?.[0]}
          </Avatar>
          <Typography 
            variant="body2" 
            fontWeight={500}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/user/${photo.creatorId?.username}`);
            }}
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
          >
            {photo.creatorId?.firstName} {photo.creatorId?.lastName}
          </Typography>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleLike(photo._id);
              }}
              color={photo.isLiked ? 'error' : 'default'}
            >
              {photo.isLiked ? <Favorite /> : <FavoriteOutlined />}
            </IconButton>
            <Typography variant="caption">{photo.stats?.likesCount || 0}</Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Visibility fontSize="small" color="action" />
              <Typography variant="caption">{photo.stats?.viewsCount || 0}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Comment fontSize="small" color="action" />
              <Typography variant="caption">{photo.stats?.commentsCount || 0}</Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const PhotoSkeleton = () => (
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
        <title>Pluto - Discover Amazing Photos</title>
        <meta name="description" content="Discover and share amazing photos with Pluto community" />
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
                  Join thousands of photographers sharing their best moments
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
                    Explore Photos
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <PhotoCamera sx={{ fontSize: 120, opacity: 0.8 }} />
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
              Discover new photos from the community
            </Typography>
          </Box>
        )}

        {/* Tabs */}
        <Box sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="photo tabs">
            <Tab 
              label="Latest" 
              icon={<PhotoCamera />} 
              iconPosition="start"
            />
            <Tab 
              label="Trending" 
              icon={<TrendingUp />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Photos Grid */}
        <InfiniteScroll
          dataLength={photos.length}
          next={loadMorePhotos}
          hasMore={hasMore}
          loader={
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {[...Array(6)].map((_, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <PhotoSkeleton />
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
              You've seen all photos! 📸
            </Typography>
          }
        >
          <Grid container spacing={3}>
            {photos.map((photo) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={photo._id}>
                <PhotoCard photo={photo} />
              </Grid>
            ))}
          </Grid>
        </InfiniteScroll>

        {/* Loading State */}
        {(latestLoading || trendingLoading) && photos.length === 0 && (
          <Grid container spacing={3}>
            {[...Array(8)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <PhotoSkeleton />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Empty State */}
        {!latestLoading && !trendingLoading && photos.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Explore sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No photos found
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Be the first to share a photo with the community!
            </Typography>
            {user?.role === 'Creator' && (
              <Button
                variant="contained"
                onClick={() => navigate('/upload')}
                sx={{ mt: 2 }}
              >
                Upload Photo
              </Button>
            )}
          </Box>
        )}
      </Container>
    </>
  );
};

export default Home;
