import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Avatar,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Save,
  Cancel,
  PhotoCamera,
  Delete,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { Helmet } from 'react-helmet-async';
import { userService } from '../../services/users';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const EditProfile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar?.url || null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      bio: user?.bio || '',
      location: user?.location || '',
      website: user?.website || '',
      socialLinks: {
        instagram: user?.socialLinks?.instagram || '',
        twitter: user?.socialLinks?.twitter || '',
      },
      preferences: {
        publicProfile: user?.preferences?.publicProfile !== false,
        emailNotifications: user?.preferences?.emailNotifications !== false,
        pushNotifications: user?.preferences?.pushNotifications || false,
      },
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation(
    (profileData) => userService.updateUser(user._id, profileData),
    {
      onSuccess: (response) => {
        updateUser(response.data.user);
        queryClient.invalidateQueries(['user', user._id]);
        toast.success('Profile updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update profile');
      },
    }
  );

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation(
    (formData) => userService.uploadAvatar(user._id, formData, setUploadProgress),
    {
      onSuccess: (response) => {
        updateUser({ avatar: response.data.avatar });
        queryClient.invalidateQueries(['user', user._id]);
        setAvatarFile(null);
        setUploadProgress(0);
        toast.success('Avatar updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to upload avatar');
        setUploadProgress(0);
      },
    }
  );

  // Delete avatar mutation
  const deleteAvatarMutation = useMutation(
    () => userService.deleteAvatar(user._id),
    {
      onSuccess: () => {
        updateUser({ avatar: { url: null, blobName: null } });
        queryClient.invalidateQueries(['user', user._id]);
        setAvatarPreview(null);
        toast.success('Avatar removed successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to remove avatar');
      },
    }
  );

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Avatar file size must be less than 5MB');
        return;
      }

      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAvatar = () => {
    if (avatarFile) {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      uploadAvatarMutation.mutate(formData);
    }
  };

  const handleDeleteAvatar = () => {
    if (window.confirm('Are you sure you want to remove your avatar?')) {
      deleteAvatarMutation.mutate();
    }
  };

  const onSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  const handleCancel = () => {
    if (isDirty || avatarFile) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/profile');
      }
    } else {
      navigate('/profile');
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all changes?')) {
      reset();
      setAvatarFile(null);
      setAvatarPreview(user?.avatar?.url || null);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5">Please log in to edit your profile</Typography>
        <Button variant="contained" onClick={() => navigate('/login')} sx={{ mt: 2 }}>
          Login
        </Button>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title>Edit Profile - Pluto</title>
        <meta name="description" content="Edit your Pluto profile and settings" />
      </Helmet>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
          Edit Profile
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Update your profile information and preferences
        </Typography>

        <Grid container spacing={4}>
          {/* Avatar Section */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Profile Picture
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Avatar
                  src={avatarPreview}
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                >
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </Avatar>
                
                {uploadProgress > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Uploading... {uploadProgress}%
                    </Typography>
                    <LinearProgress variant="determinate" value={uploadProgress} />
                  </Box>
                )}
              </Box>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                style={{ display: 'none' }}
              />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<PhotoCamera />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadAvatarMutation.isLoading}
                >
                  Choose Photo
                </Button>

                {avatarFile && (
                  <Button
                    variant="contained"
                    onClick={handleUploadAvatar}
                    disabled={uploadAvatarMutation.isLoading}
                  >
                    {uploadAvatarMutation.isLoading ? 'Uploading...' : 'Upload'}
                  </Button>
                )}

                {user.avatar?.url && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={handleDeleteAvatar}
                    disabled={deleteAvatarMutation.isLoading}
                  >
                    Remove
                  </Button>
                )}
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Max file size: 5MB<br />
                Supported formats: JPG, PNG, GIF
              </Typography>
            </Paper>
          </Grid>

          {/* Profile Form */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                {/* Basic Information */}
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="firstName"
                      control={control}
                      rules={{ 
                        required: 'First name is required',
                        maxLength: { value: 50, message: 'First name cannot exceed 50 characters' }
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="First Name *"
                          error={!!errors.firstName}
                          helperText={errors.firstName?.message}
                          disabled={updateProfileMutation.isLoading}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="lastName"
                      control={control}
                      rules={{ 
                        required: 'Last name is required',
                        maxLength: { value: 50, message: 'Last name cannot exceed 50 characters' }
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Last Name *"
                          error={!!errors.lastName}
                          helperText={errors.lastName?.message}
                          disabled={updateProfileMutation.isLoading}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                <Controller
                  name="bio"
                  control={control}
                  rules={{
                    maxLength: { value: 500, message: 'Bio cannot exceed 500 characters' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={3}
                      label="Bio"
                      placeholder="Tell us about yourself..."
                      error={!!errors.bio}
                      helperText={errors.bio?.message || 'Optional bio for your profile'}
                      disabled={updateProfileMutation.isLoading}
                      sx={{ mb: 3 }}
                    />
                  )}
                />

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="location"
                      control={control}
                      rules={{
                        maxLength: { value: 100, message: 'Location cannot exceed 100 characters' }
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Location"
                          placeholder="City, Country"
                          error={!!errors.location}
                          helperText={errors.location?.message}
                          disabled={updateProfileMutation.isLoading}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="website"
                      control={control}
                      rules={{
                        pattern: {
                          value: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
                          message: 'Please enter a valid website URL'
                        },
                        maxLength: { value: 200, message: 'Website URL cannot exceed 200 characters' }
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Website"
                          placeholder="https://yourwebsite.com"
                          error={!!errors.website}
                          helperText={errors.website?.message}
                          disabled={updateProfileMutation.isLoading}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Social Links */}
                <Typography variant="h6" gutterBottom>
                  Social Links
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="socialLinks.instagram"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Instagram"
                          placeholder="@username"
                          disabled={updateProfileMutation.isLoading}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="socialLinks.twitter"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Twitter"
                          placeholder="@username"
                          disabled={updateProfileMutation.isLoading}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Privacy Preferences */}
                <Typography variant="h6" gutterBottom>
                  Privacy & Preferences
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Controller
                    name="preferences.publicProfile"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            {...field}
                            checked={field.value}
                            disabled={updateProfileMutation.isLoading}
                          />
                        }
                        label="Public Profile"
                      />
                    )}
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Allow other users to view your profile
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Controller
                    name="preferences.emailNotifications"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            {...field}
                            checked={field.value}
                            disabled={updateProfileMutation.isLoading}
                          />
                        }
                        label="Email Notifications"
                      />
                    )}
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Receive notifications via email
                  </Typography>
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Controller
                    name="preferences.pushNotifications"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            {...field}
                            checked={field.value}
                            disabled={updateProfileMutation.isLoading}
                          />
                        }
                        label="Push Notifications"
                      />
                    )}
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Receive push notifications in your browser
                  </Typography>
                </Box>

                {/* Account Type Info */}
                {user.role === 'Consumer' && (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      <strong>Consumer Account:</strong> You can view, like, and comment on photos. 
                      Upgrade to a Creator account to upload your own photos.
                    </Typography>
                  </Alert>
                )}

                {/* Form Actions */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={handleReset}
                    disabled={updateProfileMutation.isLoading}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={handleCancel}
                    disabled={updateProfileMutation.isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={updateProfileMutation.isLoading}
                  >
                    {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default EditProfile;
