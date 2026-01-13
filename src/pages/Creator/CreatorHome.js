import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Paper,
} from '@mui/material';
import {
  TrendingUp,
  VideoLibrary,
  CloudUpload,
  Settings,
  Analytics,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { Helmet } from 'react-helmet-async';
import { videoService } from '../../services/videos';
import { userService } from '../../services/users';
import { useAuth } from '../../contexts/AuthContext';
import CreatorDashboard from '../../components/Creator/CreatorDashboard';

const CreatorHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch user's videos
  const { data: videosData, isLoading: videosLoading } = useQuery(
    ['videos', 'user', user?._id],
    () => videoService.getUserVideos(user?._id, { 
      limit: 100, 
      visibility: 'all',
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
  const stats = statsData?.data?.data?.stats || {};

  const quickActions = [
    {
      title: 'Upload Video',
      description: 'Share your latest content',
      icon: <CloudUpload sx={{ fontSize: 40 }} />,
      action: () => navigate('/upload'),
      color: 'primary',
    },
    {
      title: 'View Profile',
      description: 'Manage your profile',
      icon: <Settings sx={{ fontSize: 40 }} />,
      action: () => navigate('/profile'),
      color: 'secondary',
    },
    {
      title: 'Analytics',
      description: 'Deep dive into stats',
      icon: <Analytics sx={{ fontSize: 40 }} />,
      action: () => navigate('/profile'),
      color: 'success',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Creator Dashboard - Pluto</title>
        <meta name="description" content="Manage your content and track performance" />
      </Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Welcome Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
            Welcome back, {user?.firstName}! 👋
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Here's how your content is performing today
          </Typography>
        </Box>

        {/* Creator Dashboard Stats */}
        <CreatorDashboard stats={stats} videos={videos} />

        {/* Quick Actions */}
        <Paper sx={{ p: 4, mt: 4 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
            Quick Actions
          </Typography>
          
          <Grid container spacing={3}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    }
                  }}
                  onClick={action.action}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Box sx={{ color: `${action.color}.main`, mb: 2 }}>
                      {action.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {action.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {action.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Recent Activity */}
        <Paper sx={{ p: 4, mt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight={600}>
              Recent Videos
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<VideoLibrary />}
              onClick={() => navigate('/profile')}
            >
              View All
            </Button>
          </Box>

          {videos.length > 0 ? (
            <Grid container spacing={2}>
              {videos.slice(0, 3).map((video) => (
                <Grid item xs={12} sm={6} md={4} key={video._id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" noWrap gutterBottom>
                        {video.title}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {video.views?.length || 0} views
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {video.likes?.length || 0} likes
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <VideoLibrary sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No videos yet
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Start sharing your creativity with the community!
              </Typography>
              <Button
                variant="contained"
                startIcon={<CloudUpload />}
                onClick={() => navigate('/upload')}
              >
                Upload Your First Video
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </>
  );
};

export default CreatorHome;
