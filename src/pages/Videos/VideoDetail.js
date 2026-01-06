import React, { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Paper,
  Avatar,
  IconButton,
  Button,
  Chip,
  Divider,
  TextField,
  Alert,
  Skeleton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Share,
  MoreVert,
  Edit,
  Delete,
  Flag,
  Send,
  Comment as CommentIcon,
  PlayArrow,
  Visibility,
  Schedule,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import VideoPlayer from '../../components/Video/VideoPlayer';
import { videoService } from '../../services/videos';
import { commentService } from '../../services/comments';
import { useAuth } from '../../contexts/AuthContext';
import { formatNumber, formatRelativeTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

const VideoDetail = () => {
  const { id } = useParams();
  const { isAuthenticated, canPerformAction } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [replyToComment, setReplyToComment] = useState(null);
  const playerRef = useRef(null);

  // Form for new comments
  const {
    control: commentControl,
    handleSubmit: handleCommentSubmit,
    reset: resetCommentForm,
    formState: { errors: commentErrors }
  } = useForm({
    defaultValues: { content: '' }
  });

  // Fetch video data
  const { data: videoData, isLoading: videoLoading, error: videoError } = useQuery(
    ['video', id],
    () => videoService.getVideo(id),
    {
      enabled: !!id,
      retry: (failureCount, error) => {
        if (error.response?.status === 404) return false;
        return failureCount < 2;
      }
    }
  );

  // Fetch video comments
  const { data: commentsData, isLoading: commentsLoading } = useQuery(
    ['comments', 'video', id],
    () => commentService.getVideoComments(id),
    {
      enabled: !!id
    }
  );

  // Like mutation
  const likeMutation = useMutation(
    () => videoService.toggleLike(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['video', id]);
        toast.success('Video liked!');
      },
      onError: () => {
        toast.error('Failed to like video');
      }
    }
  );

  // Comment mutation
  const commentMutation = useMutation(
    (commentData) => commentService.createComment(commentData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['comments', 'video', id]);
        queryClient.invalidateQueries(['video', id]);
        resetCommentForm();
        setShowCommentForm(false);
        setReplyToComment(null);
        toast.success('Comment added!');
      },
      onError: () => {
        toast.error('Failed to add comment');
      }
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    () => videoService.deleteVideo(id),
    {
      onSuccess: () => {
        toast.success('Video deleted successfully');
        navigate('/profile');
      },
      onError: () => {
        toast.error('Failed to delete video');
      }
    }
  );

  const video = videoData?.data.video;
  const comments = commentsData?.data.comments || [];

  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to like videos');
      navigate('/login');
      return;
    }
    likeMutation.mutate();
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: video.title,
        text: video.description,
        url: window.location.href
      });
    } catch (error) {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      } catch (clipboardError) {
        toast.error('Failed to share video');
      }
    }
  };

  const handleMenuClick = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleEdit = () => {
    navigate(`/video/${id}/edit`);
    handleMenuClose();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
    handleMenuClose();
  };

  const handleReport = () => {
    // TODO: Implement report functionality
    toast.info('Report functionality coming soon');
    handleMenuClose();
  };

  const onCommentSubmit = (data) => {
    if (!isAuthenticated) {
      toast.error('Please log in to comment');
      navigate('/login');
      return;
    }

    commentMutation.mutate({
      videoId: id,
      content: data.content,
      parentId: replyToComment?._id || null
    });
  };

  const handleWatchTimeUpdate = (watchTime) => {
    // This will be called by the video player to track watch time
    console.log('Watch time update:', watchTime);
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (videoError?.response?.status === 404) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Alert severity="error">
          <Typography variant="h6">Video Not Found</Typography>
          <Typography variant="body2">
            The video you're looking for doesn't exist or has been removed.
          </Typography>
        </Alert>
      </Container>
    );
  }

  if (videoLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} lg={8}>
            <Skeleton variant="rectangular" height={500} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="80%" height={40} />
            <Skeleton variant="text" width="60%" />
          </Grid>
          <Grid item xs={12} lg={4}>
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="100%" />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (!video) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Alert severity="error">Video not found</Alert>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title>{video.title} - Pluto</title>
        <meta name="description" content={video.description} />
        <meta property="og:title" content={video.title} />
        <meta property="og:description" content={video.description} />
        <meta property="og:image" content={video.thumbnails?.poster?.url} />
        <meta property="og:type" content="video.other" />
      </Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* Main Video Content */}
          <Grid item xs={12} lg={8}>
            {/* Video Player */}
            <Box sx={{ mb: 3 }}>
              <VideoPlayer
                ref={playerRef}
                video={video}
                onWatchTimeUpdate={handleWatchTimeUpdate}
                sx={{ borderRadius: 2 }}
              />
            </Box>

            {/* Video Info */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
                {video.title}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Visibility fontSize="small" color="action" />
                    <Typography variant="body2">
                      {formatNumber(video.stats?.viewsCount || 0)} views
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Schedule fontSize="small" color="action" />
                    <Typography variant="body2">
                      {formatDuration(video.video?.original?.duration || 0)}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    {formatRelativeTime(video.createdAt)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {/* Like Button */}
                  <Button
                    variant={video.isLikedByUser ? 'contained' : 'outlined'}
                    startIcon={video.isLikedByUser ? <Favorite /> : <FavoriteBorder />}
                    onClick={handleLike}
                    disabled={likeMutation.isLoading}
                  >
                    {formatNumber(video.stats?.likesCount || 0)}
                  </Button>

                  {/* Share Button */}
                  <Button
                    variant="outlined"
                    startIcon={<Share />}
                    onClick={handleShare}
                  >
                    Share
                  </Button>

                  {/* Menu Button */}
                  <IconButton onClick={handleMenuClick}>
                    <MoreVert />
                  </IconButton>
                </Box>
              </Box>

              {/* Tags */}
              {video.tags && video.tags.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {video.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={`#${tag}`}
                      variant="outlined"
                      size="small"
                      clickable
                      component={Link}
                      to={`/explore?tags=${tag}`}
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              )}

              {/* Description */}
              {video.description && (
                <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {video.description}
                  </Typography>
                </Paper>
              )}
            </Box>

            {/* Creator Info */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={video.creatorId?.avatar?.url}
                  sx={{ width: 56, height: 56 }}
                  component={Link}
                  to={`/user/${video.creatorId?.username}`}
                >
                  {video.creatorId?.firstName?.[0]}{video.creatorId?.lastName?.[0]}
                </Avatar>
                
                <Box sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="h6"
                    component={Link}
                    to={`/user/${video.creatorId?.username}`}
                    sx={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    {video.creatorId?.firstName} {video.creatorId?.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    @{video.creatorId?.username}
                  </Typography>
                </Box>

                {isAuthenticated && video.creatorId?._id !== video.creatorId?._id && (
                  <Button variant="contained">
                    Follow
                  </Button>
                )}
              </Box>
            </Paper>

            {/* Comments Section */}
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CommentIcon />
                  {formatNumber(video.stats?.commentsCount || 0)} Comments
                </Typography>
                
                {isAuthenticated && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowCommentForm(!showCommentForm)}
                  >
                    Add Comment
                  </Button>
                )}
              </Box>

              {/* Comment Form */}
              {showCommentForm && (
                <Box sx={{ mb: 3 }}>
                  <Box component="form" onSubmit={handleCommentSubmit(onCommentSubmit)}>
                    <Controller
                      name="content"
                      control={commentControl}
                      rules={{ required: 'Comment cannot be empty' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          multiline
                          rows={3}
                          placeholder={replyToComment ? `Reply to ${replyToComment.user?.username}...` : "Add a comment..."}
                          variant="outlined"
                          error={!!commentErrors.content}
                          helperText={commentErrors.content?.message}
                          sx={{ mb: 2 }}
                        />
                      )}
                    />
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<Send />}
                        disabled={commentMutation.isLoading}
                      >
                        {replyToComment ? 'Reply' : 'Comment'}
                      </Button>
                      
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setShowCommentForm(false);
                          setReplyToComment(null);
                          resetCommentForm();
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Comments List */}
              {commentsLoading ? (
                [...Array(3)].map((_, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="60%" />
                  </Box>
                ))
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <Box key={comment._id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Avatar
                        src={comment.user?.avatar?.url}
                        sx={{ width: 32, height: 32 }}
                      >
                        {comment.user?.firstName?.[0]}
                      </Avatar>
                      
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {comment.user?.firstName} {comment.user?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatRelativeTime(comment.createdAt)}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {comment.content}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <Button size="small" startIcon={<FavoriteBorder />}>
                            {comment.stats?.likesCount || 0}
                          </Button>
                          
                          {isAuthenticated && (
                            <Button
                              size="small"
                              onClick={() => {
                                setReplyToComment(comment);
                                setShowCommentForm(true);
                              }}
                            >
                              Reply
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                  No comments yet. Be the first to comment!
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            {/* Related Videos */}
            <Typography variant="h6" gutterBottom>
              Related Videos
            </Typography>
            
            <Box sx={{ space: 2 }}>
              {[...Array(5)].map((_, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2, display: 'flex', gap: 2 }}>
                  <Skeleton variant="rectangular" width={120} height={68} />
                  <Box>
                    <Skeleton variant="text" width="100%" />
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="60%" />
                  </Box>
                </Paper>
              ))}
            </Box>
          </Grid>
        </Grid>

        {/* Action Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          {canPerformAction('edit', video) && (
            <MenuItem onClick={handleEdit}>
              <Edit sx={{ mr: 1 }} />
              Edit Video
            </MenuItem>
          )}
          
          {canPerformAction('delete', video) && (
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <Delete sx={{ mr: 1 }} />
              Delete Video
            </MenuItem>
          )}
          
          <MenuItem onClick={handleReport}>
            <Flag sx={{ mr: 1 }} />
            Report Video
          </MenuItem>
        </Menu>
      </Container>
    </>
  );
};

export default VideoDetail;
