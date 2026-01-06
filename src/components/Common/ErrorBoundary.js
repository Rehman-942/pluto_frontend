import React from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh,
  Home,
  BugReport,
} from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and potentially send to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: reportError(error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Box sx={{ textAlign: 'center' }}>
            <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            
            <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
              Oops! Something went wrong
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              We're sorry, but something unexpected happened. Our team has been notified.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4 }}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={this.handleReload}
                size="large"
              >
                Reload Page
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Home />}
                onClick={this.handleGoHome}
                size="large"
              >
                Go Home
              </Button>
            </Box>

            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Card sx={{ mt: 4, textAlign: 'left' }}>
                <CardContent>
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      <BugReport sx={{ mr: 1, verticalAlign: 'bottom' }} />
                      Development Error Details
                    </Typography>
                  </Alert>
                  
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Error Message:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontFamily: 'monospace', 
                      bgcolor: 'grey.100', 
                      p: 1, 
                      borderRadius: 1,
                      mb: 2,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {this.state.error.toString()}
                  </Typography>

                  {this.state.errorInfo && (
                    <>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Component Stack:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: 'monospace', 
                          bgcolor: 'grey.100', 
                          p: 1, 
                          borderRadius: 1,
                          whiteSpace: 'pre-wrap',
                          fontSize: '0.75rem',
                        }}
                      >
                        {this.state.errorInfo.componentStack}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Production Helpful Info */}
            {process.env.NODE_ENV === 'production' && (
              <Alert severity="info" sx={{ mt: 4, textAlign: 'left' }}>
                <Typography variant="body2">
                  If this problem persists, please contact support with the following information:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 1 }}>
                  Error ID: {Date.now().toString(36)}
                  <br />
                  Time: {new Date().toISOString()}
                  <br />
                  URL: {window.location.href}
                </Typography>
              </Alert>
            )}
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
