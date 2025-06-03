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
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  Divider,
  Tooltip,
  OutlinedInput,
  Chip
} from '@mui/material';
import { Visibility, VisibilityOff, Info, Check } from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { de } from 'date-fns/locale';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/Logo Kopie.png';

const Register = () => {
  const [formData, setFormData] = useState({
    // Persönliche Informationen
    vorname: '',
    nachname: '',
    geburtsdatum: null,
    telefon: '',
    email: '',
    passwort: '',
    passwortBestaetigen: '',
    
    // Berufliche Angaben
    firma: '',
    regionen: [],
    taetigkeitsbereiche: [],
    webseite: '',
    fachgebiet: 'KFZ',
    
    // Zustimmungen
    agbAkzeptiert: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState('');
  const { register, loading, error } = useAuth();

  const taetigkeitsbereicheOptionen = [
    'Haftpflichtschäden',
    'Kaskoschäden',
    'Unfallrekonstruktion',
    'Fahrzeugbewertung',
    'Oldtimergutachten',
    'Beweissicherung',
    'Gebrauchtwagencheck',
    'Technische Fahrzeugprüfung',
    'Wertgutachten',
    'Lackschäden',
    'Hagelschäden',
    'Brandschäden',
    'Leasingrückgabe',
    'Motorschäden',
    'Getriebeschäden',
    'Elektronikschäden',
    'Restwertermittlung'
  ];
  
  const regionenOptionen = [
    'Köln',
    'Düsseldorf',
    'Dortmund',
    'Essen',
    'Duisburg',
    'Bochum',
    'Wuppertal',
    'Bonn',
    'Münster',
    'Mönchengladbach',
    'Aachen',
    'Bielefeld',
    'Gelsenkirchen',
    'Krefeld',
    'Oberhausen',
    'Hagen',
    'Hamm',
    'Mülheim an der Ruhr',
    'Leverkusen',
    'Solingen',
    'Herne',
    'Neuss',
    'Paderborn',
    'Recklinghausen',
    'Bottrop',
    'Remscheid',
    'Bergisch Gladbach',
    'Siegen',
    'Witten',
    'Iserlohn'
  ];

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    
    // Für Checkboxen
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Fehler zurücksetzen, wenn Feld bearbeitet wird
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };
  
  const handleTaetigkeitsbereicheChange = (event) => {
    const { value } = event.target;
    setFormData({ ...formData, taetigkeitsbereiche: typeof value === 'string' ? value.split(',') : value });
    
    if (formErrors.taetigkeitsbereiche) {
      setFormErrors({ ...formErrors, taetigkeitsbereiche: '' });
    }
  };
  
  const handleRegionenChange = (event) => {
    const { value } = event.target;
    setFormData({ ...formData, regionen: typeof value === 'string' ? value.split(',') : value });
    
    if (formErrors.regionen) {
      setFormErrors({ ...formErrors, regionen: '' });
    }
  };
  
  const handleDateChange = (date) => {
    setFormData({ ...formData, geburtsdatum: date });
    
    if (formErrors.geburtsdatum) {
      setFormErrors({ ...formErrors, geburtsdatum: '' });
    }
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const isValid = minLength && hasUpperCase && hasNumber && hasSpecialChar;
    
    if (!isValid) {
      let errorMsg = 'Passwort muss ';
      const errors = [];
      
      if (!minLength) errors.push('mindestens 8 Zeichen');
      if (!hasUpperCase) errors.push('mindestens einen Großbuchstaben');
      if (!hasNumber) errors.push('mindestens eine Zahl');
      if (!hasSpecialChar) errors.push('mindestens ein Sonderzeichen');
      
      errorMsg += errors.join(', ') + ' enthalten';
      return { isValid, errorMsg };
    }
    
    return { isValid, errorMsg: '' };
  };

  const validateForm = () => {
    const errors = {};
    
    // Persönliche Informationen validieren
    if (!formData.vorname.trim()) errors.vorname = 'Vorname ist erforderlich';
    if (!formData.nachname.trim()) errors.nachname = 'Nachname ist erforderlich';
    if (!formData.telefon.trim()) errors.telefon = 'Telefonnummer ist erforderlich';
    
    if (!formData.email.trim()) {
      errors.email = 'E-Mail ist erforderlich';
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      errors.email = 'Ungültige E-Mail-Adresse';
    }
    
    // Passwort validieren
    if (!formData.passwort) {
      errors.passwort = 'Passwort ist erforderlich';
    } else {
      const { isValid, errorMsg } = validatePassword(formData.passwort);
      if (!isValid) {
        errors.passwort = errorMsg;
      }
    }
    
    if (formData.passwort !== formData.passwortBestaetigen) {
      errors.passwortBestaetigen = 'Passwörter stimmen nicht überein';
    }
    
    // Berufliche Angaben validieren
    if (!formData.firma.trim()) errors.firma = 'Name der Organisation/Firma ist erforderlich';
    if (!formData.regionen.length) errors.regionen = 'Mindestens eine Tätigkeitsregion ist erforderlich';
    if (!formData.taetigkeitsbereiche.length) errors.taetigkeitsbereiche = 'Mindestens ein KFZ-Tätigkeitsbereich ist erforderlich';
    
    // Zustimmungen validieren
    if (!formData.agbAkzeptiert) errors.agbAkzeptiert = 'Sie müssen die AGB und Datenschutzerklärung akzeptieren';
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Passwort bestätigen und AGB-Zustimmung entfernen, bevor es an den Server gesendet wird
    const { passwortBestaetigen, agbAkzeptiert, ...registerData } = formData;
    
    try {
      const result = await register({
        ...registerData,
        aktivierungsToken: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        aktiviert: false
      });
      
      if (result && result.success) {
        setRegistrationSuccess(true);
        setRegistrationMessage(result.message);
      }
    } catch (error) {
      console.error('Registrierungsfehler:', error);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        background: colors.background.gradientGreen,
        py: 4,
        overflowY: 'auto',
        zIndex: 1300
      }}
    >
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
          boxShadow: colors.shadows.md,
          maxWidth: 500,
          width: '100%',
          mx: 'auto'
        }}
      >
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <img src={logo} alt="Rechtly Logo" style={{ width: 200, marginBottom: 16 }} />
          <Typography component="h1" variant="h5" sx={{ 
            fontWeight: 600,
            color: colors.secondary.main
          }}>
            Registrieren
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: colors.secondary.light }}>
            Erstellen Sie ein Konto für das Gutachterportal
          </Typography>
        </Box>

        {registrationSuccess && (
          <Alert severity="success" sx={{ width: '100%', mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              {registrationMessage || 'Ihre Registrierung war erfolgreich! Bitte prüfen Sie Ihr Postfach und aktivieren Sie Ihr Konto über den Link in der E-Mail.'}<br />
              Anschließend können Sie sich anmelden.
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Button
                variant="contained"
                sx={{ 
                  mt: 1,
                  backgroundColor: colors.primary.main, 
                  color: colors.accent.white, 
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: colors.primary.dark,
                    color: colors.accent.white
                  }
                }}
                component={Link}
                to="/login"
              >
                Zum Login
              </Button>
            </Box>
          </Alert>
        )}
        {!registrationSuccess && error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
            <br />
            Falls Sie eine Aktivierungs-E-Mail erhalten haben, können Sie Ihr Konto trotzdem aktivieren.
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <Typography variant="h6" sx={{ 
            mt: 2, 
            mb: 2, 
            color: colors.secondary.main,
            fontWeight: 500
          }}>
            🧍‍♂️ Persönliche Informationen
          </Typography>
          
          <Grid container spacing={2} justifyContent="center" alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="vorname"
                label="Vorname"
                name="vorname"
                autoComplete="given-name"
                value={formData.vorname}
                onChange={handleChange}
                error={!!formErrors.vorname}
                helperText={formErrors.vorname}
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="nachname"
                label="Nachname"
                name="nachname"
                autoComplete="family-name"
                value={formData.nachname}
                onChange={handleChange}
                error={!!formErrors.nachname}
                helperText={formErrors.nachname}
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
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
                <DatePicker
                  label="Geburtsdatum (optional)"
                  value={formData.geburtsdatum}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined',
                      error: !!formErrors.geburtsdatum,
                      helperText: formErrors.geburtsdatum,
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: colors.primary.main,
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: colors.secondary.main,
                        }
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="telefon"
                label="Telefonnummer"
                name="telefon"
                autoComplete="tel"
                value={formData.telefon}
                onChange={handleChange}
                error={!!formErrors.telefon}
                helperText={formErrors.telefon}
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
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="E-Mail-Adresse"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
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
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="passwort"
                label="Passwort"
                type={showPassword ? 'text' : 'password'}
                id="passwort"
                autoComplete="new-password"
                value={formData.passwort}
                onChange={handleChange}
                error={!!formErrors.passwort}
                helperText={formErrors.passwort}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Passwort muss mindestens 8 Zeichen, 1 Großbuchstaben, 1 Zahl und 1 Sonderzeichen enthalten">
                        <IconButton edge="end">
                          <Info fontSize="small" sx={{ color: colors.secondary.light }} />
                        </IconButton>
                      </Tooltip>
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
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="passwortBestaetigen"
                label="Passwort bestätigen"
                type={showPassword ? 'text' : 'password'}
                id="passwortBestaetigen"
                autoComplete="new-password"
                value={formData.passwortBestaetigen}
                onChange={handleChange}
                error={!!formErrors.passwortBestaetigen}
                helperText={formErrors.passwortBestaetigen}
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
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3, borderColor: colors.secondary.light + '30' }} />
          
          <Typography variant="h6" sx={{ 
            mt: 2, 
            mb: 2, 
            color: colors.secondary.main,
            fontWeight: 500
          }}>
            🚗 Berufliche Angaben als KFZ-Gutachter
          </Typography>
          
          <Grid container spacing={2} justifyContent="center" alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="firma"
                label="Name der Organisation / Firma"
                name="firma"
                value={formData.firma}
                onChange={handleChange}
                error={!!formErrors.firma}
                helperText={formErrors.firma}
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
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!formErrors.regionen} sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: colors.primary.main,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: colors.secondary.main,
                }
              }}>
                <InputLabel id="regionen-label">Tätigkeitsregionen</InputLabel>
                <Select
                  labelId="regionen-label"
                  id="regionen"
                  multiple
                  value={formData.regionen}
                  onChange={handleRegionenChange}
                  input={<OutlinedInput label="Tätigkeitsregionen" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={value} 
                          sx={{ 
                            backgroundColor: colors.primary.main + '20',
                            color: colors.secondary.main,
                            '& .MuiChip-deleteIcon': {
                              color: colors.secondary.light,
                              '&:hover': {
                                color: colors.secondary.main,
                              }
                            }
                          }}
                        />
                      ))}
                    </Box>
                  )}
                >
                  {regionenOptionen.map((option) => {
                    const selected = formData.regionen.includes(option);
                    return (
                      <MenuItem
                        key={option}
                        value={option}
                        sx={selected ? {
                          backgroundColor: colors.primary.main,
                          color: colors.secondary.main,
                          fontWeight: 700,
                          '&:hover': {
                            backgroundColor: colors.primary.dark,
                            color: colors.secondary.main,
                          }
                        } : {}}
                      >
                        {selected && (
                          <Check fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        )}
                        {option}
                      </MenuItem>
                    );
                  })}
                </Select>
                {formErrors.regionen && (
                  <FormHelperText>{formErrors.regionen}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth required error={!!formErrors.taetigkeitsbereiche} sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: colors.primary.main,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: colors.secondary.main,
                }
              }}>
                <InputLabel id="taetigkeitsbereiche-label">KFZ-Tätigkeitsbereiche</InputLabel>
                <Select
                  labelId="taetigkeitsbereiche-label"
                  id="taetigkeitsbereiche"
                  multiple
                  value={formData.taetigkeitsbereiche}
                  onChange={handleTaetigkeitsbereicheChange}
                  input={<OutlinedInput label="KFZ-Tätigkeitsbereiche" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={value} 
                          sx={{ 
                            backgroundColor: colors.primary.main + '20',
                            color: colors.secondary.main,
                            '& .MuiChip-deleteIcon': {
                              color: colors.secondary.light,
                              '&:hover': {
                                color: colors.secondary.main,
                              }
                            }
                          }}
                        />
                      ))}
                    </Box>
                  )}
                >
                  {taetigkeitsbereicheOptionen.map((option) => {
                    const selected = formData.taetigkeitsbereiche.includes(option);
                    return (
                      <MenuItem
                        key={option}
                        value={option}
                        sx={selected ? {
                          backgroundColor: colors.primary.main,
                          color: colors.secondary.main,
                          fontWeight: 700,
                          '&:hover': {
                            backgroundColor: colors.primary.dark,
                            color: colors.secondary.main,
                          }
                        } : {}}
                      >
                        {selected && (
                          <Check fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        )}
                        {option}
                      </MenuItem>
                    );
                  })}
                </Select>
                {formErrors.taetigkeitsbereiche && (
                  <FormHelperText>{formErrors.taetigkeitsbereiche}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="webseite"
                label="Webseite (optional)"
                name="webseite"
                value={formData.webseite}
                onChange={handleChange}
                error={!!formErrors.webseite}
                helperText={formErrors.webseite}
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
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3, borderColor: colors.secondary.light + '30' }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="agbAkzeptiert"
                    checked={formData.agbAkzeptiert}
                    onChange={handleChange}
                    sx={{
                      color: colors.secondary.light,
                      '&.Mui-checked': {
                        color: colors.primary.main,
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: colors.secondary.main }}>
                    Ich akzeptiere die{' '}
                    <Link to="/agb" target="_blank" style={{ color: colors.primary.main }}>
                      AGB
                    </Link>{' '}
                    und die{' '}
                    <Link to="/datenschutz" target="_blank" style={{ color: colors.primary.main }}>
                      Datenschutzerklärung
                    </Link>
                  </Typography>
                }
              />
              {formErrors.agbAkzeptiert && (
                <FormHelperText error>{formErrors.agbAkzeptiert}</FormHelperText>
              )}
            </Grid>
          </Grid>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading || Object.keys(formErrors).length > 0}
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
            {loading ? <CircularProgress size={24} sx={{ color: colors.secondary.main }} /> : 'Registrieren'}
          </Button>

          <Grid container justifyContent="center" sx={{ mt: 2 }}>
            <Grid item>
              <Link to="/login" style={{ textDecoration: 'none', color: colors.primary.main }}>
                <Typography variant="body2" sx={{ 
                  color: colors.secondary.main,
                  '&:hover': {
                    color: colors.primary.main
                  }
                }}>
                  Bereits ein Konto? Anmelden
                </Typography>
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default Register; 