import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { Helmet } from 'react-helmet-async';

const Login = () => {
  const { login, isAuthenticated, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm();

  const from = location.state?.from?.pathname || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data) => {
    try {
      const result = await login(data);
      if (result.success) {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError('submit', {
        type: 'manual',
        message: err.message || 'Login failed',
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - Pluto</title>
        <meta name="description" content="Log in to your Pluto account" />
      </Helmet>

      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
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
            
            <Typography component="h2" variant="h5" sx={{ mb: 3 }}>
              Welcome Back
            </Typography>

            {/* Error Alert */}
            {(error || errors.submit) && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error || errors.submit?.message}
              </Alert>
            )}

            {/* Login Form */}
            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{ width: '100%' }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
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
                autoComplete="current-password"
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

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link
                  to="/forgot-password"
                  style={{
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  <Typography variant="body2" color="primary">
                    Forgot your password?
                  </Typography>
                </Link>
              </Box>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  or
                </Typography>
              </Divider>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
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
                      Sign up here
                    </Typography>
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Demo Accounts Info */}
          <Paper
            elevation={1}
            sx={{
              mt: 2,
              p: 2,
              width: '100%',
              backgroundColor: 'grey.50',
            }}
          >
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Demo Accounts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Creator:</strong> demo.creator@pluto.com / password123
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Consumer:</strong> demo.consumer@pluto.com / password123
            </Typography>
          </Paper>
        </Box>
      </Container>
    </>
  );
};

export default Login;
