import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import PersonIcon from '@mui/icons-material/Person';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import DescriptionIcon from '@mui/icons-material/Description';
import BuildIcon from '@mui/icons-material/Build';
import LogoutIcon from '@mui/icons-material/Logout';
import { colors } from '../theme/colors';
import logo from '../assets/Logo Kopie.png';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

const mainMenuItems = [
  { key: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { key: 'Fälle', icon: <FolderIcon />, path: '/faelle' },
  { key: 'Dokumente', icon: <DescriptionIcon />, path: '/dokumente' },
  { key: 'Tools', icon: <BuildIcon />, path: '/tools' },
];
const profileMenuItem = { key: 'Profil', icon: <PersonIcon />, path: '/profil' };

export default function Sidebar({ open }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  // Aktuelle Route bestimmen
  const currentPath = location.pathname;
  
  // Funktion zum Navigieren
  const handleNavigation = (path) => {
    navigate(path);
  };
  
  // Funktion zum Abmelden
  const handleLogout = () => {
    logout();
  };
  
  // Prüfen, ob ein Menüpunkt aktiv ist
  const isActive = (path) => {
    if (path === '/faelle' && currentPath.startsWith('/faelle/')) {
      return true;
    }
    return currentPath === path;
  };
  
  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? drawerWidth : 56,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        transition: (theme) => theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        [`& .MuiDrawer-paper`]: {
          width: open ? drawerWidth : 56,
          boxSizing: 'border-box',
          background: colors.background.paper,
          color: colors.secondary.main,
          borderRight: `1px solid ${colors.secondary.light}`,
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
        <img src={logo} alt="Rechtly Logo" style={{ width: open ? 200 : 56, transition: 'width 0.3s', marginBottom: 16 }} />
      </Box>
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        <List>
          {mainMenuItems.map((item) => (
            <ListItem
              component="button"
              key={item.key}
              onClick={() => handleNavigation(item.path)}
              sx={{
                my: 0.5,
                borderRadius: 2,
                justifyContent: open ? 'initial' : 'center',
                px: open ? 2 : 1,
                color: isActive(item.path) ? colors.primary.main : colors.secondary.main,
                background: isActive(item.path) ? colors.hover.green : 'none',
                outline: 'none',
                '&:hover': {
                  background: colors.hover.green,
                  color: colors.primary.main,
                  outline: `1.5px solid ${colors.primary.main}`,
                },
              }}
            >
              <ListItemIcon sx={{ color: isActive(item.path) ? colors.primary.main : colors.secondary.main, minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center' }}>
                {item.icon}
              </ListItemIcon>
              {open && (
                <Box>
                  <ListItemText primary={item.key} />
                  {item.key === 'Tools' && (
                    <span style={{ fontSize: 12, color: colors.secondary.light }}>coming soon</span>
                  )}
                </Box>
              )}
            </ListItem>
          ))}
        </List>
      </Box>
      {/* Profilbereich unten als klickbarer Menüpunkt */}
      <Box sx={{ mt: 'auto', mb: 1 }}>
        <List>
          <ListItem
            component="button"
            key={profileMenuItem.key}
            onClick={() => handleNavigation(profileMenuItem.path)}
            sx={{
              borderRadius: 2,
              justifyContent: open ? 'flex-start' : 'center',
              px: open ? 2 : 0,
              py: 1.5,
              color: isActive(profileMenuItem.path) ? colors.primary.main : colors.secondary.main,
              background: isActive(profileMenuItem.path) ? colors.hover.green : 'none',
              minHeight: 72,
              alignItems: 'center',
              outline: 'none',
              '&:hover': {
                background: colors.hover.green,
                color: colors.primary.main,
                outline: `1.5px solid ${colors.primary.main}`,
              },
            }}
          >
            <Avatar sx={{ width: 40, height: 40, mr: open ? 2 : 0 }}>
              {user?.vorname?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </Avatar>
            {open && (
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1 }}>
                  Profil
                </Typography>
                <Typography variant="body2" sx={{ color: colors.secondary.light, fontSize: 13 }}>
                  {user ? `${user.vorname || ''} ${user.nachname || ''}`.trim() : 'Benutzer'}
                </Typography>
              </Box>
            )}
          </ListItem>
          
          {/* Abmelden-Button */}
          <ListItem
            component="button"
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              justifyContent: open ? 'initial' : 'center',
              px: open ? 2 : 1,
              color: '#d32f2f',
              background: 'transparent',
              outline: 'none',
              '&:hover': {
                background: 'rgba(211, 47, 47, 0.08)',
                color: '#d32f2f',
                outline: '1.5px solid #d32f2f',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center' }}>
              <LogoutIcon />
            </ListItemIcon>
            {open && <ListItemText primary="Abmelden" />}
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
} 