import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Avatar,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Tab,
  Tabs,
  Skeleton,
  Divider,
  Alert,
} from '@mui/material';
import {
  PersonAdd,
  VideoLibrary,
  Favorite,
  Visibility,
  LocationOn,
  Link as LinkIcon,
  Instagram,
  Twitter,
} from '@mui/icons-material';
import VideoThumbnail from '../../components/Video/VideoThumbnail';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import { videoService } from '../../services/videos';
import { userService } from '../../services/users';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const UserProfile = () => {
  const { username } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  // Fetch user by username
  const { data: usersData, isLoading: userLoading, error: userError } = useQuery(
    ['users', 'search', username],
    () => userService.searchUsers(username, { limit: 1 }),
    {
      enabled: !!username,
      retry: (failureCount, error) => {
        if (error.response?.status === 404) return false;
        return failureCount < 2;
      }
    }
  );

  const user = usersData?.data?.users?.[0];

  // Fetch user's videos (only public videos for other users)
  const { data: videosData, isLoading: videosLoading } = useQuery(
    ['videos', 'user', user?._id],
    () => videoService.getUserVideos(user._id, { limit: 20, visibility: 'public' }),
    {
      enabled: !!user?._id,
    }
  );

  // Fetch user stats
  const { data: statsData, isLoading: statsLoading } = useQuery(
    ['user-videos', user?._id],
    () => userService.getUserStats(user?._id),
    {
      enabled: !!user?._id,
    }
  );

  const videos = videosData?.data.videos || [];
  const stats = statsData?.data.stats || user?.stats || {};

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to follow users');
      navigate('/login');
      return;
    }

    try {
      await userService.followUser(user._id);
      toast.success('User followed successfully');
    } catch (error) {
      toast.error('Failed to follow user');
    }
  };

  // Check if viewing own profile
  const isOwnProfile = currentUser && user && currentUser._id === user._id;

  // Check if profile is accessible
  const canViewProfile = !user?.preferences || user.preferences.publicProfile !== false || isOwnProfile;

  if (userError?.response?.status === 404 || (!userLoading && !user)) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          User Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          The user @{username} does not exist or has been deactivated.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Go Home
        </Button>
      </Container>
    );
  }

  if (userLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Skeleton variant="circular" width={120} height={120} />
              </Grid>
              <Grid item xs>
                <Skeleton variant="text" width="60%" height={60} />
                <Skeleton variant="text" width="40%" height={30} />
                <Skeleton variant="text" width="80%" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (!canViewProfile) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Alert severity="info">
          <Typography variant="h6" gutterBottom>
            Private Profile
          </Typography>
          <Typography variant="body2">
            This user has set their profile to private.
          </Typography>
        </Alert>
      </Container>
    );
  }

  // Redirect to own profile if viewing self
  if (isOwnProfile) {
    navigate('/profile', { replace: true });
    return null;
  }

  const VideoCard = ({ video }) => (
    <Card 
      sx={{ 
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme => theme.shadows[4],
        }
      }}
      onClick={() => navigate(`/video/${video._id}`)}
    >
      <VideoThumbnail
        thumbnailUrl={video.thumbnails?.poster?.url || video.thumbnails?.medium?.url || video.thumbnails?.[0]?.url}
        alt={video.title}
        height={200}
        onClick={() => navigate(`/video/${video._id}`)}
      />
      <CardContent sx={{ pb: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} noWrap>
          {video.title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Favorite color="action" fontSize="small" />
            <Typography variant="caption">{video.stats?.likesCount || 0}</Typography>
            <Visibility color="action" fontSize="small" />
            <Typography variant="caption">{video.stats?.viewsCount || 0}</Typography>
          </Box>
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {format(new Date(video.createdAt), 'MMM d, yyyy')}
        </Typography>
      </CardContent>
    </Card>
  );

  const VideoSkeleton = () => (
    <Card>
      <Skeleton variant="rectangular" height={200} />
      <CardContent>
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
      </CardContent>
    </Card>
  );

  return (
    <>
      <Helmet>
        <title>{user?.firstName} {user?.lastName} (@{user?.username}) - Pluto</title>
        <meta name="description" content={user?.bio || `View ${user?.firstName} ${user?.lastName}'s videos on Pluto`} />
      </Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Profile Header */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Avatar
                  src={user?.avatar?.url}
                  sx={{ width: 120, height: 120 }}
                >
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </Avatar>
              </Grid>
              
              <Grid item xs>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h3" fontWeight={700}>
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  
                  {isAuthenticated && !isOwnProfile && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        startIcon={<PersonAdd />}
                        onClick={handleFollow}
                      >
                        Follow
                      </Button>
                    </Box>
                  )}
                </Box>

                <Typography variant="h6" color="text.secondary" gutterBottom>
                  @{user?.username}
                </Typography>

                <Chip 
                  label={user?.role} 
                  color={user?.role === 'Creator' ? 'primary' : 'secondary'}
                  sx={{ mb: 2 }}
                />

                {user?.bio && (
                  <Typography variant="body1" paragraph>
                    {user.bio}
                  </Typography>
                )}

                {/* Contact Info */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  {user?.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {user.location}
                      </Typography>
                    </Box>
                  )}
                  
                  {user?.website && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LinkIcon fontSize="small" color="action" />
                      <Typography 
                        variant="body2" 
                        color="primary" 
                        component="a" 
                        href={user.website}
                        target="_blank"
                        sx={{ textDecoration: 'none' }}
                      >
                        Website
                      </Typography>
                    </Box>
                  )}
                  
                  {user?.socialLinks?.instagram && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Instagram fontSize="small" color="action" />
                      <Typography 
                        variant="body2" 
                        color="primary"
                        component="a"
                        href={`https://instagram.com/${user.socialLinks.instagram.replace('@', '')}`}
                        target="_blank"
                        sx={{ textDecoration: 'none' }}
                      >
                        {user.socialLinks.instagram}
                      </Typography>
                    </Box>
                  )}
                  
                  {user?.socialLinks?.twitter && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Twitter fontSize="small" color="action" />
                      <Typography 
                        variant="body2" 
                        color="primary"
                        component="a"
                        href={`https://twitter.com/${user.socialLinks.twitter.replace('@', '')}`}
                        target="_blank"
                        sx={{ textDecoration: 'none' }}
                      >
                        {user.socialLinks.twitter}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Member since {format(new Date(user?.createdAt), 'MMMM yyyy')}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Stats */}
            <Grid container spacing={4} sx={{ textAlign: 'center' }}>
              <Grid item xs={6} sm={3}>
                <Typography variant="h4" fontWeight={700} color="primary.main">
                  {statsLoading ? <Skeleton width={60} /> : (stats.videosCount || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Videos
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="h4" fontWeight={700} color="error.main">
                  {statsLoading ? <Skeleton width={60} /> : (stats.totalLikes || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Likes
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="h4" fontWeight={700} color="info.main">
                  {statsLoading ? <Skeleton width={60} /> : (stats.totalViews || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Views
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {statsLoading ? <Skeleton width={60} /> : (stats.followersCount || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Followers
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Videos Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight={600}>
            {user?.firstName}'s Videos
          </Typography>
        </Box>

        {/* Video Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label={`All Public Videos (${videos.length})`} />
          </Tabs>
        </Box>

        {/* Videos Grid */}
        {videosLoading ? (
          <Grid container spacing={3}>
            {[...Array(6)].map((_, index) => (
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
            <VideoLibrary sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No public videos
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user?.firstName} hasn't shared any public videos yet.
            </Typography>
          </Box>
        )}
      </Container>
    </>
  );
};

export default UserProfile;
