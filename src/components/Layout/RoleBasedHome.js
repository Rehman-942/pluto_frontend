import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import CreatorHome from '../../pages/Creator/CreatorHome';
import Home from '../../pages/Home';

const RoleBasedHome = () => {
  const { user, isAuthenticated } = useAuth();

  // If user is authenticated and is a Creator, show Creator Dashboard
  if (isAuthenticated && user?.role === 'Creator') {
    return <CreatorHome />;
  }

  // Otherwise show regular Home page (for customers and guests)
  return <Home />;
};

export default RoleBasedHome;
