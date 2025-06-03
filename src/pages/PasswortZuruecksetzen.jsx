import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, Paper, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { colors } from '../theme/colors';
import api from '../services/api';

export default function PasswortZuruecksetzen() {
  const { token } = useParams();
  const [passwort, setPasswort] = useState('');
  const [passwortBestaetigen, setPasswortBestaetigen] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const validatePassword = (pw) => {
    const minLength = pw.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pw);
    const hasNumber = /\d/.test(pw);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pw);
    if (!minLength || !hasUpperCase || !hasNumber || !hasSpecialChar) {
      return 'Passwort muss mindestens 8 Zeichen, 1 Großbuchstaben, 1 Zahl und 1 Sonderzeichen enthalten.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const pwError = validatePassword(passwort);
    if (pwError) {
      setError(pwError);
      return;
    }
    if (passwort !== passwortBestaetigen) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/users/reset-password', { token, neuesPasswort: passwort });
      if (res.data.erfolg) {
        setSuccess(true);
        setMessage(res.data.nachricht);
      } else {
        setError(res.data.nachricht || 'Fehler beim Zurücksetzen des Passworts.');
      }
    } catch (err) {
      setError(err.response?.data?.nachricht || 'Fehler beim Zurücksetzen des Passworts.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', py: 4, backgroundColor: colors.background.paper + '10' }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: colors.secondary.main, mb: 2 }}>
          Passwort zurücksetzen
        </Typography>
        {success ? (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>{message || 'Passwort erfolgreich geändert.'}</Alert>
            <Button component={Link} to="/login" variant="contained" sx={{ mt: 2, bgcolor: colors.primary.main, color: colors.text.onPrimary, fontWeight: 600 }}>
              Zum Login
            </Button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <TextField
              label="Neues Passwort"
              type="password"
              value={passwort}
              onChange={e => setPasswort(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Passwort bestätigen"
              type="password"
              value={passwortBestaetigen}
              onChange={e => setPasswortBestaetigen(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ bgcolor: colors.primary.main, color: colors.text.onPrimary, fontWeight: 600 }}>
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Passwort speichern'}
            </Button>
          </form>
        )}
      </Paper>
    </Box>
  );
} 