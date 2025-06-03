import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Container,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { colors } from '../theme/colors';
import axios from 'axios';
import logo from '../assets/Logo Kopie.png';
import api from '../services/api';

const AccountActivation = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const activateAccount = async () => {
      try {
        // Fix: Determine API URL based on environment
        const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        const API_URL = isProduction 
          ? 'https://gutachterportal-neu-backend-9e0y.onrender.com/api'
          : 'http://localhost:5000/api';

        console.log('Activation API URL:', `${API_URL}/users/aktivieren/${token}`); // Debug log

        const response = await axios.get(`${API_URL}/users/aktivieren/${token}`);
        
        if (response.data.erfolg) {
          setSuccess(true);
          setMessage(response.data.nachricht);
          // Nach Aktivierung: Profildaten holen und speichern
          try {
            const profileRes = await api.get('/users/profile');
            if (profileRes.data && profileRes.data.benutzer) {
              localStorage.setItem('user', JSON.stringify(profileRes.data.benutzer));
            }
          } catch (profileErr) {
            // Ignorieren, falls nicht eingeloggt
            console.log('Could not fetch profile after activation:', profileErr);
          }
          // Nach 3 Sekunden zum Login weiterleiten
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setSuccess(false);
          setError(response.data.nachricht || 'Aktivierung fehlgeschlagen');
        }
      } catch (error) {
        console.error('Activation error:', error);
        setSuccess(false);
        setError(error.response?.data?.nachricht || 'Aktivierung fehlgeschlagen. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      activateAccount();
    } else {
      setLoading(false);
      setError('Kein Aktivierungstoken gefunden.');
    }
  }, [token, navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
        py: 4,
        backgroundColor: colors.background.paper + '10'
      }}
    >
      <Container component="main" maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            background: colors.background.paper,
            border: `1px solid ${colors.secondary.light}`,
            boxShadow: colors.shadows.md
          }}
        >
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <img src={logo} alt="Rechtly Logo" style={{ width: 200, marginBottom: 16 }} />
            <Typography component="h1" variant="h5" sx={{ 
              fontWeight: 600,
              color: colors.secondary.main
            }}>
              Kontoaktivierung
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
              <CircularProgress size={60} sx={{ color: colors.primary.main }} />
              <Typography variant="body1" sx={{ mt: 2, color: colors.secondary.main }}>
                Ihr Konto wird aktiviert...
              </Typography>
            </Box>
          ) : success ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 80, color: colors.primary.main }} />
              <Alert 
                severity="success" 
                sx={{ 
                  width: '100%', 
                  mt: 2,
                  '& .MuiAlert-icon': {
                    color: colors.primary.main
                  },
                  '& .MuiAlert-message': {
                    color: colors.secondary.main
                  },
                  backgroundColor: colors.primary.main + '15',
                  border: `1px solid ${colors.primary.main}30`
                }}
              >
                {message}<br />
                <span style={{ fontSize: '0.95em', color: colors.secondary.light }}>
                  Sie werden in wenigen Sekunden zum Login weitergeleitet...
                </span>
              </Alert>
              <Button
                component={Link}
                to="/login"
                variant="contained"
                sx={{ 
                  mt: 3,
                  backgroundColor: colors.primary.main,
                  color: colors.secondary.main,
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: colors.primary.dark,
                  }
                }}
              >
                Zum Login
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
              <ErrorOutlineIcon sx={{ fontSize: 80, color: '#f44336' }} />
              <Alert 
                severity="error" 
                sx={{ 
                  width: '100%', 
                  mt: 2,
                  '& .MuiAlert-message': {
                    color: colors.secondary.main
                  }
                }}
              >
                {error}
              </Alert>
              <Button
                component={Link}
                to="/register"
                variant="contained"
                sx={{ 
                  mt: 3,
                  backgroundColor: colors.primary.main,
                  color: colors.secondary.main,
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: colors.primary.dark,
                  }
                }}
              >
                Zurück zur Registrierung
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default AccountActivation;