import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

// Komponente für geschützte Routen
const ProtectedRoute = ({ requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  // Wenn noch geladen wird, zeige Ladeindikator
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Wenn nicht authentifiziert, zum Login umleiten
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Wenn Admin erforderlich, aber kein Admin, zum Dashboard umleiten
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Wenn authentifiziert (und Admin, falls erforderlich), Inhalt anzeigen
  return <Outlet />;
};

export default ProtectedRoute; 