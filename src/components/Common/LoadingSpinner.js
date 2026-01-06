import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Backdrop,
  Card,
  CardContent,
} from '@mui/material';

// Full page loading overlay
export const PageLoader = ({ message = 'Loading...', open = true }) => (
  <Backdrop
    sx={{
      color: '#fff',
      zIndex: (theme) => theme.zIndex.drawer + 1,
      backdropFilter: 'blur(4px)',
    }}
    open={open}
  >
    <Box sx={{ textAlign: 'center' }}>
      <CircularProgress color="inherit" size={60} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        {message}
      </Typography>
    </Box>
  </Backdrop>
);

// Centered loading spinner for components
export const CenterLoader = ({ size = 40, message = null, height = '200px' }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: height,
      gap: 2,
    }}
  >
    <CircularProgress size={size} />
    {message && (
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    )}
  </Box>
);

// Inline loading spinner
export const InlineLoader = ({ size = 20, color = 'primary' }) => (
  <CircularProgress size={size} color={color} />
);

// Loading card for skeleton replacement
export const LoadingCard = ({ height = 200, showText = true }) => (
  <Card>
    <Box
      sx={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100',
      }}
    >
      <CircularProgress />
    </Box>
    {showText && (
      <CardContent>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Loading...
        </Typography>
      </CardContent>
    )}
  </Card>
);

// Button loading state
export const LoadingButton = ({ 
  loading, 
  children, 
  loadingText = 'Loading...', 
  component: Component = 'button',
  ...props 
}) => (
  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
    <Component {...props} disabled={loading || props.disabled}>
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={16} />
          {loadingText}
        </Box>
      ) : (
        children
      )}
    </Component>
  </Box>
);

// Default export for backward compatibility
const LoadingSpinner = CenterLoader;
export default LoadingSpinner;
