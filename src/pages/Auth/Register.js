import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Chip,
} from '@mui/material';
import { PhotoCamera, PersonAdd } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { Helmet } from 'react-helmet-async';

const Register = () => {
  const { register: registerUser, isAuthenticated, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setError,
    watch,
  } = useForm({
    defaultValues: {
      role: 'Consumer',
    },
  });

  const watchPassword = watch('password', '');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data, event) => {
    event?.preventDefault();
    try {
      const { confirmPassword, ...userData } = data;
      const result = await registerUser(userData);
      if (result.success) {
        navigate('/', { replace: true });
      } else {
        // Handle registration failure
        setError('submit', {
          type: 'manual',
          message: result.error || 'Registration failed',
        });
      }
    } catch (err) {
      setError('submit', {
        type: 'manual',
        message: err.message || 'Registration failed',
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign Up - Pluto</title>
        <meta name="description" content="Create your Pluto account" />
      </Helmet>

      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            marginTop: 4,
            marginBottom: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              padding: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
            }}
          >
            {/* Logo and Title */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PhotoCamera color="primary" sx={{ fontSize: 40, mr: 1 }} />
              <Typography component="h1" variant="h4" fontWeight={700}>
                Pluto
              </Typography>
            </Box>
            
            <Typography component="h2" variant="h5" sx={{ mb: 1 }}>
              Join Our Community
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              Create your account and start sharing amazing photos
            </Typography>

            {/* Error Alert */}
            {(error || errors.submit) && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error || errors.submit?.message}
              </Alert>
            )}

            {/* Registration Form */}
            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{ width: '100%' }}
            >
              {/* Name Fields */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  name="firstName"
                  autoComplete="given-name"
                  {...register('firstName', {
                    required: 'First name is required',
                    maxLength: {
                      value: 50,
                      message: 'First name cannot exceed 50 characters',
                    },
                  })}
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                />

                <TextField
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                  {...register('lastName', {
                    required: 'Last name is required',
                    maxLength: {
                      value: 50,
                      message: 'Last name cannot exceed 50 characters',
                    },
                  })}
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                />
              </Box>

              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                {...register('username', {
                  required: 'Username is required',
                  minLength: {
                    value: 3,
                    message: 'Username must be at least 3 characters',
                  },
                  maxLength: {
                    value: 30,
                    message: 'Username cannot exceed 30 characters',
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message: 'Username can only contain letters, numbers, and underscores',
                  },
                })}
                error={!!errors.username}
                helperText={errors.username?.message}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+\.\S+$/,
                    message: 'Please enter a valid email address',
                  },
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                error={!!errors.password}
                helperText={errors.password?.message}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === watchPassword || 'Passwords do not match',
                })}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
              />

              {/* Role Selection */}
              <FormControl fullWidth margin="normal" error={!!errors.role}>
                <InputLabel id="role-label">Account Type</InputLabel>
                <Controller
                  name="role"
                  control={control}
                  rules={{ required: 'Please select an account type' }}
                  render={({ field }) => (
                    <Select
                      labelId="role-label"
                      label="Account Type"
                      {...field}
                    >
                      <MenuItem value="Consumer">
                        <Box>
                          <Typography variant="body1">Consumer</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Browse and interact with photos
                          </Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="Creator">
                        <Box>
                          <Typography variant="body1">Creator</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Upload and share your photos
                          </Typography>
                        </Box>
                      </MenuItem>
                    </Select>
                  )}
                />
                {errors.role && (
                  <FormHelperText>{errors.role.message}</FormHelperText>
                )}
              </FormControl>

              {/* Role Information */}
              <Box sx={{ mt: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label="Consumer Features"
                    variant="outlined"
                    size="small"
                    color="primary"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                    View, like, comment, follow creators
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  <Chip
                    label="Creator Features"
                    variant="outlined"
                    size="small"
                    color="secondary"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                    All consumer features + upload photos, manage gallery
                  </Typography>
                </Box>
              </Box>

              <Button
                type="button"
                fullWidth
                variant="contained"
                sx={{ mt: 2, mb: 2, py: 1.5 }}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : <PersonAdd />}
                onClick={handleSubmit(onSubmit)}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  or
                </Typography>
              </Divider>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    style={{
                      color: 'inherit',
                      textDecoration: 'none',
                    }}
                  >
                    <Typography
                      component="span"
                      variant="body2"
                      color="primary"
                      sx={{ fontWeight: 600 }}
                    >
                      Sign in here
                    </Typography>
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Terms and Privacy */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 2, textAlign: 'center', maxWidth: 400 }}
          >
            By creating an account, you agree to our Terms of Service and Privacy Policy.
            This is a demo application for educational purposes.
          </Typography>
        </Box>
      </Container>
    </>
  );
};

export default Register;
