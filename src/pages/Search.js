import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Avatar,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Skeleton,
} from '@mui/material';
import {
  Search as SearchIcon,
  FavoriteOutlined,
  Favorite,
  Visibility,
  Person,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { Helmet } from 'react-helmet-async';
import { videoService } from '../services/videos';
import { userService } from '../services/users';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Search = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState(0);

  const { data: photosData, isLoading: photosLoading } = useQuery(
    ['search', 'photos', query],
    () => videoService.searchVideos(query, { limit: 50 }),
    {
      enabled: !!query && activeTab === 0,
    }
  );

  const { data: usersData, isLoading: usersLoading } = useQuery(
    ['search', 'users', query],
    () => userService.searchUsers(query, { limit: 50 }),
    {
      enabled: !!query && activeTab === 1,
    }
  );

  useEffect(() => {
    const searchQuery = searchParams.get('q');
    if (searchQuery) {
      setQuery(searchQuery);
    }
  }, [searchParams]);

  const handleSearch = (searchValue) => {
    setQuery(searchValue);
    if (searchValue.trim()) {
      setSearchParams({ q: searchValue.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleLike = async (photoId) => {
    if (!isAuthenticated) {
      toast.error('Please log in to like photos');
      navigate('/login');
      return;
    }

    try {
      const response = await videoService.likeVideo(photoId);
      // The query will refetch automatically due to React Query
    } catch (error) {
      toast.error('Failed to like photo');
    }
  };

  const PhotoResultCard = ({ photo }) => (
    <Card 
      sx={{ 
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme => theme.shadows[4],
        }
      }}
      onClick={() => navigate(`/photo/${photo._id}`)}
    >
      <CardMedia
        component="img"
        height="200"
        image={photo.images?.medium?.url || photo.images?.original?.url}
        alt={photo.title}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent>
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

        {/* Creator */}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 1 }}>
          <Avatar 
            src={photo.creatorId?.avatar?.url} 
            sx={{ width: 24, height: 24, mr: 1 }}
          >
            {photo.creatorId?.firstName?.[0]}
          </Avatar>
          <Typography variant="caption">
            {photo.creatorId?.firstName} {photo.creatorId?.lastName}
          </Typography>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleLike(photo._id);
              }}
              color={photo.isLiked ? 'error' : 'default'}
            >
              {photo.isLiked ? <Favorite fontSize="small" /> : <FavoriteOutlined fontSize="small" />}
            </IconButton>
            <Typography variant="caption">{photo.stats?.likesCount || 0}</Typography>
            
            <Visibility fontSize="small" color="action" />
            <Typography variant="caption">{photo.stats?.viewsCount || 0}</Typography>
          </Box>

          {/* Tags */}
          {photo.tags && photo.tags.length > 0 && (
            <Chip 
              label={`#${photo.tags[0]}`} 
              size="small" 
              variant="outlined"
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const UserResultCard = ({ user: searchUser }) => (
    <Card 
      sx={{ 
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme => theme.shadows[4],
        }
      }}
      onClick={() => navigate(`/user/${searchUser.username}`)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            src={searchUser.avatar?.url} 
            sx={{ width: 60, height: 60, mr: 2 }}
          >
            {searchUser.firstName?.[0]}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              {searchUser.firstName} {searchUser.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              @{searchUser.username}
            </Typography>
            <Chip 
              label={searchUser.role} 
              size="small" 
              color={searchUser.role === 'Creator' ? 'primary' : 'secondary'}
              sx={{ mt: 0.5 }}
            />
          </Box>
        </Box>

        {searchUser.bio && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 2
            }}
          >
            {searchUser.bio}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Typography variant="caption">
            <strong>{searchUser.stats?.photosCount || 0}</strong> Photos
          </Typography>
          <Typography variant="caption">
            <strong>{searchUser.stats?.followersCount || 0}</strong> Followers
          </Typography>
          <Typography variant="caption">
            <strong>{searchUser.stats?.totalLikes || 0}</strong> Likes
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  const ResultSkeleton = () => (
    <Card>
      <Skeleton variant="rectangular" height={200} />
      <CardContent>
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="text" width="40%" sx={{ ml: 1 }} />
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Helmet>
        <title>{query ? `Search: ${query}` : 'Search'} - Pluto</title>
        <meta name="description" content="Search for photos and users on Pluto" />
      </Helmet>

      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ py: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
            Search
          </Typography>
          
          {/* Search Input */}
          <TextField
            fullWidth
            placeholder="Search for photos, users, or tags..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            sx={{ maxWidth: 600 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {query && (
          <>
            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab 
                  label={`Photos ${photosData ? `(${photosData.data.photos?.length || 0})` : ''}`}
                  icon={<SearchIcon />}
                />
                <Tab 
                  label={`Users ${usersData ? `(${usersData.data.users?.length || 0})` : ''}`}
                  icon={<Person />}
                />
              </Tabs>
            </Box>

            {/* Results */}
            {activeTab === 0 && (
              <>
                {photosLoading ? (
                  <Grid container spacing={3}>
                    {[...Array(8)].map((_, index) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                        <ResultSkeleton />
                      </Grid>
                    ))}
                  </Grid>
                ) : photosData?.data.photos?.length > 0 ? (
                  <Grid container spacing={3}>
                    {photosData.data.photos.map((photo) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={photo._id}>
                        <PhotoResultCard photo={photo} />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                      No photos found
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Try searching with different keywords or tags
                    </Typography>
                  </Box>
                )}
              </>
            )}

            {activeTab === 1 && (
              <>
                {usersLoading ? (
                  <Grid container spacing={3}>
                    {[...Array(6)].map((_, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Skeleton variant="circular" width={60} height={60} />
                              <Box sx={{ ml: 2, flexGrow: 1 }}>
                                <Skeleton variant="text" width="60%" />
                                <Skeleton variant="text" width="40%" />
                              </Box>
                            </Box>
                            <Skeleton variant="text" />
                            <Skeleton variant="text" width="80%" />
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : usersData?.data.users?.length > 0 ? (
                  <Grid container spacing={3}>
                    {usersData.data.users.map((searchUser) => (
                      <Grid item xs={12} sm={6} md={4} key={searchUser._id}>
                        <UserResultCard user={searchUser} />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                      No users found
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Try searching with different usernames or names
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </>
        )}

        {!query && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Start Searching
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enter keywords to find photos and users
            </Typography>
          </Box>
        )}
      </Container>
    </>
  );
};

export default Search;
