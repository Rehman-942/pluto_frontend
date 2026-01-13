import React, { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Paper,
  Avatar,
  Button,
  Chip,
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
  Edit,
  Delete,
  Send,
  Comment as CommentIcon,
  Visibility,
  Schedule,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { Helmet } from 'react-helmet-async';
import VideoPlayer from '../../components/Video/VideoPlayer';
import VideoThumbnail from '../../components/Video/VideoThumbnail';
import { videoService } from '../../services/videos';
import { commentService } from '../../services/comments';
import { useAuth } from '../../contexts/AuthContext';
import { formatNumber, formatRelativeTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

const VideoDetail = () => {
  const { id } = useParams();
  const { isAuthenticated, canPerformAction, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [replyToComment, setReplyToComment] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');
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

  // Helper function to check if video is liked by current user
  const isVideoLiked = (video) => {
    if (!video) return false;
    
    // First check if isLikedByUser field exists (from backend)
    if (video.isLikedByUser !== undefined) {
      return video.isLikedByUser;
    }
    
    // Fallback: check if current user ID is in likes array
    if (user?.id && video.likes && Array.isArray(video.likes)) {
      return video.likes.some(like => 
        like.userId && like.userId.toString() === user.id.toString()
      );
    }
    
    return false;
  };

  // Fetch video comments
  const { data: commentsData, isLoading: commentsLoading } = useQuery(
    ['comments', 'video', id],
    () => commentService.getVideoComments(id),
    {
      enabled: !!id
    }
  );

  // Fetch related videos based on tags
  const { data: relatedVideosData, isLoading: relatedVideosLoading } = useQuery(
    ['relatedVideos', id, videoData?.data.video?.tags],
    async () => {
      const currentVideo = videoData?.data.video;
      if (!currentVideo?.tags || currentVideo.tags.length === 0) {
        // If no tags, get recent videos
        const response = await videoService.getVideos({ page: 1, limit: 6 });
        return response;
      }
      
      // Get videos with similar tags
      const response = await videoService.getVideos({ 
        page: 1, 
        limit: 20, // Fetch more to filter and sort
        tags: currentVideo.tags.join(',')
      });
      
      if (response.data && response.data.videos) {
        // Filter out current video and calculate tag similarity
        const otherVideos = response.data.videos
          .filter(v => v._id !== currentVideo._id)
          .map(v => {
            // Calculate similarity score based on common tags
            const commonTags = v.tags?.filter(tag => currentVideo.tags.includes(tag)) || [];
            const similarity = commonTags.length / Math.max(currentVideo.tags.length, v.tags?.length || 1);
            return { ...v, similarity };
          })
          .sort((a, b) => b.similarity - a.similarity) // Sort by similarity
          .slice(0, 5); // Take top 5
        
        return {
          ...response,
          data: {
            ...response.data,
            videos: otherVideos
          }
        };
      }
      
      return response;
    },
    {
      enabled: !!videoData?.data.video && !!id,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  );

  // Like mutation
  const likeMutation = useMutation(
    () => videoService.toggleLike(id),
    {
      onSuccess: (response) => {
        console.log('Full Like API response:', response);
        console.log('Response type:', typeof response);
        console.log('Response structure:', Object.keys(response || {}));
        
        // The response should be the API response data directly
        if (response?.success) {
          const isLiked = response?.data?.data?.isLiked;
          console.log('Like status from response.data.data.isLiked:', isLiked);
          
          if (isLiked !== undefined) {
            toast.success(isLiked ? '❤️ Video liked!' : '💔 Video unliked!');
          } else {
            toast.success('👍 Like updated!');
          }
          
          // Invalidate and refetch to ensure UI updates
          queryClient.invalidateQueries(['video', id]);
          queryClient.invalidateQueries(['videos']);
          queryClient.refetchQueries(['video', id]);
        } else {
          console.error('API response missing success field:', response);
          toast.error('❌ Failed to update like - invalid response');
        }
      },
      onError: (error) => {
        console.error('Like mutation error:', error);
        console.error('Error response:', error?.response);
        console.error('Error data:', error?.response?.data);
        toast.error('❌ Failed to update like');
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

  // Comment like mutation
  const commentLikeMutation = useMutation(
    (commentId) => commentService.likeComment(commentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['comments', 'video', id]);
        toast.success('Comment liked!');
      },
      onError: () => {
        toast.error('Failed to like comment');
      }
    }
  );

  // Comment delete mutation
  const commentDeleteMutation = useMutation(
    (commentId) => commentService.deleteComment(commentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['comments', 'video', id]);
        queryClient.invalidateQueries(['video', id]);
        toast.success('Comment deleted!');
      },
      onError: () => {
        toast.error('Failed to delete comment');
      }
    }
  );

  // Comment update mutation
  const commentUpdateMutation = useMutation(
    ({ commentId, content }) => commentService.updateComment(commentId, { content }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['comments', 'video', id]);
        toast.success('Comment updated!');
      },
      onError: () => {
        toast.error('Failed to update comment');
      }
    }
  );

  const video = videoData?.data.video;
  const comments = commentsData?.data.comments || [];

  // Track video view on component mount
  React.useEffect(() => {
    if (video?._id) {
      // Increment view count when user views the video
      videoService.updateWatchTime(video._id, 1).catch(console.error);
    }
  }, [video?._id]);

  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to like videos');
      navigate('/login');
      return;
    }
    
    if (likeMutation.isLoading) {
      return; // Prevent multiple clicks
    }
    
    console.log('Triggering like for video:', id);
    console.log('Current video like state:', video.isLikedByUser);
    console.log('Current like count:', video.stats?.likesCount);
    
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


  const onCommentSubmit = (data) => {
    if (!isAuthenticated) {
      toast.error('Please log in to comment');
      navigate('/login');
      return;
    }

    const commentData = {
      videoId: id,
      content: data.content,
    };

    // Only add parentId if replying to a comment (must be string or omitted)
    if (replyToComment?._id) {
      commentData.parentId = replyToComment._id;
    }

    commentMutation.mutate(commentData);
  };

  const handleWatchTimeUpdate = (watchTime) => {
    // This will be called by the video player to track watch time
    console.log('Watch time update:', watchTime);
    
    // Update watch time on backend
    videoService.updateWatchTime(id, watchTime).catch(console.error);
  };

  const handleCommentLike = (commentId) => {
    if (!isAuthenticated) {
      toast.error('Please log in to like comments');
      navigate('/login');
      return;
    }
    commentLikeMutation.mutate(commentId);
  };

  const handleCommentDelete = (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      commentDeleteMutation.mutate(commentId);
    }
  };

  const handleCommentEdit = (comment) => {
    setEditingComment(comment._id);
    setEditCommentContent(comment.content);
  };

  const handleCommentUpdate = (commentId) => {
    if (!editCommentContent.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    
    commentUpdateMutation.mutate({ 
      commentId, 
      content: editCommentContent.trim() 
    });
    setEditingComment(null);
    setEditCommentContent('');
  };

  const cancelCommentEdit = () => {
    setEditingComment(null);
    setEditCommentContent('');
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
                    variant={isVideoLiked(video) ? 'contained' : 'outlined'}
                    startIcon={isVideoLiked(video) ? <Favorite /> : <FavoriteBorder />}
                    onClick={handleLike}
                    disabled={likeMutation.isLoading}
                    color={isVideoLiked(video) ? 'error' : 'inherit'}
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
                      sx={{ textDecoration: 'none', color: 'inherit', fontWeight: 600 }}
                    >
                      {video.creatorId?.firstName} {video.creatorId?.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{video.creatorId?.username}
                    </Typography>
                    {video.creatorId?.bio && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {video.creatorId.bio}
                      </Typography>
                    )}
                  </Box>

                  {isAuthenticated && video.creatorId?._id !== video.creatorId?._id && (
                    <Button variant="contained" color="primary">
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
                        
                        {editingComment === comment._id ? (
                          // Edit mode
                          <Box sx={{ mt: 1 }}>
                            <TextField
                              fullWidth
                              multiline
                              rows={2}
                              value={editCommentContent}
                              onChange={(e) => setEditCommentContent(e.target.value)}
                              variant="outlined"
                              size="small"
                              sx={{ mb: 1 }}
                            />
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleCommentUpdate(comment._id)}
                                disabled={commentUpdateMutation.isLoading}
                              >
                                Save
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={cancelCommentEdit}
                              >
                                Cancel
                              </Button>
                            </Box>
                          </Box>
                        ) : (
                          // View mode
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Button 
                              size="small" 
                              startIcon={comment.isLikedByUser ? <Favorite /> : <FavoriteBorder />}
                              onClick={() => handleCommentLike(comment._id)}
                              disabled={commentLikeMutation.isLoading}
                              color={comment.isLikedByUser ? "primary" : "inherit"}
                            >
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

                            {/* Edit/Delete for comment owner */}
                            {isAuthenticated && canPerformAction('edit', comment) && (
                              <>
                                <Button
                                  size="small"
                                  onClick={() => handleCommentEdit(comment)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() => handleCommentDelete(comment._id)}
                                  disabled={commentDeleteMutation.isLoading}
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                          </Box>
                        )}
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
              {relatedVideosLoading ? (
                // Loading skeletons
                [...Array(5)].map((_, index) => (
                  <Paper key={index} sx={{ p: 2, mb: 2, display: 'flex', gap: 2 }}>
                    <Skeleton variant="rectangular" width={120} height={68} />
                    <Box>
                      <Skeleton variant="text" width="100%" />
                      <Skeleton variant="text" width="80%" />
                      <Skeleton variant="text" width="60%" />
                    </Box>
                  </Paper>
                ))
              ) : relatedVideosData?.data?.videos?.length > 0 ? (
                // Related videos
                relatedVideosData.data.videos.map((relatedVideo) => (
                  <Paper 
                    key={relatedVideo._id} 
                    sx={{ 
                      p: 1, 
                      mb: 2, 
                      display: 'flex', 
                      gap: 2,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                    onClick={() => navigate(`/video/${relatedVideo._id}`)}
                  >
                    <Box sx={{ width: 120, height: 68, flexShrink: 0 }}>
                      <VideoThumbnail
                        videoUrl={relatedVideo.video?.original?.url}
                        thumbnailUrl={relatedVideo.thumbnails?.poster?.url}
                        alt={relatedVideo.title}
                        width={120}
                        height={68}
                        showPlayButton={true}
                      />
                    </Box>
                    
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body2" 
                        fontWeight={600} 
                        sx={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          mb: 0.5
                        }}
                      >
                        {relatedVideo.title}
                      </Typography>
                      
                      <Typography variant="caption" color="text.secondary" display="block">
                        {relatedVideo.creatorId?.firstName} {relatedVideo.creatorId?.lastName}
                      </Typography>
                      
                      <Typography variant="caption" color="text.secondary" display="block">
                        {formatNumber(relatedVideo.stats?.viewsCount || 0)} views • {formatRelativeTime(relatedVideo.createdAt)}
                      </Typography>
                      
                      {/* Show similarity indicator if this is a tag-based match */}
                      {relatedVideo.similarity > 0 && (
                        <Box sx={{ mt: 0.5 }}>
                          {relatedVideo.tags?.filter(tag => video.tags?.includes(tag)).slice(0, 2).map((tag) => (
                            <Chip
                              key={tag}
                              label={`#${tag}`}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, height: 16, fontSize: '0.6rem' }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Paper>
                ))
              ) : (
                // No related videos
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No related videos found
                  </Typography>
                </Box>
              )}
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
          
        </Menu>
      </Container>
    </>
  );
};

export default VideoDetail;
