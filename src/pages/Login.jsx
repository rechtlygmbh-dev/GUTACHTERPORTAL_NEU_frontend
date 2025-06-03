import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Grid,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/Logo Kopie.png';
import ChangePasswordDialog from '../components/ChangePasswordDialog';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuth();
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [formError, setFormError] = useState('');

  const validateLogin = () => {
    if (!email.trim() || !password) {
      setFormError('Bitte E-Mail und Passwort eingeben.');
      return false;
    }
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      setFormError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      return false;
    }
    if (password.length < 8) {
      setFormError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;
    await login(email, password);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: colors.background.gradientGreen,
        zIndex: 1300
      }}
    >
      <Container component="main" maxWidth="xs">
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
              Anmelden
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: colors.secondary.light }}>
              Bitte melden Sie sich an, um auf das Gutachterportal zuzugreifen
            </Typography>
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                width: '100%', 
                mb: 2,
                '& .MuiAlert-message': {
                  color: colors.secondary.main
                }
              }}
            >
              {error}
            </Alert>
          )}

          {formError && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {formError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="E-Mail-Adresse"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: colors.primary.main,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: colors.secondary.main,
                }
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Passwort"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Passwort anzeigen/verbergen"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: colors.secondary.light }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: colors.primary.main,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: colors.secondary.main,
                }
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || !email || !password || !!formError}
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.5,
                backgroundColor: colors.primary.main,
                color: colors.secondary.main,
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: colors.primary.dark,
                },
                '&:disabled': {
                  backgroundColor: colors.secondary.light + '50',
                }
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: colors.secondary.main }} /> : 'Anmelden'}
            </Button>

            <Typography
              variant="body2"
              sx={{ color: colors.secondary.light, textAlign: 'right', cursor: 'pointer', mb: 2, '&:hover': { color: colors.primary.main, textDecoration: 'underline' } }}
              onClick={() => setPwDialogOpen(true)}
            >
              Passwort vergessen?
            </Typography>

            <Grid container justifyContent="center" sx={{ mt: 2 }}>
              <Grid item>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" sx={{ 
                    color: colors.secondary.main,
                    '&:hover': {
                      color: colors.primary.main
                    }
                  }}>
                    Noch kein Konto? Jetzt registrieren
                  </Typography>
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
      <ChangePasswordDialog open={pwDialogOpen} onClose={() => setPwDialogOpen(false)} user={{ email }} />
    </Box>
  );
};

export default Login; 