import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, MenuItem, Select, InputLabel, FormControl, OutlinedInput, Chip, Avatar, IconButton, Box,
  Typography, CircularProgress, Snackbar, Alert
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { de } from 'date-fns/locale';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import CancelIcon from '@mui/icons-material/Cancel';
import { colors } from '../theme/colors';

// Konstanten für die Bildvalidierung
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];

const taetigkeitsbereicheOptionen = [
  'Haftpflichtschäden', 'Kaskoschäden', 'Unfallrekonstruktion', 'Fahrzeugbewertung',
  'Oldtimergutachten', 'Beweissicherung', 'Gebrauchtwagencheck', 'Technische Fahrzeugprüfung',
  'Wertgutachten', 'Lackschäden', 'Hagelschäden', 'Brandschäden', 'Leasingrückgabe',
  'Motorschäden', 'Getriebeschäden', 'Elektronikschäden', 'Restwertermittlung'
];
const regionenOptionen = [
  'Köln', 'Düsseldorf', 'Dortmund', 'Essen', 'Duisburg', 'Bochum', 'Wuppertal', 'Bonn',
  'Münster', 'Mönchengladbach', 'Aachen', 'Bielefeld', 'Gelsenkirchen', 'Krefeld',
  'Oberhausen', 'Hagen', 'Hamm', 'Mülheim an der Ruhr', 'Leverkusen', 'Solingen', 'Herne',
  'Neuss', 'Paderborn', 'Recklinghausen', 'Bottrop', 'Remscheid', 'Bergisch Gladbach',
  'Siegen', 'Witten', 'Iserlohn'
];

// Gemeinsame Textfeld-Styles für Konsistenz
const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    '&.Mui-focused fieldset': {
      borderColor: colors.primary.main,
    },
    '&:hover fieldset': {
      borderColor: colors.primary.light,
    }
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: colors.secondary.main
  }
};

// Gemeinsame Select-Styles
const selectSx = {
  '& .MuiOutlinedInput-root': {
    '&.Mui-focused fieldset': {
      borderColor: colors.primary.main,
    },
    '&:hover fieldset': {
      borderColor: colors.primary.light,
    }
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: colors.secondary.main
  },
  '& .MuiChip-root': {
    backgroundColor: colors.primary.main,
    color: colors.text.onPrimary,
    fontWeight: 500,
    '& .MuiChip-deleteIcon': {
      color: colors.text.onPrimary,
      '&:hover': {
        color: colors.secondary.main
      }
    }
  }
};

export default function EditProfil({ open, onClose, user, onSave }) {
  const [form, setForm] = useState({
    vorname: user?.vorname || '',
    nachname: user?.nachname || '',
    geburtsdatum: user?.geburtsdatum ? new Date(user.geburtsdatum) : null,
    telefon: user?.telefon || '',
    email: user?.email || '',
    firma: user?.versicherung || '',
    versicherung: user?.versicherung || '',
    regionen: user?.regionen || [],
    taetigkeitsbereiche: user?.taetigkeitsbereiche || [],
    profilbild: user?.profilbild || '',
    profilbildFile: null
  });
  
  const [imageUploading, setImageUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [temporaryUrl, setTemporaryUrl] = useState('');

  // Bereinige temporäre URLs beim Schließen/Unmount der Komponente
  useEffect(() => {
    return () => {
      if (temporaryUrl) {
        URL.revokeObjectURL(temporaryUrl);
      }
    };
  }, [temporaryUrl]);

  // Initialisiere Formular, wenn sich der User ändert
  useEffect(() => {
    if (user) {
      setForm({
        vorname: user.vorname || '',
        nachname: user.nachname || '',
        geburtsdatum: user.geburtsdatum ? new Date(user.geburtsdatum) : null,
        telefon: user.telefon || '',
        email: user.email || '',
        firma: user.firma || '',
        versicherung: user.versicherung || '',
        regionen: user.regionen || [],
        taetigkeitsbereiche: user.taetigkeitsbereiche || [],
        profilbild: user.profilbild || '',
        profilbildFile: null
      });
    }
  }, [user]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };
  
  const handleDateChange = date => setForm(f => ({ ...f, geburtsdatum: date }));
  
  const handleRegionenChange = e => setForm(f => ({ 
    ...f, 
    regionen: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value 
  }));
  
  const handleTaetigkeitsbereicheChange = e => setForm(f => ({ 
    ...f, 
    taetigkeitsbereiche: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value 
  }));
  
  const handleProfilbildChange = e => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validiere Dateityp
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setSnackbar({
          open: true, 
          message: 'Ungültiges Bildformat. Erlaubt sind JPG, PNG und GIF.',
          severity: 'error'
        });
        return;
      }
      
      // Validiere Dateigröße
      if (file.size > MAX_FILE_SIZE) {
        setSnackbar({
          open: true, 
          message: 'Die Datei ist zu groß. Maximale Größe: 5 MB.',
          severity: 'error'
        });
        return;
      }
      
      // Bereinige vorherige temporäre URL
      if (temporaryUrl) {
        URL.revokeObjectURL(temporaryUrl);
      }
      
      // Simuliere Upload-Prozess (in einer echten App würde hier der Bildupload stattfinden)
      setImageUploading(true);
      
      const newTempUrl = URL.createObjectURL(file);
      setTemporaryUrl(newTempUrl);
      
      // Simuliere verzögertes Laden
      setTimeout(() => {
        setForm(f => ({ 
          ...f, 
          profilbildFile: file, 
          profilbild: newTempUrl 
        }));
        setImageUploading(false);
        setSnackbar({
          open: true,
          message: 'Bild erfolgreich geladen',
          severity: 'success'
        });
      }, 800);
    }
  };
  
  const handleRemoveImage = () => {
    if (temporaryUrl) {
      URL.revokeObjectURL(temporaryUrl);
      setTemporaryUrl('');
    }
    
    setForm(f => ({ 
      ...f, 
      profilbildFile: null, 
      profilbild: '' 
    }));
    
    setSnackbar({
      open: true,
      message: 'Bild entfernt',
      severity: 'info'
    });
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Prüfe die E-Mail-Adresse
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setSnackbar({
        open: true,
        message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
        severity: 'error'
      });
      return;
    }
    // Prüfe die Telefonnummer (einfache Validierung)
    if (form.telefon && !/^[+\d\s()-]{8,20}$/.test(form.telefon)) {
      setSnackbar({
        open: true,
        message: 'Bitte geben Sie eine gültige Telefonnummer ein',
        severity: 'error'
      });
      return;
    }
    // Daten an übergeordnete Komponente senden
    const result = await onSave(form);
    if (typeof result === 'string' && result.length > 0) {
      setSnackbar({
        open: true,
        message: result,
        severity: 'error'
      });
      return;
    }
    // Erfolgsrückmeldung
    setSnackbar({
      open: true,
      message: 'Profil erfolgreich gespeichert',
      severity: 'success'
    });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: colors.shadows.md
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: colors.background.gradientBlue,
        color: colors.accent.white,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        py: 2
      }}>
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          Profil bearbeiten
        </Typography>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3, pb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sx={{ textAlign: 'center', mb: 1 }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar 
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    mx: 'auto', 
                    mb: 1,
                    bgcolor: colors.secondary.light,
                    border: `3px solid ${colors.primary.main}`,
                    boxShadow: colors.shadows.sm
                  }}
                >
                  {form.vorname && form.nachname ? 
                    `${form.vorname.charAt(0)}${form.nachname.charAt(0)}` : 'GP'}
                </Avatar>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                name="vorname" 
                label="Vorname" 
                value={form.vorname} 
                onChange={handleChange} 
                fullWidth 
                required 
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                name="nachname" 
                label="Nachname" 
                value={form.nachname} 
                onChange={handleChange} 
                fullWidth 
                required 
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
                <DatePicker
                  label="Geburtsdatum"
                  value={form.geburtsdatum}
                  onChange={handleDateChange}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true,
                      sx: textFieldSx
                    } 
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                name="telefon" 
                label="Telefonnummer" 
                value={form.telefon} 
                onChange={handleChange} 
                fullWidth 
                required 
                sx={textFieldSx}
                helperText="Format: +49 123 4567890"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                name="email" 
                label="E-Mail-Adresse" 
                value={form.email} 
                onChange={handleChange} 
                fullWidth 
                required 
                sx={textFieldSx}
                type="email"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                name="firma" 
                label="Organisation / Firma" 
                value={form.firma} 
                onChange={handleChange} 
                fullWidth 
                required 
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={selectSx}>
                <InputLabel id="regionen-label">Tätigkeitsregionen</InputLabel>
                <Select
                  labelId="regionen-label"
                  multiple
                  value={form.regionen}
                  onChange={handleRegionenChange}
                  input={<OutlinedInput label="Tätigkeitsregionen" />}
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map(value => (
                        <Chip 
                          key={value} 
                          label={value} 
                          sx={{ 
                            backgroundColor: colors.primary.main,
                            color: colors.text.onPrimary,
                            fontWeight: 500,
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  MenuProps={{
                    PaperProps: {
                      style: { maxHeight: 300 },
                    }
                  }}
                >
                  {regionenOptionen.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth sx={selectSx}>
                <InputLabel id="taetigkeitsbereiche-label">Tätigkeitsbereiche</InputLabel>
                <Select
                  labelId="taetigkeitsbereiche-label"
                  multiple
                  value={form.taetigkeitsbereiche}
                  onChange={handleTaetigkeitsbereicheChange}
                  input={<OutlinedInput label="Tätigkeitsbereiche" />}
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map(value => (
                        <Chip 
                          key={value} 
                          label={value}
                          sx={{ 
                            backgroundColor: colors.primary.main,
                            color: colors.text.onPrimary,
                            fontWeight: 500,
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  MenuProps={{
                    PaperProps: {
                      style: { maxHeight: 300 },
                    }
                  }}
                >
                  {taetigkeitsbereicheOptionen.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid rgba(0,0,0,0.08)` }}>
          <Button 
            onClick={onClose}
            sx={{ 
              color: colors.secondary.main, 
              fontWeight: 500,
              '&:hover': {
                backgroundColor: colors.hover.blue
              }
            }}
          >
            Abbrechen
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={imageUploading}
            sx={{ 
              bgcolor: colors.primary.main,
              color: colors.text.onPrimary,
              fontWeight: 600,
              '&:hover': { 
                bgcolor: colors.primary.dark 
              },
              boxShadow: colors.shadows.sm
            }}
          >
            Speichern
          </Button>
        </DialogActions>
      </form>
      
      {/* Feedback-Nachrichten */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
} 