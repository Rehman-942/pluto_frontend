import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
} from '@mui/material';
import { Home, ArrowBack } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Page Not Found - Pluto</title>
        <meta name="description" content="The page you're looking for doesn't exist" />
      </Helmet>

      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 6,
              borderRadius: 3,
              width: '100%',
            }}
          >
            <Typography
              variant="h1"
              sx={{
                fontSize: '6rem',
                fontWeight: 700,
                color: 'primary.main',
                mb: 2,
              }}
            >
              404
            </Typography>
            
            <Typography variant="h4" gutterBottom fontWeight={600}>
              Page Not Found
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Sorry, the page you're looking for doesn't exist. It might have been moved, 
              deleted, or you entered the wrong URL.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<Home />}
                onClick={() => navigate('/')}
                size="large"
              >
                Go Home
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => navigate(-1)}
                size="large"
              >
                Go Back
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </>
  );
};

export default NotFound;
