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
  Tab,
  Tabs,
  Skeleton,
  Divider,
  CardMedia,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Edit,
  Settings,
  PlayCircleOutline,
  VideoLibrary,
  Favorite,
  Visibility,
  CloudUpload,
  MoreVert,
  Delete,
  Close,
} from '@mui/icons-material';
import VideoThumbnail from '../../components/Video/VideoThumbnail';
import CreatorDashboard from '../../components/Creator/CreatorDashboard';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import { videoService } from '../../services/videos';
import { userService } from '../../services/users';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', visibility: '' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ mouseX: null, mouseY: null });
  const queryClient = useQueryClient();

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
  const stats = statsData?.data?.data?.stats || {};

  console.log('=== PROFILE.JS DEBUG FIXED ===');
  console.log('Raw statsData:', statsData);
  console.log('Correct path data:', statsData?.data?.data);
  console.log('Extracted stats:', stats);
  console.log('Stats structure:', {
    totalViews: stats.totalViews,
    totalLikes: stats.totalLikes,
    totalComments: stats.totalComments
  });

  // Edit video mutation
  const editVideoMutation = useMutation(
    ({ videoId, videoData }) => videoService.updateVideo(videoId, videoData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['videos', 'user', user?._id]);
        queryClient.invalidateQueries(['userStats', user?._id]);
        setEditDialogOpen(false);
        setSelectedVideo(null);
        setEditForm({ title: '', description: '', visibility: '' });
        toast.success('Video updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update video');
      }
    }
  );

  // Delete video mutation
  const deleteVideoMutation = useMutation(
    (videoId) => videoService.deleteVideo(videoId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['videos', 'user', user?._id]);
        queryClient.invalidateQueries(['userStats', user?._id]);
        setDeleteDialogOpen(false);
        setSelectedVideo(null);
        toast.success('Video deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete video');
      }
    }
  );

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

  // Handler functions
  const handleMenuOpen = (event, video) => {
    const rect = event.currentTarget.getBoundingClientRect();
    console.log('Menu open clicked, button position:', rect);
    
    setMenuPosition({
      mouseX: rect.left,
      mouseY: rect.bottom
    });
    setAnchorEl(null); // Clear anchorEl to use coordinates instead
    setSelectedVideo(video);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuPosition({ mouseX: null, mouseY: null });
    // Don't clear selectedVideo immediately to prevent null errors
  };

  const handleEditOpen = () => {
    if (selectedVideo) {
      setEditForm({
        title: selectedVideo.title,
        description: selectedVideo.description,
        visibility: selectedVideo.visibility
      });
      setEditDialogOpen(true);
      setAnchorEl(null); // Close menu but keep selectedVideo
    }
  };

  const handleEditSave = () => {
    editVideoMutation.mutate({
      videoId: selectedVideo._id,
      videoData: editForm
    });
  };

  const handleDeleteOpen = () => {
    setDeleteDialogOpen(true);
    setAnchorEl(null); // Close menu but keep selectedVideo
  };

  const handleDeleteConfirm = () => {
    if (selectedVideo && selectedVideo._id) {
      deleteVideoMutation.mutate(selectedVideo._id);
    }
  };

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
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
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
            
            {/* Edit/Delete Menu Button */}
            <IconButton 
              size="small"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Button clicked, target:', e.currentTarget);
                handleMenuOpen(e, video);
              }}
              ref={(el) => {
                if (el && selectedVideo?._id === video._id) {
                  console.log('Setting anchor element:', el);
                }
              }}
              aria-controls={anchorEl ? 'video-menu' : undefined}
              aria-haspopup="true"
            >
              <MoreVert fontSize="small" />
            </IconButton>
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

        {/* Edit/Delete Menu */}
        <Menu
          anchorReference="anchorPosition"
          anchorPosition={
            menuPosition.mouseY !== null && menuPosition.mouseX !== null
              ? { top: menuPosition.mouseY, left: menuPosition.mouseX }
              : undefined
          }
          open={menuPosition.mouseY !== null && menuPosition.mouseX !== null}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEditOpen}>
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Edit Video
          </MenuItem>
          <MenuItem onClick={handleDeleteOpen} sx={{ color: 'error.main' }}>
            <Delete fontSize="small" sx={{ mr: 1 }} />
            Delete Video
          </MenuItem>
        </Menu>

        {/* Edit Video Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Edit Video
            <IconButton
              onClick={() => setEditDialogOpen(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <TextField
              fullWidth
              label="Title"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Visibility</InputLabel>
              <Select
                value={editForm.visibility}
                label="Visibility"
                onChange={(e) => setEditForm({ ...editForm, visibility: e.target.value })}
              >
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="unlisted">Unlisted</MenuItem>
                <MenuItem value="private">Private</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleEditSave} 
              variant="contained"
              disabled={editVideoMutation.isLoading}
            >
              {editVideoMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Video</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{selectedVideo?.title}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleDeleteConfirm} 
              variant="contained"
              color="error"
              disabled={deleteVideoMutation.isLoading}
            >
              {deleteVideoMutation.isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default Profile;
