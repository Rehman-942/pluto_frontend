import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Save,
  Cancel,
  Add,
  Delete,
  PlayArrow,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Helmet } from 'react-helmet-async';
import { videoService } from '../../services/videos';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const VideoEdit = () => {
  const { id } = useParams();
  const { canPerformAction } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      visibility: 'public',
    },
  });

  // Fetch video data
  const { data: videoData, isLoading, error } = useQuery(
    ['video', id],
    () => videoService.getVideo(id),
    {
      enabled: !!id,
      onSuccess: (data) => {
        const video = data.data.video;
        setValue('title', video.title);
        setValue('description', video.description || '');
        setValue('visibility', video.visibility);
        setTags(video.tags || []);
      },
      retry: (failureCount, error) => {
        if (error.response?.status === 404) return false;
        return failureCount < 2;
      }
    }
  );

  // Update mutation
  const updateMutation = useMutation(
    (updateData) => videoService.updateVideo(id, updateData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['video', id]);
        queryClient.invalidateQueries('videos');
        toast.success('Video updated successfully!');
        navigate(`/video/${id}`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update video');
      },
    }
  );

  const video = videoData?.data.video;

  useEffect(() => {
    if (error?.response?.status === 404) {
      navigate('/404');
    }
  }, [error, navigate]);

  // Check if user can edit this video
  useEffect(() => {
    if (video && !canPerformAction('edit', video)) {
      toast.error('You do not have permission to edit this video');
      navigate(`/video/${id}`);
    }
  }, [video, canPerformAction, navigate, id]);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const onSubmit = (data) => {
    const updateData = {
      ...data,
      tags,
    };

    updateMutation.mutate(updateData);
  };

  const handleCancel = () => {
    if (isDirty || tags.join(',') !== (video?.tags || []).join(',')) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate(`/video/${id}`);
      }
    } else {
      navigate(`/video/${id}`);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Skeleton variant="text" width="60%" height={60} />
        <Skeleton variant="text" width="40%" height={30} sx={{ mb: 4 }} />
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={300} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ space: 2 }}>
              <Skeleton variant="rectangular" height={56} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={56} sx={{ mb: 2 }} />
            </Box>
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (!video) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Alert severity="error">
          Video not found or you do not have permission to edit it.
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title>Edit {video.title} - Pluto</title>
        <meta name="description" content="Edit video details and settings" />
      </Helmet>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
          Edit Video
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Update your video's details and settings
        </Typography>

        <Paper elevation={3} sx={{ p: 4 }}>
          <Grid container spacing={4}>
            {/* Video Preview */}
            <Grid item xs={12} md={6}>
              <Card>
                <Box sx={{ position: 'relative', paddingTop: '56.25%', bgcolor: 'black' }}>
                  <video
                    src={video.video?.original?.url}
                    poster={video.thumbnails?.poster?.url}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    controls
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      bgcolor: 'rgba(0, 0, 0, 0.8)',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <PlayArrow sx={{ fontSize: 16 }} />
                    {formatDuration(video.video?.original?.duration)}
                  </Box>
                </Box>
              </Card>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  <strong>File:</strong> {video.metadata?.fileName || 'Unknown'}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  <strong>Size:</strong> {formatFileSize(video.video?.original?.bytes)}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  <strong>Resolution:</strong> {video.video?.original?.width}×{video.video?.original?.height}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  <strong>Format:</strong> {video.video?.original?.format}
                </Typography>
              </Box>
            </Grid>

            {/* Edit Form */}
            <Grid item xs={12} md={6}>
              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Controller
                  name="title"
                  control={control}
                  rules={{ 
                    required: 'Title is required',
                    maxLength: { value: 200, message: 'Title cannot exceed 200 characters' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Video Title *"
                      error={!!errors.title}
                      helperText={errors.title?.message}
                      disabled={updateMutation.isLoading}
                      sx={{ mb: 3 }}
                    />
                  )}
                />

                <Controller
                  name="description"
                  control={control}
                  rules={{
                    maxLength: { value: 1000, message: 'Description cannot exceed 1000 characters' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={4}
                      label="Description"
                      error={!!errors.description}
                      helperText={errors.description?.message || 'Optional description for your video'}
                      disabled={updateMutation.isLoading}
                      sx={{ mb: 3 }}
                    />
                  )}
                />

                <Controller
                  name="visibility"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth disabled={updateMutation.isLoading} sx={{ mb: 3 }}>
                      <InputLabel>Visibility</InputLabel>
                      <Select {...field} label="Visibility">
                        <MenuItem value="public">Public</MenuItem>
                        <MenuItem value="unlisted">Unlisted</MenuItem>
                        <MenuItem value="private">Private</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />

                {/* Tags Section */}
                <Typography variant="subtitle1" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
                  <TextField
                    size="small"
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagInputKeyPress}
                    disabled={updateMutation.isLoading || tags.length >= 10}
                    sx={{ flexGrow: 1 }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleAddTag}
                    disabled={!tagInput.trim() || updateMutation.isLoading || tags.length >= 10}
                  >
                    Add
                  </Button>
                </Box>

                {tags.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={`#${tag}`}
                        onDelete={() => handleRemoveTag(tag)}
                        disabled={updateMutation.isLoading}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                )}

                <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
                  Add up to 10 tags to help people discover your video
                </Typography>

                {/* Form Actions */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={handleCancel}
                    disabled={updateMutation.isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={updateMutation.isLoading}
                  >
                    {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Video Statistics */}
        <Paper variant="outlined" sx={{ mt: 4, p: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>
            Video Statistics
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={6} sm={3}>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                {video.stats?.viewsCount || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Views
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="h4" fontWeight={700} color="error.main">
                {video.stats?.likesCount || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Likes
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="h4" fontWeight={700} color="info.main">
                {video.stats?.commentsCount || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Comments
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {video.stats?.sharesCount || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Shares
              </Typography>
            </Grid>
          </Grid>

          {video.stats?.watchTime && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Watch Time Analytics
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Total Watch Time:</strong> {formatDuration(video.stats.watchTime.total)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Average Watch Time:</strong> {formatDuration(video.stats.watchTime.average)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>

        {/* Danger Zone */}
        <Paper variant="outlined" sx={{ mt: 4, p: 3, borderColor: 'error.main' }}>
          <Typography variant="h6" color="error.main" gutterBottom>
            Danger Zone
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Once you delete a video, there is no going back. Please be certain.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
                videoService.deleteVideo(id).then(() => {
                  toast.success('Video deleted successfully');
                  navigate('/profile');
                }).catch(() => {
                  toast.error('Failed to delete video');
                });
              }
            }}
          >
            Delete Video
          </Button>
        </Paper>
      </Container>
    </>
  );
};

export default VideoEdit;
