import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Avatar,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tab,
  Tabs,
  Skeleton,
  Divider,
} from '@mui/material';
import {
  Edit,
  Settings,
  PlayCircleOutline,
  VideoLibrary,
  Favorite,
  Visibility,
} from '@mui/icons-material';
import VideoThumbnail from '../../components/Video/VideoThumbnail';
import CreatorDashboard from '../../components/Creator/CreatorDashboard';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import { videoService } from '../../services/videos';
import { userService } from '../../services/users';
import { useAuth } from '../../contexts/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  // Fetch user's videos (including private ones for owner)
  const { data: videosData, isLoading: videosLoading } = useQuery(
    ['videos', 'user', user?._id],
    () => videoService.getUserVideos(user?._id, { 
      limit: 100, 
      visibility: 'all', // Gets both public and private for owner
      includePrivate: true 
    }),
    {
      enabled: !!user?._id,
    }
  );

  // Fetch user stats
  const { data: statsData, isLoading: statsLoading } = useQuery(
    ['userStats', user?._id],
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

  const filteredVideos = videos.filter(video => {
    switch (tabValue) {
      case 0: return true; // All videos
      case 1: return video.visibility === 'public';
      case 2: return video.visibility === 'private';
      default: return true;
    }
  });

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
          <Chip 
            label={video.visibility} 
            size="small" 
            color={video.visibility === 'public' ? 'success' : video.visibility === 'private' ? 'error' : 'warning'}
            variant="outlined"
          />
          
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Skeleton variant="rectangular" width={60} height={24} />
          <Skeleton variant="text" width="30%" />
        </Box>
      </CardContent>
    </Card>
  );

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5">Please log in to view your profile</Typography>
        <Button variant="contained" onClick={() => navigate('/login')} sx={{ mt: 2 }}>
          Login
        </Button>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Profile - Pluto</title>
        <meta name="description" content="View and manage your Pluto profile" />
      </Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Creator Dashboard - Only for Creators */}
        {user?.role === 'Creator' && (
          <CreatorDashboard stats={stats} videos={videos} />
        )}

        {/* Profile Header */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Avatar
                  src={user.avatar?.url}
                  sx={{ width: 120, height: 120 }}
                >
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </Avatar>
              </Grid>
              
              <Grid item xs>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h3" fontWeight={700}>
                    {user.firstName} {user.lastName}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={() => navigate('/profile/edit')}
                    >
                      Edit Profile
                    </Button>
                    <IconButton onClick={() => navigate('/profile/edit')}>
                      <Settings />
                    </IconButton>
                  </Box>
                </Box>

                <Typography variant="h6" color="text.secondary" gutterBottom>
                  @{user.username}
                </Typography>

                <Chip 
                  label={user.role} 
                  color={user.role === 'Creator' ? 'primary' : 'secondary'}
                  sx={{ mb: 2 }}
                />

                {user.bio && (
                  <Typography variant="body1" paragraph>
                    {user.bio}
                  </Typography>
                )}

                {(user.location || user.website) && (
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    {user.location && (
                      <Typography variant="body2" color="text.secondary">
                        📍 {user.location}
                      </Typography>
                    )}
                    {user.website && (
                      <Typography 
                        variant="body2" 
                        color="primary" 
                        component="a" 
                        href={user.website}
                        target="_blank"
                        sx={{ textDecoration: 'none' }}
                      >
                        🔗 Website
                      </Typography>
                    )}
                  </Box>
                )}

                <Typography variant="caption" color="text.secondary">
                  Member since {user.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'Recently'}
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
            My Videos
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<PlayCircleOutline />}
            onClick={() => navigate('/upload')}
          >
            Upload Video
          </Button>
        </Box>

        {/* Video Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label={`All (${videos.length})`} />
            <Tab label={`Public (${videos.filter(v => v.visibility === 'public').length})`} />
            <Tab label={`Private (${videos.filter(v => v.visibility === 'private').length})`} />
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
        ) : filteredVideos.length > 0 ? (
          <Grid container spacing={3}>
            {filteredVideos.map((video) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={video._id}>
                <VideoCard video={video} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <VideoLibrary sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              {tabValue === 0 ? 'No videos yet' : 
               tabValue === 1 ? 'No public videos' : 'No private videos'}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {user.role === 'Creator' 
                ? 'Start sharing your creativity with the community!'
                : 'Upgrade to a Creator account to start uploading videos.'
              }
            </Typography>
            {user.role === 'Creator' ? (
              <Button
                variant="contained"
                startIcon={<PlayCircleOutline />}
                onClick={() => navigate('/upload')}
              >
                Upload Your First Video
              </Button>
            ) : (
              <Button
                variant="outlined"
                onClick={() => navigate('/profile/edit')}
              >
                Upgrade Account
              </Button>
            )}
          </Box>
        )}
      </Container>
    </>
  );
};

export default Profile;
