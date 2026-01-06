import React from 'react';
import { Box, Container, Typography, Link, Grid, Divider } from '@mui/material';
import { PhotoCamera, GitHub, LinkedIn, Twitter } from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'primary.main',
        color: 'white',
        mt: 'auto',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand Section */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PhotoCamera sx={{ mr: 1 }} />
              <Typography variant="h6" component="div" fontWeight={700}>
                Pluto
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
              A modern photo sharing platform built with MERN stack, featuring 
              comprehensive caching, scalable architecture, and beautiful user experience.
            </Typography>
          </Grid>

          {/* Links Section */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/" color="inherit" underline="hover" variant="body2">
                Home
              </Link>
              <Link href="/explore" color="inherit" underline="hover" variant="body2">
                Explore Photos
              </Link>
              <Link href="/register" color="inherit" underline="hover" variant="body2">
                Join Community
              </Link>
            </Box>
          </Grid>

          {/* Tech Info Section */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Technology Stack
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                • React.js Frontend
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                • Node.js + Express Backend
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                • MongoDB Database
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                • Redis Caching Layer
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                • Azure Blob Storage
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.2)' }} />

        {/* Bottom Section */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            © {new Date().getFullYear()} Pluto. Built for scalable photo sharing.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              color="inherit"
              sx={{ opacity: 0.8, '&:hover': { opacity: 1 } }}
            >
              <GitHub />
            </Link>
            <Link
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              color="inherit"
              sx={{ opacity: 0.8, '&:hover': { opacity: 1 } }}
            >
              <LinkedIn />
            </Link>
            <Link
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              color="inherit"
              sx={{ opacity: 0.8, '&:hover': { opacity: 1 } }}
            >
              <Twitter />
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
