import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SendIcon from '@mui/icons-material/Send';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import { DataGrid } from '@mui/x-data-grid';
import IconButton from '@mui/material/IconButton';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import PersonIcon from '@mui/icons-material/Person';
import AttachmentIcon from '@mui/icons-material/Attachment';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Badge from '@mui/material/Badge';
import { colors } from '../theme/colors';
import EditCaseForm from '../components/case/EditCaseForm';
import DocumentsTab from '../components/case/DocumentsTab';
import OpenTasksTab from '../components/case/OpenTasksTab';
import { useParams, useNavigate } from 'react-router-dom';
import { getCaseById, patchDatenschutz } from '../services/caseService';
import FallSendenDialog from '../components/case/FallSendenDialog';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

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

export default function FallDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [fallData, setFallData] = useState(null);
  const [status, setStatus] = useState('');
  const [uebermittlungen, setUebermittlungen] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [datenschutzAngenommen, setDatenschutzAngenommen] = useState(false);
  const [fallSendenOpen, setFallSendenOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef();

  useEffect(() => {
    const fetchFall = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getCaseById(id);
        if (res.erfolg) {
          setFallData(res.fall);
          setStatus(res.fall.status || '');
          setUebermittlungen(res.fall.uebermittlungen || 0);
        } else {
          setError(res.nachricht || 'Fehler beim Laden des Falls');
        }
      } catch (err) {
        setError(err.response?.data?.nachricht || 'Fehler beim Laden des Falls');
      } finally {
        setLoading(false);
      }
    };
    fetchFall();
  }, [id]);

  useEffect(() => {
    if (fallData && typeof fallData.datenschutzAngenommen === 'boolean') {
      setDatenschutzAngenommen(fallData.datenschutzAngenommen);
    }
  }, [fallData]);

  useEffect(() => {
    if (fallData) {
      setStatus(fallData.status || '');
      setUebermittlungen(fallData.uebermittlungen || 0);
    }
  }, [fallData]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEditClick = () => {
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
  };

  const handleSaveEdit = async () => {
    // Nach dem Speichern: Falldaten neu laden
    const res = await getCaseById(id);
    if (res.erfolg) {
      setFallData(res.fall);
      setStatus(res.fall.status || '');
      setUebermittlungen(res.fall.uebermittlungen || 0);
      // Dashboard/Statistik automatisch aktualisieren
      window.dispatchEvent(new Event('caseStatusChanged'));
      // Zentrale Fälle im Context neu laden (sofort für Dashboard)
      if (typeof window.refreshCasesGlobal === 'function') {
        await window.refreshCasesGlobal();
      }
    }
  };

  const handleDatenschutzAkzeptieren = async () => {
    try {
      await patchDatenschutz(fallData._id, true);
      // Nach erfolgreichem Speichern Falldaten neu laden:
      const res = await getCaseById(fallData._id);
      if (res.erfolg) {
        setFallData(res.fall);
        // Event auslösen für Dashboard-Aktualisierung
        window.dispatchEvent(new Event('datenschutzChange'));
      }
    } catch (err) {
      // Optional: Snackbar oder Fehlerbehandlung
      alert('Fehler beim Speichern der Datenschutzerklärung');
    }
  };

  const handleDatenschutzWiderrufen = async () => {
    try {
      await patchDatenschutz(fallData._id, false);
      // Nach erfolgreichem Speichern Falldaten neu laden:
      const res = await getCaseById(fallData._id);
      if (res.erfolg) {
        setFallData(res.fall);
        // Event auslösen für Dashboard-Aktualisierung
        window.dispatchEvent(new Event('datenschutzChange'));
      }
    } catch (err) {
      // Optional: Snackbar oder Fehlerbehandlung
      alert('Fehler beim Widerrufen der Datenschutzerklärung');
    }
  };

  // Hilfsfunktion für deutsches Datumsformat mit Uhrzeit
  const formatDateTimeDE = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' Uhr';
  };

  const handleDocusealComplete = () => {
    setPolling(true);
  };

  useEffect(() => {
    if (polling) {
      pollingRef.current = setInterval(async () => {
        const res = await getCaseById(id);
        if (res.erfolg && res.fall.datenschutzUnterschrieben) {
          setFallData(res.fall);
          setPolling(false);
          setSnackbarOpen(true);
        }
      }, 2000);
    } else {
      clearInterval(pollingRef.current);
    }
    return () => clearInterval(pollingRef.current);
  }, [polling, id]);

  if (loading) {
    return <Box sx={{ p: 4, width: '100%' }}><Typography>Lade Falldaten...</Typography></Box>;
  }
  if (error) {
    return <Box sx={{ p: 4, width: '100%' }}><Typography color="error">{error}</Typography></Box>;
  }
  if (!fallData) {
    return <Box sx={{ p: 4, width: '100%' }}><Typography>Kein Fall gefunden oder Daten werden geladen.</Typography></Box>;
  }

  // AB HIER ist fallData garantiert vorhanden!
  // Hilfsfunktionen für Aufgabenstatus
  const isFilled = (value) => value !== undefined && value !== null;

  // Pflichtfelder für "Fallinformationen ausgefüllt" (alle Felder der vier Kacheln)
  const allCaseInfoFilled = [
    // Mandantendaten
    fallData.mandant?.vorname,
    fallData.mandant?.nachname,
    fallData.mandant?.telefon,
    fallData.mandant?.email,
    fallData.mandant?.geburtsdatum,
    fallData.mandant?.adresse,
    // Schadensinformationen
    fallData.schaden?.schadenstyp,
    fallData.schaden?.schadensschwere,
    fallData.schaden?.unfallort,
    fallData.schaden?.unfallzeit,
    fallData.schaden?.beschreibung,
    // Erste Partei
    fallData.erstPartei?.vorname,
    fallData.erstPartei?.nachname,
    fallData.erstPartei?.versicherung,
    fallData.erstPartei?.kennzeichen,
    fallData.erstPartei?.kfzModell,
    fallData.erstPartei?.fahrzeughalter,
    fallData.erstPartei?.beteiligungsposition,
    // Zweite Partei
    fallData.zweitPartei?.vorname,
    fallData.zweitPartei?.nachname,
    fallData.zweitPartei?.versicherung,
    fallData.zweitPartei?.kennzeichen,
    fallData.zweitPartei?.beteiligungsposition,
  ].every(isFilled);

  // Dokument-Kategorien prüfen
  const dokumente = fallData.dokumente || [];
  const hasDokument = (kategorie) => dokumente.some(doc => doc.kategorie === kategorie);

  // Aufgabenliste mit Status
  const tasksWithStatus = [
    { label: 'Fallinformationen ausgefüllt', done: allCaseInfoFilled },
    { label: 'Vollmacht unterschrieben', done: hasDokument('vollmacht') },
    { label: 'KFZ Gutachten hochgeladen', done: hasDokument('kfz_gutachten') },
    { label: 'Fahrzeugschein hochgeladen', done: hasDokument('fahrzeugschein') },
    { label: 'Rechnungen hochgeladen', done: hasDokument('rechnungen') },
    { label: 'Unfallbericht hochgeladen', done: hasDokument('unfallbericht') },
  ];

  // Button "Fall senden" nur aktivieren, wenn alle Aufgaben erledigt sind und Status nicht "Übermittelt"
  const allTasksDone = tasksWithStatus.every(task => task.done);
  const kannSenden = allTasksDone && status !== 'Übermittelt';

  // Anzahl offener Aufgaben berechnen
  const countOpenTasks = () => {
    if (!tasksWithStatus || tasksWithStatus.length === 0) {
      return 0;
    }
    return tasksWithStatus.filter(task => !task.done).length;
  };

  return (
    <Box sx={{ 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      flexGrow: 1,
      backgroundColor: '#f9fafb', // Hellgrauer Hintergrund
      transition: 'margin 195ms cubic-bezier(0.4, 0, 0.6, 1) 0ms',
    }}>
      {/* Header-Bereich mit Zurück-Button und Aktionen */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          variant="outlined" 
          sx={{ 
            mb: 1,
            borderColor: colors.secondary.light,
            color: colors.secondary.main,
            '&:hover': {
              borderColor: colors.secondary.main,
              backgroundColor: colors.hover.blue,
            }
          }}
          onClick={() => navigate('/faelle')}
        >
          Zurück zur Fallübersicht
        </Button>
        <Stack direction="row" spacing={1}>
          <Button 
            variant="outlined" 
            startIcon={<EditIcon />}
            sx={{ 
              borderColor: colors.secondary.light,
              color: colors.secondary.main,
              '&:hover': {
                borderColor: colors.secondary.main,
                backgroundColor: colors.hover.blue,
              }
            }}
            onClick={handleEditClick}
          >
            Bearbeiten
          </Button>
          {kannSenden && (
            <Button 
              variant="contained" 
              startIcon={<SendIcon />}
              sx={{ 
                bgcolor: colors.primary.main,
                color: colors.text.onPrimary,
                fontWeight: 600,
                '&:hover': {
                  bgcolor: colors.primary.dark,
                }
              }}
              onClick={() => setFallSendenOpen(true)}
            >
              Fall senden
            </Button>
          )}
          {!kannSenden && (
            <Button 
              variant="contained" 
              startIcon={<SendIcon />}
              disabled
              sx={{ 
                bgcolor: '#e0e0e0',
                color: '#bdbdbd',
                fontWeight: 600,
                boxShadow: 'none',
                cursor: 'not-allowed',
                '&:hover': {
                  bgcolor: '#e0e0e0',
                }
              }}
            >
              Übermittelt
            </Button>
          )}
        </Stack>
      </Box>
      
      {/* Falldetails Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          background: colors.background.gradientBlue,
          color: colors.accent.white,
          boxShadow: colors.shadows.sm
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={9}>
            <Typography variant="h4" fontWeight={600}>
              {fallData?.fallname || ''}
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                <b>ID:</b> {fallData?.gutachterNummer && fallData?.fallNummer ? `${fallData.gutachterNummer} - ${fallData.fallNummer.toString().padStart(2, '0')}` : ''}
              </Typography>
              <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Aktenzeichen: {fallData?.aktenzeichen || ''}
              </Typography>
              <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Erstellt am: {formatDateTimeDE(fallData?.createdAt || fallData?.datum)}
              </Typography>
              <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Zuletzt geändert: {formatDateTimeDE(fallData?.updatedAt)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Chip 
              label={fallData?.status || ''} 
              sx={{ 
                fontWeight: 600,
                bgcolor: colors.primary.main,
                color: colors.text.onPrimary,
              }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabs für verschiedene Bereiche */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Paper 
          elevation={0} 
          sx={{ 
            mb: 0, 
            borderRadius: '8px 8px 0 0',
            boxShadow: colors.shadows.sm,
            overflow: 'hidden'
          }}
        >
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                color: colors.secondary.light,
                '&.Mui-selected': {
                  color: colors.primary.dark,
                  fontWeight: 600,
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: colors.primary.main,
              }
            }}
          >
            <Tab icon={<PersonIcon />} label="Falldetails" iconPosition="start" />
            <Tab icon={<AttachmentIcon />} label="Dokumente" iconPosition="start" />
            <Tab 
              icon={
                <Badge 
                  badgeContent={countOpenTasks()} 
                  color="error"
                  sx={{ 
                    '& .MuiBadge-badge': {
                      right: -3,
                      top: 3,
                      fontWeight: 'bold',
                      minWidth: '18px',
                      height: '18px',
                      padding: '0 6px'
                    }
                  }}
                  invisible={countOpenTasks() === 0}
                >
                  <CloseIcon sx={{ color: '#d32f2f' }} />
                </Badge>
              } 
              label="Offene Aufgaben" 
              iconPosition="start" 
            />
          </Tabs>
        </Paper>
        
        {/* Tab-Inhalte */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            flexGrow: 1, 
            overflow: 'auto',
            borderRadius: '0 0 8px 8px',
            boxShadow: colors.shadows.sm
          }}
        >
          {/* Tab 1: Falldetails */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              {/* Mandantendaten */}
              <Grid item xs={12} md={6}>
                <Card 
                  elevation={0} 
                  sx={{ 
                    borderRadius: 2,
                    boxShadow: colors.shadows.sm,
                    height: '100%'
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={500} sx={{ mb: 2, color: colors.secondary.main }}>
                      Mandantendaten
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Mandantennummer</Typography>
                        <Typography variant="body1">
                          {fallData?.mandant?.mandantennummer || 
                           `MD-${(100 + (fallData?.fallNummer || 1)).toString().padStart(6, '0')}`}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                        <Typography variant="body1">{fallData?.mandant?.vorname || ''} {fallData?.mandant?.nachname || ''}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Telefon</Typography>
                        <Typography variant="body1">{fallData?.mandant?.telefon || ''}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">E-Mail</Typography>
                        <Typography variant="body1">{fallData?.mandant?.email || ''}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Geburtsdatum</Typography>
                        <Typography variant="body1">{fallData?.mandant?.geburtsdatum || ''}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Adresse</Typography>
                        <Typography variant="body1">{fallData?.mandant?.adresse || ''}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Schadensinformationen */}
              <Grid item xs={12} md={6}>
                <Card 
                  elevation={0} 
                  sx={{ 
                    borderRadius: 2,
                    boxShadow: colors.shadows.sm,
                    height: '100%'
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={500} sx={{ mb: 2, color: colors.secondary.main }}>
                      Schadensinformationen
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Schadenstyp</Typography>
                        <Typography variant="body1">{fallData?.schaden?.schadenstyp || ''}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Schadensschwere</Typography>
                        <Typography variant="body1">{fallData?.schaden?.schadensschwere || ''}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Unfallort</Typography>
                        <Typography variant="body1">{fallData?.schaden?.unfallort || ''}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Unfallzeit</Typography>
                        <Typography variant="body1">{fallData?.schaden?.unfallzeit || ''}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Beschreibung</Typography>
                        <Typography variant="body1">{fallData?.schaden?.beschreibung || ''}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Erste Partei */}
              <Grid item xs={12} md={6}>
                <Card 
                  elevation={0} 
                  sx={{ 
                    borderRadius: 2,
                    boxShadow: colors.shadows.sm,
                    height: '100%'
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={500} sx={{ mb: 2, color: colors.secondary.main }}>
                      Erste Partei
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                        <Typography variant="body1">{fallData?.erstPartei?.vorname || ''} {fallData?.erstPartei?.nachname || ''}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Versicherung</Typography>
                        <Typography variant="body1">{fallData?.erstPartei?.versicherung || ''}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Kennzeichen</Typography>
                        <Typography variant="body1">{fallData?.erstPartei?.kennzeichen || ''}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">KFZ Modell</Typography>
                        <Typography variant="body1">{fallData?.erstPartei?.kfzModell || ''}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Fahrzeughalter</Typography>
                        <Typography variant="body1">{fallData?.erstPartei?.fahrzeughalter || ''}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Beteiligung</Typography>
                        <Typography variant="body1">{fallData?.erstPartei?.beteiligungsposition || ''}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Zweite Partei */}
              <Grid item xs={12} md={6}>
                <Card 
                  elevation={0} 
                  sx={{ 
                    borderRadius: 2,
                    boxShadow: colors.shadows.sm,
                    height: '100%'
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={500} sx={{ mb: 2, color: colors.secondary.main }}>
                      Zweite Partei
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                        <Typography variant="body1">{fallData?.zweitPartei?.vorname || ''} {fallData?.zweitPartei?.nachname || ''}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Versicherung</Typography>
                        <Typography variant="body1">{fallData?.zweitPartei?.versicherung || ''}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Kennzeichen</Typography>
                        <Typography variant="body1">{fallData?.zweitPartei?.kennzeichen || ''}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Beteiligung</Typography>
                        <Typography variant="body1">{fallData?.zweitPartei?.beteiligungsposition || ''}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              {/* Datenschutzerklärung Kachel */}
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ borderRadius: 2, boxShadow: colors.shadows.sm, height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={500} sx={{ mb: 2, color: colors.secondary.main }}>
                      Vollmacht
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Bitte lesen und unterzeichnen Sie die Vollmacht online, um mit der Fallbearbeitung fortzufahren.
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        href="http://minio-console-x9fw.onrender.com/api/v1/download-shared-object/aHR0cDovLzEyNy4wLjAuMTo5MDAwL2d1dGFjaHRlci9Wb2xsbWFjaHQvVm9sbG1hY2h0JTIwUWFyYS5MZWdhbC5wZGY_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1KTk9UQjRLUkNIRU1DTkI2OVI2USUyRjIwMjUwNzA0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MDcwNFQxMDIwMDhaJlgtQW16LUV4cGlyZXM9NDMxOTkmWC1BbXotU2VjdXJpdHktVG9rZW49ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmhZMk5sYzNOTFpYa2lPaUpLVGs5VVFqUkxVa05JUlUxRFRrSTJPVkkyVVNJc0ltVjRjQ0k2TVRjMU1UWTJOekUwTml3aWNHRnlaVzUwSWpvaVlrWXdjbVJyVUVVeVpHWk5aeXQ1VXpKbWIzUjBiRXBTTjNVelZGVm1NWGsyYUROQlNtcHNOa05ZV1QwaWZRLmNDcVBYbG9zNXVhX0w1OXRCMDVfcmNiTW9KRlNWVF9hbWtMNTlwajdPZW1rWU9tTF9xMWNtZGd1b0VaSXV1anB2MHlUMl9GSGdaZFF0bkhObzFlS3BRJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZ2ZXJzaW9uSWQ9bnVsbCZYLUFtei1TaWduYXR1cmU9NmE3ZWE1M2NhNWY4ZWE0MTBlNjc1ZGNlNWU4MmE5YmJlZGRhMTI4NTRiOTRhNTFmMzEzMmY0MWZlMmUzMGVmMw"
                        startIcon={<CloudDownloadIcon />}
                        sx={{
                          bgcolor: colors.primary.main,
                          color: colors.text.onPrimary,
                          fontWeight: 600,
                          '&:hover': {
                            bgcolor: colors.primary.dark,
                            color: '#fff',
                          },
                        }}
                      >
                        Vollmacht herunterladen
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              {/* Vermittelt von Kachel */}
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ borderRadius: 2, boxShadow: colors.shadows.sm, height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={500} sx={{ mb: 2, color: colors.secondary.main }}>
                      Vermittelt von
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {Array.isArray(fallData?.vermitteltVon) && fallData.vermitteltVon.length > 0 ? (
                      fallData.vermitteltVon.map((v, idx) => (
                        <Grid container spacing={1} key={idx} sx={{ mb: 1 }}>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="subtitle2" color="text.secondary">Vorname</Typography>
                            <Typography variant="body1">{v.vorname || '-'}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="subtitle2" color="text.secondary">Nachname</Typography>
                            <Typography variant="body1">{v.nachname || '-'}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="subtitle2" color="text.secondary">Unternehmen</Typography>
                            <Typography variant="body1">{v.unternehmen || '-'}</Typography>
                          </Grid>
                        </Grid>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">Keine Vermittler eingetragen.</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Tab 2: Dokumente */}
          <TabPanel value={tabValue} index={1}>
            <DocumentsTab 
              dokumente={fallData.dokumente || []} 
              fallId={fallData._id}
              onRefresh={() => {
                // Nach Upload die Falldaten neu laden
                getCaseById(id).then(res => {
                  if (res.erfolg) setFallData(res.fall);
                });
              }}
            />
          </TabPanel>
          
          {/* Tab 3: Offene Aufgaben */}
          <TabPanel value={tabValue} index={2}>
            <OpenTasksTab tasksWithStatus={tasksWithStatus} />
          </TabPanel>
        </Paper>
      </Box>

      {/* EditCaseForm-Dialog */}
      <EditCaseForm 
        open={editDialogOpen}
        handleClose={handleEditClose}
        fallDaten={fallData}
        onSave={handleSaveEdit}
      />

      <FallSendenDialog 
        open={fallSendenOpen}
        onClose={() => setFallSendenOpen(false)}
        fallData={fallData}
        dokumente={fallData.dokumente || []}
        onSent={(info) => {
          setStatus(info.status);
          setUebermittlungen(info.uebermittlungen);
        }}
      />
    </Box>
  );
} 