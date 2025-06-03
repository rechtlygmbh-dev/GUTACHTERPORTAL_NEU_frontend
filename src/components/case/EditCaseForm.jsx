import * as React from 'react';
import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { colors } from '../../theme/colors';
import { updateCase } from '../../services/caseService';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function EditCaseForm({ open, handleClose, fallDaten, onSave }) {
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    // Mandantendaten
    vorname: '',
    nachname: '',
    email: '',
    telefon: '',
    adresse: '',
    geburtsdatum: '',
    
    // Versicherungsinformationen Erste Partei
    erstParteiVorname: '',
    erstParteiNachname: '',
    erstParteiVersicherung: '',
    erstParteiKennzeichen: '',
    erstParteiFahrzeughalter: '',
    erstParteiKfzModell: '',
    erstParteiBeteiligungsposition: '',
    
    // Versicherungsinformationen Zweite Partei
    zweitParteiVorname: '',
    zweitParteiNachname: '',
    zweitParteiVersicherung: '',
    zweitParteiKennzeichen: '',
    zweitParteiBeteiligungsposition: '',
    
    // Schadensinformationen
    schadenstyp: '',
    schadensschwere: '',
    schadensbeschreibung: '',
    unfallort: '',
    unfallzeit: '',
    
    // Allgemeine Falldaten
    fallname: '',
    aktenzeichen: '',
    status: 'Offen',
    datum: new Date().toISOString().split('T')[0],
  });

  const [error, setError] = useState('');

  // Lade die Falldaten, wenn sie verfügbar sind
  useEffect(() => {
    if (fallDaten) {
      setFormData({
        // Mandantendaten
        vorname: fallDaten.mandant?.vorname || '',
        nachname: fallDaten.mandant?.nachname || '',
        email: fallDaten.mandant?.email || '',
        telefon: fallDaten.mandant?.telefon || '',
        adresse: fallDaten.mandant?.adresse || '',
        geburtsdatum: fallDaten.mandant?.geburtsdatum ? formatDateForInput(fallDaten.mandant.geburtsdatum) : '',
        
        // Versicherungsinformationen Erste Partei
        erstParteiVorname: fallDaten.erstPartei?.vorname || '',
        erstParteiNachname: fallDaten.erstPartei?.nachname || '',
        erstParteiVersicherung: fallDaten.erstPartei?.versicherung || '',
        erstParteiKennzeichen: fallDaten.erstPartei?.kennzeichen || '',
        erstParteiFahrzeughalter: fallDaten.erstPartei?.fahrzeughalter || '',
        erstParteiKfzModell: fallDaten.erstPartei?.kfzModell || '',
        erstParteiBeteiligungsposition: fallDaten.erstPartei?.beteiligungsposition || '',
        
        // Versicherungsinformationen Zweite Partei
        zweitParteiVorname: fallDaten.zweitPartei?.vorname || '',
        zweitParteiNachname: fallDaten.zweitPartei?.nachname || '',
        zweitParteiVersicherung: fallDaten.zweitPartei?.versicherung || '',
        zweitParteiKennzeichen: fallDaten.zweitPartei?.kennzeichen || '',
        zweitParteiBeteiligungsposition: fallDaten.zweitPartei?.beteiligungsposition || '',
        
        // Schadensinformationen
        schadenstyp: fallDaten.schaden?.schadenstyp || '',
        schadensschwere: fallDaten.schaden?.schadensschwere || '',
        schadensbeschreibung: fallDaten.schaden?.beschreibung || '',
        unfallort: fallDaten.schaden?.unfallort || '',
        unfallzeit: fallDaten.schaden?.unfallzeit ? formatDateTimeForInput(fallDaten.schaden.unfallzeit) : '',
        
        // Allgemeine Falldaten
        fallname: fallDaten.fallname || '',
        aktenzeichen: fallDaten.aktenzeichen || '',
        status: fallDaten.status || 'Offen',
        datum: fallDaten.datum ? formatDateForInput(fallDaten.datum) : new Date().toISOString().split('T')[0],
      });
    }
  }, [fallDaten]);

  // Hilfsfunktion zum Formatieren von Datum für Input-Felder
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    // Prüfen, ob das Datum im Format DD.MM.YYYY ist
    const germanDatePattern = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    if (germanDatePattern.test(dateString)) {
      const [_, day, month, year] = germanDatePattern.exec(dateString);
      return `${year}-${month}-${day}`;
    }
    
    return dateString;
  };

  // Hilfsfunktion zum Formatieren von Datum und Zeit für Input-Felder
  const formatDateTimeForInput = (dateTimeString) => {
    if (!dateTimeString) return '';
    
    // Prüfen, ob das Datum im Format DD.MM.YYYY, HH:MM Uhr ist
    const germanDateTimePattern = /^(\d{2})\.(\d{2})\.(\d{4}),\s*(\d{2}):(\d{2})\s*Uhr$/;
    if (germanDateTimePattern.test(dateTimeString)) {
      const [_, day, month, year, hour, minute] = germanDateTimePattern.exec(dateTimeString);
      return `${year}-${month}-${day}T${hour}:${minute}`;
    }
    
    return dateTimeString;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSubmit = async () => {
    // Validierung
    if (!formData.vorname || !formData.nachname || !formData.fallname) {
      setError('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    try {
      setError('');
      // Erstelle ein aktualisiertes Fallobjekt
      const updatedFall = {
        ...fallDaten,
        fallname: formData.fallname,
        aktenzeichen: formData.aktenzeichen,
        status: 'In Bearbeitung',
        datum: formData.datum,
        mandant: {
          vorname: formData.vorname,
          nachname: formData.nachname,
          email: formData.email,
          telefon: formData.telefon,
          adresse: formData.adresse,
          geburtsdatum: formData.geburtsdatum,
        },
        erstPartei: {
          vorname: formData.erstParteiVorname,
          nachname: formData.erstParteiNachname,
          versicherung: formData.erstParteiVersicherung,
          kennzeichen: formData.erstParteiKennzeichen,
          fahrzeughalter: formData.erstParteiFahrzeughalter,
          kfzModell: formData.erstParteiKfzModell,
          beteiligungsposition: formData.erstParteiBeteiligungsposition,
        },
        zweitPartei: {
          vorname: formData.zweitParteiVorname,
          nachname: formData.zweitParteiNachname,
          versicherung: formData.zweitParteiVersicherung,
          kennzeichen: formData.zweitParteiKennzeichen,
          beteiligungsposition: formData.zweitParteiBeteiligungsposition,
        },
        schaden: {
          schadenstyp: formData.schadenstyp,
          schadensschwere: formData.schadensschwere,
          beschreibung: formData.schadensbeschreibung,
          unfallort: formData.unfallort,
          unfallzeit: formData.unfallzeit,
        }
      };
      // API-Call zum Speichern in der DB
      const res = await updateCase(fallDaten._id, updatedFall);
      if (res.erfolg) {
        if (onSave) onSave(res.fall);
        handleClose();
      } else {
        setError(res.nachricht || 'Fehler beim Speichern der Änderungen');
      }
    } catch (err) {
      setError(err.response?.data?.nachricht || 'Fehler beim Speichern der Änderungen');
    }
  };

  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: colors.primary.main,
      },
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: colors.secondary.main,
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: colors.shadows.lg,
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          fontWeight: 600, 
          fontSize: '1.5rem',
          color: colors.secondary.main,
          bgcolor: '#f5f7fa',
          py: 2.5
        }}
      >
        Fall bearbeiten
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ px: 3, py: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="Formular-Tabs"
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: colors.primary.main,
              },
              '& .MuiTab-root': {
                color: colors.secondary.light,
                '&.Mui-selected': {
                  color: colors.secondary.main,
                  fontWeight: 600,
                },
              }
            }}
          >
            <Tab label="Allgemeine Daten" />
            <Tab label="Mandantendaten" />
            <Tab label="Erste Partei" />
            <Tab label="Zweite Partei" />
            <Tab label="Schadensinformationen" />
          </Tabs>
        </Box>
        
        {/* Tab 1: Allgemeine Falldaten */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: colors.secondary.main }}>
            Allgemeine Falldaten
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Fallname"
                name="fallname"
                value={formData.fallname}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Datum"
                name="datum"
                type="date"
                value={formData.datum}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                sx={textFieldSx}
              />
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Tab 2: Mandantendaten */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: colors.secondary.main }}>
            Mandantendaten
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Vorname"
                name="vorname"
                value={formData.vorname}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Nachname"
                name="nachname"
                value={formData.nachname}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="E-Mail"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefon"
                name="telefon"
                value={formData.telefon}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adresse"
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Geburtsdatum"
                name="geburtsdatum"
                type="date"
                value={formData.geburtsdatum}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                sx={textFieldSx}
              />
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Tab 3: Versicherungsinformationen Erste Partei */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: colors.secondary.main }}>
            Versicherungsinformationen Erste Partei
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vorname"
                name="erstParteiVorname"
                value={formData.erstParteiVorname}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nachname"
                name="erstParteiNachname"
                value={formData.erstParteiNachname}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Versicherung"
                name="erstParteiVersicherung"
                value={formData.erstParteiVersicherung}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Kennzeichen"
                name="erstParteiKennzeichen"
                value={formData.erstParteiKennzeichen}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fahrzeughalter"
                name="erstParteiFahrzeughalter"
                value={formData.erstParteiFahrzeughalter}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="KFZ Modell"
                name="erstParteiKfzModell"
                value={formData.erstParteiKfzModell}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" sx={textFieldSx}>
                <InputLabel>Beteiligungsposition</InputLabel>
                <Select
                  name="erstParteiBeteiligungsposition"
                  value={formData.erstParteiBeteiligungsposition}
                  onChange={handleChange}
                  label="Beteiligungsposition"
                >
                  <MenuItem value="Verursacher">Verursacher</MenuItem>
                  <MenuItem value="Geschädigter">Geschädigter</MenuItem>
                  <MenuItem value="Zeuge">Zeuge</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Tab 4: Versicherungsinformationen Zweite Partei */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: colors.secondary.main }}>
            Versicherungsinformationen Zweite Partei
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vorname"
                name="zweitParteiVorname"
                value={formData.zweitParteiVorname}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nachname"
                name="zweitParteiNachname"
                value={formData.zweitParteiNachname}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Versicherung"
                name="zweitParteiVersicherung"
                value={formData.zweitParteiVersicherung}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Kennzeichen"
                name="zweitParteiKennzeichen"
                value={formData.zweitParteiKennzeichen}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" sx={textFieldSx}>
                <InputLabel>Beteiligungsposition</InputLabel>
                <Select
                  name="zweitParteiBeteiligungsposition"
                  value={formData.zweitParteiBeteiligungsposition}
                  onChange={handleChange}
                  label="Beteiligungsposition"
                >
                  <MenuItem value="Verursacher">Verursacher</MenuItem>
                  <MenuItem value="Geschädigter">Geschädigter</MenuItem>
                  <MenuItem value="Zeuge">Zeuge</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Tab 5: Schadensinformationen */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: colors.secondary.main }}>
            Schadensinformationen
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" sx={textFieldSx}>
                <InputLabel>Schadenstyp</InputLabel>
                <Select
                  name="schadenstyp"
                  value={formData.schadenstyp}
                  onChange={handleChange}
                  label="Schadenstyp"
                >
                  <MenuItem value="Unfall">Unfall</MenuItem>
                  <MenuItem value="Wasserschaden">Wasserschaden</MenuItem>
                  <MenuItem value="Brandschaden">Brandschaden</MenuItem>
                  <MenuItem value="Diebstahl">Diebstahl</MenuItem>
                  <MenuItem value="Sonstiges">Sonstiges</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" sx={textFieldSx}>
                <InputLabel>Schadensschwere</InputLabel>
                <Select
                  name="schadensschwere"
                  value={formData.schadensschwere}
                  onChange={handleChange}
                  label="Schadensschwere"
                >
                  <MenuItem value="Leicht">Leicht</MenuItem>
                  <MenuItem value="Mittel">Mittel</MenuItem>
                  <MenuItem value="Schwer">Schwer</MenuItem>
                  <MenuItem value="Totalschaden">Totalschaden</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Schadensbeschreibung"
                name="schadensbeschreibung"
                value={formData.schadensbeschreibung}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                multiline
                rows={3}
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Unfallort"
                name="unfallort"
                value={formData.unfallort}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Unfallzeit"
                name="unfallzeit"
                type="datetime-local"
                value={formData.unfallzeit}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                sx={textFieldSx}
              />
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>
      <DialogActions sx={{ p: 3, bgcolor: '#f5f7fa' }}>
        <Button 
          onClick={handleClose} 
          variant="outlined"
          sx={{ 
            borderColor: colors.secondary.light,
            color: colors.secondary.main,
            '&:hover': {
              borderColor: colors.secondary.main,
              bgcolor: colors.hover.blue,
            }
          }}
        >
          Abbrechen
        </Button>
        <Button 
          onClick={() => {
            if (tabValue > 0) {
              setTabValue(tabValue - 1);
            }
          }} 
          variant="outlined"
          disabled={tabValue === 0}
          sx={{ 
            borderColor: colors.secondary.light,
            color: colors.secondary.main,
            '&:hover': {
              borderColor: colors.secondary.main,
              bgcolor: colors.hover.blue,
            },
            '&.Mui-disabled': {
              borderColor: 'rgba(0, 0, 0, 0.12)',
              color: 'rgba(0, 0, 0, 0.26)',
            }
          }}
        >
          Zurück
        </Button>
        <Button 
          onClick={() => {
            if (tabValue < 4) {
              setTabValue(tabValue + 1);
            } else {
              handleSubmit();
            }
          }} 
          variant="contained"
          sx={{ 
            bgcolor: colors.primary.main,
            color: colors.text.onPrimary,
            fontWeight: 600,
            '&:hover': {
              bgcolor: colors.primary.dark,
            }
          }}
        >
          {tabValue === 4 ? 'Änderungen speichern' : 'Weiter'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 