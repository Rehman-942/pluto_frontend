import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  TextField,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardMedia,
  CardContent,
  Avatar,
  IconButton,
  Skeleton,
  Fab,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList,
  GridView,
  ViewList,
  FavoriteOutlined,
  Favorite,
  Visibility,
  Comment,
  Add,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Helmet } from 'react-helmet-async';
import { videoService } from '../services/videos';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Explore = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [photos, setPhotos] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: searchParams.get('q') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc',
    tags: searchParams.get('tags')?.split(',').filter(Boolean) || [],
  });
  const [viewMode, setViewMode] = useState('grid');

  const { data: photosData, isLoading, refetch } = useQuery(
    ['photos', 'explore', page, filters],
    () => videoService.getVideos({
      page,
      limit: 20,
      search: filters.search,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      tags: filters.tags.join(','),
    }),
    {
      keepPreviousData: true,
    }
  );

  useEffect(() => {
    if (photosData?.data.photos) {
      if (page === 1) {
        setPhotos(photosData.data.photos);
      } else {
        setPhotos(prev => [...prev, ...photosData.data.photos]);
      }
      setHasMore(photosData.data.pagination.hasMore);
    }
  }, [photosData, page]);

  useEffect(() => {
    // Reset pagination when filters change
    setPage(1);
    setPhotos([]);
    setHasMore(true);
  }, [filters]);

  const loadMorePhotos = () => {
    setPage(prev => prev + 1);
  };

  const handleSearch = (searchValue) => {
    const newFilters = { ...filters, search: searchValue };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handleTagFilter = (tag) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    handleFilterChange('tags', newTags);
  };

  const updateURL = (newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.search) params.set('q', newFilters.search);
    if (newFilters.sortBy !== 'createdAt') params.set('sortBy', newFilters.sortBy);
    if (newFilters.sortOrder !== 'desc') params.set('sortOrder', newFilters.sortOrder);
    if (newFilters.tags.length > 0) params.set('tags', newFilters.tags.join(','));
    
    setSearchParams(params);
  };

  const handleLike = async (photoId) => {
    if (!isAuthenticated) {
      toast.error('Please log in to like photos');
      navigate('/login');
      return;
    }

    try {
      const response = await videoService.likePhoto(photoId);
      
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

  const PhotoCard = ({ photo, isListView = false }) => (
    <Card 
      sx={{ 
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme => theme.shadows[8],
        },
        ...(isListView && { 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          height: 'auto',
        })
      }}
      onClick={() => navigate(`/photo/${photo._id}`)}
    >
      <CardMedia
        component="img"
        height={isListView ? "200" : "250"}
        image={photo.images?.medium?.url || photo.images?.original?.url}
        alt={photo.title}
        sx={{ 
          objectFit: 'cover',
          ...(isListView && { 
            width: { xs: '100%', sm: 300 },
            height: { xs: 200, sm: 'auto' }
          })
        }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" fontWeight={600} noWrap>
          {photo.title}
        </Typography>
        
        {photo.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              display: '-webkit-box',
              WebkitLineClamp: isListView ? 3 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mt: 1
            }}
          >
            {photo.description}
          </Typography>
        )}

        {/* Tags */}
        {photo.tags && photo.tags.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {photo.tags.slice(0, isListView ? 5 : 3).map((tag, index) => (
              <Chip 
                key={index} 
                label={`#${tag}`} 
                size="small" 
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTagFilter(tag);
                }}
                color={filters.tags.includes(tag) ? 'primary' : 'default'}
              />
            ))}
          </Box>
        )}

        {/* Creator and Stats */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
            <Typography variant="body2" fontWeight={500}>
              {photo.creatorId?.firstName} {photo.creatorId?.lastName}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
            
            <Visibility fontSize="small" color="action" />
            <Typography variant="caption">{photo.stats?.viewsCount || 0}</Typography>
            
            <Comment fontSize="small" color="action" />
            <Typography variant="caption">{photo.stats?.commentsCount || 0}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const PhotoSkeleton = ({ isListView = false }) => (
    <Card sx={{ ...(isListView && { display: 'flex', height: 200 }) }}>
      <Skeleton variant="rectangular" height={isListView ? 200 : 250} width={isListView ? 300 : '100%'} />
      <CardContent sx={{ flexGrow: 1 }}>
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </CardContent>
    </Card>
  );

  return (
    <>
      <Helmet>
        <title>Explore Photos - Pluto</title>
        <meta name="description" content="Explore and discover amazing photos from our community" />
      </Helmet>

      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ py: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
            Explore Photos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Discover amazing photos from our creative community
          </Typography>
        </Box>

        {/* Search and Filters */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            {/* Search */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search photos..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>

            {/* Sort */}
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={filters.sortBy}
                  label="Sort By"
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <MenuItem value="createdAt">Latest</MenuItem>
                  <MenuItem value="likesCount">Most Liked</MenuItem>
                  <MenuItem value="viewsCount">Most Viewed</MenuItem>
                  <MenuItem value="title">Title</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Order */}
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Order</InputLabel>
                <Select
                  value={filters.sortOrder}
                  label="Order"
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                >
                  <MenuItem value="desc">Descending</MenuItem>
                  <MenuItem value="asc">Ascending</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* View Mode */}
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton 
                  onClick={() => setViewMode('grid')}
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                >
                  <GridView />
                </IconButton>
                <IconButton 
                  onClick={() => setViewMode('list')}
                  color={viewMode === 'list' ? 'primary' : 'default'}
                >
                  <ViewList />
                </IconButton>
              </Box>
            </Grid>
          </Grid>

          {/* Active Tags */}
          {filters.tags.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ alignSelf: 'center', mr: 1 }}>
                Active filters:
              </Typography>
              {filters.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={`#${tag}`}
                  color="primary"
                  variant="filled"
                  size="small"
                  onDelete={() => handleTagFilter(tag)}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Photos */}
        <InfiniteScroll
          dataLength={photos.length}
          next={loadMorePhotos}
          hasMore={hasMore}
          loader={
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {[...Array(6)].map((_, index) => (
                <Grid item xs={12} sm={viewMode === 'list' ? 12 : 6} md={viewMode === 'list' ? 12 : 4} key={index}>
                  <PhotoSkeleton isListView={viewMode === 'list'} />
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
              <Grid 
                item 
                xs={12} 
                sm={viewMode === 'list' ? 12 : 6} 
                md={viewMode === 'list' ? 12 : 4} 
                lg={viewMode === 'list' ? 12 : 3} 
                key={photo._id}
              >
                <PhotoCard photo={photo} isListView={viewMode === 'list'} />
              </Grid>
            ))}
          </Grid>
        </InfiniteScroll>

        {/* Loading State */}
        {isLoading && photos.length === 0 && (
          <Grid container spacing={3}>
            {[...Array(12)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <PhotoSkeleton />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Empty State */}
        {!isLoading && photos.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No photos found
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Try adjusting your search criteria or explore different tags
            </Typography>
          </Box>
        )}

        {/* Upload FAB for Creators */}
        {user?.role === 'Creator' && (
          <Fab
            color="primary"
            sx={{ position: 'fixed', bottom: 24, right: 24 }}
            onClick={() => navigate('/upload')}
          >
            <Add />
          </Fab>
        )}
      </Container>
    </>
  );
};

export default Explore;
