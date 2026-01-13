import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  Visibility,
  Favorite,
  Comment,
  VideoLibrary,
} from '@mui/icons-material';

const CreatorDashboard = ({ stats, videos }) => {
  // Calculate analytics from video data
  const totalViews = stats?.totalViews || 0;
  const totalLikes = stats?.totalLikes || 0;
  const totalComments = stats?.totalComments || 0;
  const totalVideos = videos?.length || 0;
  const publicVideos = videos?.filter(v => v.visibility === 'public').length || 0;
  const privateVideos = videos?.filter(v => v.visibility === 'private').length || 0;

  // Recent performance metrics
  const avgViewsPerVideo = totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0;
  const avgLikesPerVideo = totalVideos > 0 ? Math.round(totalLikes / totalVideos) : 0;

  const StatCard = ({ icon, title, value, subtitle, color = 'primary' }) => (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent sx={{ textAlign: 'center', py: 3 }}>
        <Box sx={{ color: `${color}.main`, mb: 2 }}>
          {icon}
        </Box>
        <Typography variant="h4" fontWeight="bold" color={`${color}.main`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const PerformanceBar = ({ label, value, max, color = 'primary' }) => (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" fontWeight="medium">
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {value.toLocaleString()}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={max > 0 ? Math.min((value / max) * 100, 100) : 0}
        color={color}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );

  return (
    <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold">
            Creator Dashboard
          </Typography>
          <Chip
            icon={<TrendingUp />}
            label="Analytics Overview"
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
        </Box>

        {/* Key Metrics Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<VideoLibrary sx={{ fontSize: 40 }} />}
              title="Total Videos"
              value={totalVideos}
              subtitle={`${publicVideos} public, ${privateVideos} private`}
              color="info"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<Visibility sx={{ fontSize: 40 }} />}
              title="Total Views"
              value={totalViews}
              subtitle={`${avgViewsPerVideo} avg per video`}
              color="success"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<Favorite sx={{ fontSize: 40 }} />}
              title="Total Likes"
              value={totalLikes}
              subtitle={`${avgLikesPerVideo} avg per video`}
              color="error"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<Comment sx={{ fontSize: 40 }} />}
              title="Comments"
              value={totalComments}
              subtitle="Total engagement"
              color="warning"
            />
          </Grid>
        </Grid>

        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', mb: 3 }} />

        {/* Performance Metrics */}
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
          Content Performance
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Engagement Metrics</Typography>
              <PerformanceBar 
                label="Views" 
                value={totalViews} 
                max={Math.max(totalViews * 1.2, 1000)}
                color="success"
              />
              <PerformanceBar 
                label="Likes" 
                value={totalLikes} 
                max={Math.max(totalLikes * 1.5, 100)}
                color="error"
              />
              <PerformanceBar 
                label="Comments" 
                value={totalComments} 
                max={Math.max(totalComments * 2, 50)}
                color="warning"
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Content Distribution</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2">Public Videos</Typography>
                <Chip label={publicVideos} size="small" sx={{ bgcolor: 'rgba(76, 175, 80, 0.3)', color: 'white' }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2">Private Videos</Typography>
                <Chip label={privateVideos} size="small" sx={{ bgcolor: 'rgba(255, 193, 7, 0.3)', color: 'white' }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2">Average Performance</Typography>
                <Typography variant="body2">{avgViewsPerVideo} views/video</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default CreatorDashboard;
