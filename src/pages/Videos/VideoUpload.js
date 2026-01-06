import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  IconButton,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  CloudUpload,
  VideoFile,
  Add,
  Delete,
  PlayArrow,
  Pause,
  Cancel,
  Publish,
  CheckCircle,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useForm, Controller } from 'react-hook-form';
import { useMutation } from 'react-query';
import { Helmet } from 'react-helmet-async';
import { videoService } from '../../services/videos';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const VideoUpload = () => {
  const { canPerformAction } = useAuth();
  const navigate = useNavigate();
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const steps = ['Upload Video', 'Add Details', 'Review & Publish'];

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      visibility: 'public',
    },
  });

  // Upload mutation
  const uploadMutation = useMutation(
    (videoData) => videoService.uploadVideo(videoData, setUploadProgress),
    {
      onSuccess: (response) => {
        setIsProcessing(false);
        toast.success('Video uploaded successfully!');
        navigate(`/video/${response.data.video._id}`);
      },
      onError: (error) => {
        setIsProcessing(false);
        toast.error(error.response?.data?.error || 'Failed to upload video');
      },
    }
  );

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.m4v']
    },
    maxSize: 500 * 1024 * 1024, // 500MB
    multiple: false,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const error = rejectedFiles[0].errors[0];
        if (error.code === 'file-too-large') {
          toast.error('File size must be less than 500MB');
        } else if (error.code === 'file-invalid-type') {
          toast.error('Please select a valid video file');
        } else {
          toast.error('Invalid file selected');
        }
        return;
      }

      const file = acceptedFiles[0];
      if (file) {
        setSelectedFile(file);
        
        // Create video preview
        const videoUrl = URL.createObjectURL(file);
        setVideoPreview(videoUrl);
        
        // Set default title from filename
        const defaultTitle = file.name.replace(/\.[^/.]+$/, "");
        setValue('title', defaultTitle);
        
        // Move to next step
        setCurrentStep(1);
      }
    },
  });

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
    if (!selectedFile) {
      toast.error('Please select a video file');
      return;
    }

    setIsProcessing(true);
    
    const videoData = {
      file: selectedFile,
      title: data.title,
      description: data.description,
      visibility: data.visibility,
      tags: tags,
    };

    uploadMutation.mutate(videoData);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All progress will be lost.')) {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
      navigate('/profile');
    }
  };

  const getFileSizeString = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h5" gutterBottom align="center">
              Upload Your Video
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center" paragraph>
              Select a video file to get started
            </Typography>

            <Paper
              {...getRootProps()}
              sx={{
                p: 6,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'grey.300',
                bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                },
              }}
            >
              <input {...getInputProps()} ref={fileInputRef} />
              <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                {isDragActive ? 'Drop your video here' : 'Drag & drop your video here'}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                or click to browse files
              </Typography>
              
              <Button variant="outlined" size="large">
                Choose File
              </Button>
              
              <Typography variant="caption" display="block" sx={{ mt: 2 }} color="text.secondary">
                Supported formats: MP4, AVI, MOV, MKV, WebM, M4V<br />
                Maximum size: 500MB
              </Typography>
            </Paper>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Add Video Details
            </Typography>
            
            <Grid container spacing={4}>
              {/* Video Preview */}
              <Grid item xs={12} md={6}>
                <Card>
                  <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                    <video
                      ref={videoRef}
                      src={videoPreview}
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
                  </Box>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      <VideoFile sx={{ mr: 1, verticalAlign: 'middle' }} />
                      {selectedFile?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Size: {selectedFile ? getFileSizeString(selectedFile.size) : ''}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Form */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                        disabled={uploadMutation.isLoading}
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
                        placeholder="Tell viewers about your video..."
                        error={!!errors.description}
                        helperText={errors.description?.message || 'Optional description for your video'}
                        disabled={uploadMutation.isLoading}
                      />
                    )}
                  />

                  <Controller
                    name="visibility"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth disabled={uploadMutation.isLoading}>
                        <InputLabel>Visibility</InputLabel>
                        <Select {...field} label="Visibility">
                          <MenuItem value="public">Public - Anyone can watch</MenuItem>
                          <MenuItem value="unlisted">Unlisted - Only people with link can watch</MenuItem>
                          <MenuItem value="private">Private - Only you can watch</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />

                  {/* Tags Section */}
                  <Box>
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
                        disabled={uploadMutation.isLoading || tags.length >= 10}
                        sx={{ flexGrow: 1 }}
                      />
                      <Button
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={handleAddTag}
                        disabled={!tagInput.trim() || uploadMutation.isLoading || tags.length >= 10}
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
                            disabled={uploadMutation.isLoading}
                            color="primary"
                            variant="outlined"
                            deleteIcon={<Delete />}
                          />
                        ))}
                      </Box>
                    )}

                    <Typography variant="caption" color="text.secondary">
                      Add up to 10 tags to help people discover your video
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        const formData = watch();
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Review & Publish
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Card>
                  <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                    <video
                      src={videoPreview}
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
                  </Box>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Video Details
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Title
                  </Typography>
                  <Typography variant="body1">
                    {formData.title || 'Untitled Video'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body2">
                    {formData.description || 'No description'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Visibility
                  </Typography>
                  <Chip
                    label={formData.visibility}
                    color={formData.visibility === 'public' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>

                {tags.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={`#${tag}`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    File
                  </Typography>
                  <Typography variant="body2">
                    {selectedFile?.name} ({selectedFile ? getFileSizeString(selectedFile.size) : ''})
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Upload Progress */}
            {isProcessing && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="body2" gutterBottom>
                  {uploadProgress < 100 ? 'Uploading video...' : 'Processing video...'}
                </Typography>
                <LinearProgress 
                  variant={uploadProgress < 100 ? "determinate" : "indeterminate"} 
                  value={uploadProgress} 
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {uploadProgress < 100 
                    ? `${uploadProgress}% uploaded` 
                    : 'Generating thumbnails and processing video...'
                  }
                </Typography>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>Upload Video - Pluto</title>
        <meta name="description" content="Upload and share your videos with the community" />
      </Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight={700} align="center">
          Upload Video
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph align="center">
          Share your creativity with the world
        </Typography>

        {/* Progress Stepper */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Stepper activeStep={currentStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Main Content */}
        <Paper sx={{ p: 4, mb: 4 }}>
          {renderStep()}
        </Paper>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={handleCancel}
            disabled={uploadMutation.isLoading || isProcessing}
          >
            Cancel
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {currentStep > 0 && (
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={uploadMutation.isLoading || isProcessing}
              >
                Back
              </Button>
            )}

            {currentStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!selectedFile || (currentStep === 1 && !watch('title'))}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={isProcessing ? <CheckCircle /> : <Publish />}
                onClick={handleSubmit(onSubmit)}
                disabled={uploadMutation.isLoading || isProcessing}
              >
                {isProcessing ? 'Publishing...' : 'Publish Video'}
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default VideoUpload;
