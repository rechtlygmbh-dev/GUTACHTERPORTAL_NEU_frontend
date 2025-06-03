import * as React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import CssBaseline from '@mui/material/CssBaseline';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useState } from 'react';

import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Faelle from './pages/Faelle';
import Dokumente from './pages/Dokumente';
import FallDetail from './pages/FallDetail';
import Profil from './pages/Profil';
import Tools from './pages/Tools';
import Login from './pages/Login';
import Register from './pages/Register';
import AccountActivation from './pages/AccountActivation';
import ProtectedRoute from './components/common/ProtectedRoute';
import { colors } from './theme/colors';
import { useAuth } from './context/AuthContext';
import PasswortZuruecksetzen from './pages/PasswortZuruecksetzen';

const drawerWidth = 240;

export default function App() {
  const [open, setOpen] = useState(true);
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  const handleDrawerToggle = () => setOpen((prev) => !prev);
  
  // Prüfen, ob wir auf einer öffentlichen Route sind (Login, Register, Passwort-Reset, Aktivierung)
  const isPublicRoute = ['/login', '/register', '/aktivieren', '/passwort-zuruecksetzen'].some(route => location.pathname.startsWith(route));
  
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {isAuthenticated && !isPublicRoute && (
        <>
          <AppBar
            position="fixed"
            sx={{
              zIndex: (theme) => theme.zIndex.drawer + 1,
              background: colors.background.gradientBlue,
              transition: (theme) => theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
              ...(open && {
                ml: `${drawerWidth}px`,
                width: `calc(100% - ${drawerWidth}px)`
              }),
            }}
          >
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label={open ? 'Sidebar schließen' : 'Sidebar öffnen'}
                onClick={handleDrawerToggle}
                edge="start"
                sx={{ mr: 2 }}
              >
                {open ? <ChevronLeftIcon sx={{ color: colors.accent.white }} /> : <MenuIcon sx={{ color: colors.accent.white }} />}
              </IconButton>
              <Typography variant="h6" noWrap component="div" sx={{ color: colors.accent.white }}>
                Rechtly Gutachterportal Dashboard
              </Typography>
            </Toolbar>
          </AppBar>
          
          <Sidebar open={open} />
        </>
      )}
      
      {isPublicRoute ? (
        <Box
          sx={{
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'background.default',
          }}
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/aktivieren/:token" element={<AccountActivation />} />
            <Route path="/passwort-zuruecksetzen/:token" element={<PasswortZuruecksetzen />} />
          </Routes>
        </Box>
      ) : (
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: 'background.default',
            px: { xs: 1, sm: 2, md: 3 },
            transition: (theme) => theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            ...(isAuthenticated && !isPublicRoute && {
              mt: { xs: 7, sm: 8, md: 10 }, // Abstand unterhalb der AppBar (Header)
            }),
          }}
        >
          <Routes>
            {/* Geschützte Routen */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/faelle" element={<Faelle />} />
              <Route path="/falldetail/:id" element={<FallDetail />} />
              <Route path="/dokumente" element={<Dokumente />} />
              <Route path="/profil" element={<Profil />} />
              <Route path="/tools" element={<Tools />} />
            </Route>
            
            {/* Admin-Routen */}
            <Route element={<ProtectedRoute requireAdmin={true} />}>
              {/* Hier können Admin-spezifische Routen hinzugefügt werden */}
            </Route>
            
            {/* Standardumleitung */}
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
            <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
          </Routes>
        </Box>
      )}
    </Box>
  );
}
