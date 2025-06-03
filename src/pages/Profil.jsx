import * as React from 'react';
import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import Badge from '@mui/material/Badge';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import EditProfil from '../components/EditProfil';
import ChangePasswordDialog from '../components/ChangePasswordDialog';
import DeleteAccountDialog from '../components/DeleteAccountDialog';
import { authService } from '../services/api';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const tabLabels = [
  'Persönlich',
  'Beruflich',
  'Benachrichtigungen',
  'System',
];

export default function Profil() {
  const { user, updateProfile, setUser } = useAuth();
  const [tab, setTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Beim Öffnen der Seite oder User-Wechsel: Userdaten vom Server laden und aktualisieren
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await authService.getProfile();
        if (res.erfolg && res.benutzer) {
          localStorage.setItem('user', JSON.stringify(res.benutzer));
          setUser(res.benutzer); // Context-User aktualisieren
        }
      } catch (err) {
        // Fehler ignorieren, falls nicht eingeloggt
      }
    }
    fetchProfile();
  }, [user?.email]);

  // Handler für manuelles Nachladen
  const handleRefreshProfile = async () => {
    try {
      const res = await authService.getProfile();
      console.log('Profil-API-Response:', res);
      if (res.erfolg && res.benutzer) {
        localStorage.setItem('user', JSON.stringify(res.benutzer));
        setUser(res.benutzer);
        setSnackbar({ open: true, message: 'Status erfolgreich aktualisiert.', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Fehler beim Aktualisieren des Status.', severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Fehler beim Aktualisieren des Status.', severity: 'error' });
    }
  };

  if (!user) return null;
  // Handler für Speichern
  const handleSaveProfil = async (form) => {
    let profilbildUrl = user.profilbild;
    // 1. Bild separat hochladen, falls vorhanden
    if (form.profilbildFile) {
      const formData = new FormData();
      formData.append('file', form.profilbildFile);
      formData.append('gutachterNummer', user.gutachterNummer); // Gutachternummer mitsenden!
      const res = await fetch('/api/users/profile/picture', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      let data;
      try {
        data = await res.json();
      } catch (err) {
        data = { erfolg: false, nachricht: 'Fehler beim Parsen der Serverantwort' };
      }
      if (!res.ok || !data.erfolg) {
        alert(data.nachricht || 'Fehler beim Hochladen des Profilbilds');
        return;
      }
      if (data.profilbild) {
        profilbildUrl = data.profilbild;
      }
    }
    // 2. Profil aktualisieren (ohne das File-Objekt!)
    await updateProfile({
      ...form,
      geburtsdatum: form.geburtsdatum ? form.geburtsdatum.toISOString() : '',
      profilbild: profilbildUrl,
      profilbildFile: undefined
    });
    setEditOpen(false);
  };
  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '80vh' }}>
      <Box sx={{ width: '100%', maxWidth: '1200px', px: { xs: 1, sm: 2, md: 3 }, py: 4 }}>
        <Grid container spacing={3} justifyContent="center" alignItems="flex-start">
          {/* Linke Seite: Profilbild & Übersicht */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, boxShadow: colors.shadows.sm, mb: 3, textAlign: 'center', background: '#fff' }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  user.aktiviert ? (
                    <CheckCircleIcon sx={{ color: colors.primary.main, fontSize: 32, bgcolor: '#fff', borderRadius: '50%' }} />
                  ) : (
                    <ErrorIcon sx={{ color: '#d32f2f', fontSize: 32, bgcolor: '#fff', borderRadius: '50%' }} />
                  )
                }
              >
                <Avatar
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 2, fontSize: 48, bgcolor: colors.primary.main, color: colors.text.onPrimary }}
                >
                  {user.vorname?.[0] || 'G'}
                </Avatar>
              </Badge>
              <Typography variant="h5" sx={{ fontWeight: 600, color: colors.secondary.main, mb: 1 }}>
                {user.vorname} {user.nachname}
              </Typography>
              <Typography variant="body2" sx={{ color: user.aktiviert ? colors.primary.main : '#d32f2f', mb: 1 }}>
                {user.aktiviert ? 'Verifiziert' : 'Nicht verifiziert'}
              </Typography>
              {!user.aktiviert && (
                <Typography variant="body2" sx={{ color: '#d32f2f', mb: 2 }}>
                  Bitte aktivieren Sie Ihr Konto über den Link in Ihrer E-Mail.
                </Typography>
              )}
              <Typography variant="subtitle1" sx={{ color: colors.secondary.light, mb: 2 }}>
                KFZ-Gutachter
              </Typography>
              <Divider sx={{ my: 2 }} />
              {(!user.aktiviert) && (
                <Button variant="outlined" size="small" sx={{ mb: 2 }} onClick={handleRefreshProfile}>
                  Status aktualisieren
                </Button>
              )}
            </Paper>
          </Grid>
          {/* Rechte Seite: Tabs */}
          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, boxShadow: colors.shadows.sm, background: '#fff' }}>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  mb: 3,
                  '& .MuiTabs-indicator': { background: colors.primary.main },
                  '& .MuiTab-root': {
                    color: colors.secondary.light,
                    '&.Mui-selected': { color: colors.primary.main, fontWeight: 600 },
                  },
                }}
              >
                {tabLabels.map((label, i) => (
                  <Tab key={label} label={label} />
                ))}
              </Tabs>
              {/* Persönlich */}
              {tab === 0 && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Vorname</Typography>
                      <Typography variant="body1">{user.vorname}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Nachname</Typography>
                      <Typography variant="body1">{user.nachname}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Geburtsdatum</Typography>
                      <Typography variant="body1">{user.geburtsdatum ? (typeof user.geburtsdatum === 'string' ? new Date(user.geburtsdatum).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '') : ''}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Telefonnummer</Typography>
                      <Typography variant="body1">{user.telefon}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">E-Mail-Adresse</Typography>
                      <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {user.email}
                        {user.aktiviert ? (
                          <CheckCircleIcon sx={{ color: colors.primary.main, fontSize: 18 }} />
                        ) : (
                          <ErrorIcon sx={{ color: '#d32f2f', fontSize: 18 }} />
                        )}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Berufsbezeichnung</Typography>
                      <Typography variant="body1">KFZ-Gutachter</Typography>
                    </Grid>
                  </Grid>
                  <Button variant="outlined" startIcon={<EditIcon />} sx={{ mt: 3, color: colors.secondary.main, borderColor: colors.secondary.light, '&:hover': { borderColor: colors.secondary.main, bgcolor: colors.hover.blue } }} onClick={() => setEditOpen(true)}>
                    Bearbeiten
                  </Button>
                </Box>
              )}
              {/* Beruflich */}
              {tab === 1 && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Organisation / Firma</Typography>
                      <Typography variant="body1">{user.firma}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Tätigkeitsregion</Typography>
                      <Typography variant="body1">{user.regionen ? user.regionen.join(', ') : ''}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Tätigkeitsbereiche</Typography>
                      <Typography variant="body1">{user.taetigkeitsbereiche ? user.taetigkeitsbereiche.join(', ') : ''}</Typography>
                    </Grid>
                  </Grid>
                  <Button variant="outlined" startIcon={<EditIcon />} sx={{ mt: 3, color: colors.secondary.main, borderColor: colors.secondary.light, '&:hover': { borderColor: colors.secondary.main, bgcolor: colors.hover.blue } }} onClick={() => setEditOpen(true)}>
                    Bearbeiten
                  </Button>
                </Box>
              )}
              {/* Benachrichtigungen */}
              {tab === 2 && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Sprache</Typography>
                      <Typography variant="body1">{user.sprache || 'Deutsch'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Zeitzone</Typography>
                      <Typography variant="body1">{user.zeitzone || 'Europe/Berlin'}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
              {/* System */}
              {tab === 3 && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Benutzerrolle</Typography>
                      <Typography variant="body1">{user.rolle}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Konto-Status</Typography>
                      <Typography variant="body1">{user.aktiviert ? 'Verifiziert' : 'Nicht verifiziert'}</Typography>
                    </Grid>
                  </Grid>
                  <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                    <Button variant="outlined" color="primary" sx={{ borderColor: colors.primary.main, color: colors.primary.main, '&:hover': { bgcolor: colors.hover.green } }} onClick={() => setChangePasswordOpen(true)}>
                      Passwort ändern
                    </Button>
                    <Button variant="outlined" color="error" sx={{ borderColor: '#d32f2f', color: '#d32f2f', '&:hover': { bgcolor: colors.hover.green } }} onClick={() => setDeleteAccountOpen(true)}>
                      Konto löschen
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
        {/* EditProfil Dialog */}
        <EditProfil open={editOpen} onClose={() => setEditOpen(false)} user={user} onSave={handleSaveProfil} />
        <ChangePasswordDialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} user={user} />
        <DeleteAccountDialog open={deleteAccountOpen} onClose={() => setDeleteAccountOpen(false)} user={user} />
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
} 