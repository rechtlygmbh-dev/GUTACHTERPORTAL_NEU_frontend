import * as React from 'react';
import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import Stack from '@mui/material/Stack';
import { colors } from '../theme/colors';
import Paper from '@mui/material/Paper';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MenuItem from '@mui/material/MenuItem';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import CloseIcon from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/Error';
import { documentService } from '../services/api';

export default function Dokumente() {
  // State für Rohdaten
  const [alleDokumente, setAlleDokumente] = useState([]);
  // State für gefilterte Daten
  const [dokumente, setDokumente] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0); // 0-basiert für DataGrid
  const [pageSize, setPageSize] = useState(25);
  const [totalDokumente, setTotalDokumente] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Filter-States
  const [filterId, setFilterId] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterFall, setFilterFall] = useState('');
  const [filterTyp, setFilterTyp] = useState('');
  const [filterVon, setFilterVon] = useState('');
  const [filterBis, setFilterBis] = useState('');
  
  // Listen für Filter-Optionen
  const [fallListe, setFallListe] = useState([]);
  const [dokumentTypen, setDokumentTypen] = useState([]);
  
  // Neue States für das Preview-Modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewName, setPreviewName] = useState('');
  const [previewType, setPreviewType] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  // Hilfsfunktion zum Generieren einer formatierten Dokument-ID
  const generateDisplayId = (gutachterNummer, fallNummer, dokumentIndex) => {
    const formattedGutachterNummer = gutachterNummer || '00000';
    const formattedFallNummer = fallNummer ? fallNummer.toString().padStart(2, '0') : '00';
    const formattedDokumentIndex = (dokumentIndex + 1).toString().padStart(2, '0');
    
    return `${formattedGutachterNummer}-${formattedFallNummer}-${formattedDokumentIndex}`;
  };

  // Dokumente gruppieren nach Fall und zählen für korrekte Nummerierung
  const generateDokumentIds = (docs) => {
    // Gruppieren nach Fall
    const fallGruppen = {};
    
    docs.forEach(doc => {
      const fallId = doc.fallId || 'unbekannt';
      if (!fallGruppen[fallId]) {
        fallGruppen[fallId] = [];
      }
      fallGruppen[fallId].push(doc);
    });
    
    // Dokument IDs für jeden Fall separat generieren
    const docsWithDisplayId = [];
    Object.keys(fallGruppen).forEach(fallId => {
      const gruppe = fallGruppen[fallId];
      
      // Nach Hochladedatum sortieren, damit die Nummerierung chronologisch ist
      const sortierteDokumente = [...gruppe].sort((a, b) => {
        // Wenn originalDoc oder hochgeladenAm fehlt, als ältestes behandeln
        const dateA = a.originalDoc?.hochgeladenAm ? new Date(a.originalDoc.hochgeladenAm) : new Date(0);
        const dateB = b.originalDoc?.hochgeladenAm ? new Date(b.originalDoc.hochgeladenAm) : new Date(0);
        return dateA - dateB; // Aufsteigend sortieren (älteste zuerst)
      });
      
      sortierteDokumente.forEach((doc, index) => {
        // Gutachter- und Fallnummer aus dem Fall extrahieren
        const gutachterNummer = doc.originalDoc?.fall?.gutachterNummer;
        const fallNummer = doc.originalDoc?.fall?.fallNummer;
        
        // Formatierte ID generieren
        const displayId = generateDisplayId(gutachterNummer, fallNummer, index);
        
        docsWithDisplayId.push({
          ...doc,
          displayId,
          sortKey: `${gutachterNummer || '00000'}-${fallNummer || '00'}-${(index + 1).toString().padStart(4, '0')}` // Für einfacheres Sortieren
        });
      });
    });
    
    // Nach Gutachtennummer, Fallnummer und dann Dokumentnummer sortieren
    return docsWithDisplayId.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  };

  // Serveranfrage zum Laden aller Dokumente
  const loadAlleDokumente = async () => {
    setLoading(true);
    try {
      const response = await documentService.getAllDocuments({
        limit: 500 // Höheres Limit für mehr Dokumente
      });
      
      if (response.erfolg) {
        console.log(`📄 ${response.dokumente.length} Dokumente geladen`);
        let mappedDokumente = response.dokumente.map(doc => ({
          id: doc._id,
          name: doc.name || doc.titel || doc.pfad?.split('/').pop() || 'Unbekanntes Dokument',
          fallname: doc.fall?.fallname || 'Unbekannter Fall',
          fallId: doc.fall?._id,
          typ: doc.kategorie || 'sonstiges',
          mimetype: doc.dateityp,
          größe: doc.groesse,
          datum: new Date(doc.hochgeladenAm).toLocaleDateString('de-DE'),
          datumRaw: new Date(doc.hochgeladenAm),
          hochgeladenVon: doc.hochgeladenVon ? `${doc.hochgeladenVon.vorname} ${doc.hochgeladenVon.nachname}` : 'Unbekannt',
          originalDoc: doc // Vollständiges Originaldokument für weitere Aktionen
        }));

        // --- Ergänzung: Datenschutzerklärung als Dokument einfügen ---
        // Hole alle Fälle, um ggf. datenschutzPdfPfad zu finden
        const casesResponse = await fetch('/api/cases');
        if (casesResponse.ok) {
          const casesData = await casesResponse.json();
          if (casesData.erfolg && Array.isArray(casesData.faelle)) {
            casesData.faelle.forEach(fall => {
              if (fall.datenschutzPdfPfad) {
                mappedDokumente.push({
                  id: `datenschutz-${fall._id}`,
                  name: 'Signierte Datenschutzerklärung',
                  fallname: fall.fallname || 'Unbekannter Fall',
                  fallId: fall._id,
                  typ: 'datenschutzerklaerung',
                  mimetype: 'application/pdf',
                  größe: null,
                  datum: fall.updatedAt ? new Date(fall.updatedAt).toLocaleDateString('de-DE') : '',
                  datumRaw: fall.updatedAt ? new Date(fall.updatedAt) : null,
                  hochgeladenVon: 'Mandant',
                  originalDoc: {
                    url: `/api/documents/download/datenschutz/${fall._id}`
                  }
                });
              }
            });
          }
        }
        // --- Ende Ergänzung ---

        // Mit formatierten IDs versehen
        const dokumenteMitIds = generateDokumentIds(mappedDokumente);
        // Speichern als Rohdaten für spätere Filterung
        setAlleDokumente(dokumenteMitIds);
        // Extrahiere einzigartige Dokumenttypen für den Filter
        const uniqueTypen = [...new Set(mappedDokumente.map(doc => doc.typ))].filter(Boolean).sort();
        setDokumentTypen(uniqueTypen);
        // Extrahiere einzigartige Fallnamen für den Filter
        const uniqueFälle = [...new Set(mappedDokumente.map(doc => doc.fallname))].filter(Boolean).sort();
        setFallListe(uniqueFälle);
      } else {
        throw new Error(response.nachricht || 'Fehler beim Laden der Dokumente');
      }
    } catch (err) {
      setError(err.message || 'Fehler beim Laden der Dokumente');
      setSnackbar({
        open: true,
        message: `Fehler beim Laden: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial alle Dokumente laden
  useEffect(() => {
    loadAlleDokumente();
  }, []);

  // Separate Filterlogik, die auf den geladenen Dokumenten arbeitet
  useEffect(() => {
    if (alleDokumente.length === 0) return;
    
    console.log('🔍 Wende Filter an...');
    let filteredDokumente = [...alleDokumente];
    
    // Nach ID filtern
    if (filterId) {
      console.log('🔍 Filtere nach ID:', filterId);
      filteredDokumente = filteredDokumente.filter(doc => doc.displayId.includes(filterId));
    }
    
    // Nach Name filtern
    if (filterName) {
      console.log('🔍 Filtere nach Name:', filterName);
      filteredDokumente = filteredDokumente.filter(doc => 
        doc.name.toLowerCase().includes(filterName.toLowerCase())
      );
    }
    
    // Nach Fall filtern
    if (filterFall) {
      console.log('🔍 Filtere nach Fall:', filterFall);
      filteredDokumente = filteredDokumente.filter(doc => doc.fallname === filterFall);
    }
    
    // Nach Dokumenttyp filtern
    if (filterTyp) {
      console.log('🔍 Filtere nach Dokumenttyp:', filterTyp);
      filteredDokumente = filteredDokumente.filter(doc => doc.typ === filterTyp);
    }
    
    // Nach Datum filtern
    if (filterVon) {
      const vonDate = new Date(filterVon);
      vonDate.setHours(0, 0, 0, 0);
      filteredDokumente = filteredDokumente.filter(doc => {
        if (!doc.datumRaw) return true;
        const docDate = new Date(doc.datumRaw);
        docDate.setHours(0, 0, 0, 0);
        return docDate >= vonDate;
      });
    }
    if (filterBis) {
      const bisDate = new Date(filterBis);
      bisDate.setHours(0, 0, 0, 0);
      filteredDokumente = filteredDokumente.filter(doc => {
        if (!doc.datumRaw) return true;
        const docDate = new Date(doc.datumRaw);
        docDate.setHours(0, 0, 0, 0);
        return docDate <= bisDate;
      });
    }
    
    console.log(`✅ Filter angewandt: ${filteredDokumente.length} von ${alleDokumente.length} Dokumenten`);
    setDokumente(filteredDokumente);
    setTotalDokumente(filteredDokumente.length);
    
    // Bei Filteränderung zurück zur ersten Seite
    setPage(0);
    
  }, [alleDokumente, filterId, filterName, filterFall, filterTyp, filterVon, filterBis]);

  // Filter-Event-Handler
  const handleFilterChange = (filterName, value) => {
    switch(filterName) {
      case 'id':
        setFilterId(value);
        break;
      case 'name':
        setFilterName(value);
        break;
      case 'fall':
        setFilterFall(value);
        break;
      case 'typ':
        setFilterTyp(value);
        break;
      case 'von':
        setFilterVon(value);
        break;
      case 'bis':
        setFilterBis(value);
        break;
      default:
        break;
    }
  };

  // Filter zurücksetzen
  const resetFilters = () => {
    setFilterId('');
    setFilterName('');
    setFilterFall('');
    setFilterTyp('');
    setFilterVon('');
    setFilterBis('');
    setPage(0);
  };

  // Aktualisierungsfunktion für alle Dokumente
  const refreshDokumente = async () => {
    setSnackbar({
      open: true,
      message: 'Aktualisiere Dokumente...',
      severity: 'info'
    });
    await loadAlleDokumente();
    setSnackbar({
      open: true,
      message: 'Dokumente aktualisiert',
      severity: 'success'
    });
  };

  // Dokument löschen
  const handleDelete = async (id) => {
    if (window.confirm('Möchten Sie dieses Dokument wirklich löschen?')) {
      try {
        setLoading(true);
        const response = await documentService.deleteDocument(id);
        
        if (response.erfolg) {
          // Dokumente neu laden
          await refreshDokumente();
          setSnackbar({
            open: true,
            message: 'Dokument erfolgreich gelöscht',
            severity: 'success'
          });
          // Event auslösen für Dashboard-Aktualisierung
          window.dispatchEvent(new Event('documentChange'));
        } else {
          throw new Error(response.nachricht || 'Fehler beim Löschen des Dokuments');
        }
      } catch (err) {
        setError(err.message || 'Fehler beim Löschen des Dokuments');
        setSnackbar({
          open: true,
          message: `Fehler beim Löschen: ${err.message}`,
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Dokument anzeigen (im Modal)
  const handleView = async (id, row) => {
    // Spezialfall: Datenschutzerklärung/Vollmacht
    if ((row.typ === 'datenschutzerklaerung' || row.typ === 'vollmacht') && row.originalDoc?.url) {
      setPreviewUrl(row.originalDoc.url);
      setPreviewName(row.name);
      setPreviewType('application/pdf');
      setPreviewOpen(true);
      return;
    }
    // Standard-Logik
    try {
      setPreviewLoading(true);
      const response = await documentService.getDocumentById(id);
      if (response.erfolg) {
        const dokument = response.dokument;
        setPreviewUrl(dokument.url);
        setPreviewName(dokument.name || dokument.titel || 'Dokument');
        setPreviewType(dokument.dateityp || 'application/octet-stream');
        setPreviewOpen(true);
      } else {
        throw new Error(response.nachricht || 'Fehler beim Anzeigen des Dokuments');
      }
    } catch (err) {
      setError(err.message || 'Fehler beim Anzeigen des Dokuments');
      setPreviewError(err.message);
      setSnackbar({
        open: true,
        message: `Fehler beim Anzeigen: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // Dokument herunterladen
  const handleDownload = async (id, row) => {
    // Spezialfall: Datenschutzerklärung/Vollmacht
    if ((row.typ === 'datenschutzerklaerung' || row.typ === 'vollmacht') && row.originalDoc?.url) {
      window.open(row.originalDoc.url, '_blank');
      return;
    }
    // Standard-Logik
    try {
      setSnackbar({
        open: true,
        message: `Download wird vorbereitet...`,
        severity: 'info'
      });
      const response = await documentService.getDocumentById(id);
      if (response.erfolg) {
        const url = response.dokument.url;
        const fileName = response.dokument.name || response.dokument.titel || 'dokument';
        const fetchResponse = await fetch(url);
        if (!fetchResponse.ok) {
          throw new Error('Download konnte nicht durchgeführt werden');
        }
        const blob = await fetchResponse.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
        setSnackbar({
          open: true,
          message: `Download von ${fileName} gestartet`,
          severity: 'success'
        });
      } else {
        throw new Error(response.nachricht || 'Fehler beim Herunterladen des Dokuments');
      }
    } catch (err) {
      setError(err.message || 'Fehler beim Herunterladen des Dokuments');
      setSnackbar({
        open: true,
        message: `Fehler beim Herunterladen: ${err.message}`,
        severity: 'error'
      });
    }
  };

  // Snackbar schließen
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Erhalte das passende Icon basierend auf dem Dateityp
  const getIconByType = (mimetype, typ) => {
    if (mimetype?.startsWith('image/')) {
      return <ImageIcon fontSize="small" sx={{ color: '#1e88e5', mr: 1 }} />;
    } else if (mimetype === 'application/pdf' || typ === 'kfz_gutachten') {
      return <PictureAsPdfIcon fontSize="small" sx={{ color: '#e53935', mr: 1 }} />;
    } else {
      return <DescriptionIcon fontSize="small" sx={{ color: '#7e57c2', mr: 1 }} />;
    }
  };

  // Konvertiere Dokumenttypen in lesbare Form
  const getDisplayTyp = (typ) => {
    const typMap = {
      'fuehrerschein_vorne': 'Führerschein (Vorderseite)',
      'fuehrerschein_hinten': 'Führerschein (Rückseite)',
      'personalausweis_vorne': 'Personalausweis (Vorderseite)',
      'personalausweis_hinten': 'Personalausweis (Rückseite)',
      'kfz_gutachten': 'KFZ Gutachten',
      'fahrzeugschein': 'Fahrzeugschein',
      'rechnungen': 'Rechnungen',
      'unfallbericht': 'Unfallbericht',
      'unfall_bilder': 'Unfallbilder',
      'sonstige': 'Sonstige Dokumente',
      'atteste': 'Ärztliche Atteste',
      'reparatur': 'Reparaturrechnung',
      'sonstiges': 'Sonstiges'
    };
    
    return typMap[typ] || typ;
  };

  // Modal schließen
  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewUrl('');
    setPreviewType('');
    setPreviewName('');
    setPreviewError(null);
  };

  // Render-Funktion für den Vorschauinhalt basierend auf dem Dokumenttyp
  const renderPreview = () => {
    if (previewLoading) {
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '70vh',
          flexDirection: 'column',
          gap: 2
        }}>
          <CircularProgress size={60} sx={{ color: colors.primary.main }} />
          <Typography variant="body1">Dokument wird geladen...</Typography>
        </Box>
      );
    }

    if (previewError) {
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '70vh',
          flexDirection: 'column',
          gap: 2,
          color: 'error.main'
        }}>
          <ErrorIcon sx={{ fontSize: 60 }} />
          <Typography variant="body1" color="error">
            Fehler beim Laden: {previewError}
          </Typography>
        </Box>
      );
    }

    // Für PDF-Dokumente
    if (previewType === 'application/pdf') {
      return (
        <Box sx={{ height: '70vh', width: '100%' }}>
          <iframe 
            src={`${previewUrl}#toolbar=0`}
            title={previewName}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
        </Box>
      );
    }

    // Für Bilder
    if (previewType.startsWith('image/')) {
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '70vh',
          width: '100%', 
          overflow: 'auto'
        }}>
          <img 
            src={previewUrl} 
            alt={previewName} 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%', 
              objectFit: 'contain'
            }} 
          />
        </Box>
      );
    }

    // Für andere Dokumenttypen
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '70vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <DescriptionIcon sx={{ fontSize: 60, color: colors.secondary.main }} />
        <Typography variant="body1" gutterBottom>
          Keine Vorschau für diesen Dokumenttyp verfügbar.
        </Typography>
        <Button 
          variant="contained" 
          href={previewUrl} 
          target="_blank"
          startIcon={<CloudDownloadIcon />}
          sx={{
            bgcolor: colors.primary.main,
            color: colors.text.onPrimary,
            fontWeight: 600,
            '&:hover': {
              bgcolor: colors.primary.dark
            }
          }}
        >
          Dokument herunterladen
        </Button>
      </Box>
    );
  };

  const columns = [
    { 
      field: 'displayId', 
      headerName: 'ID', 
      width: 120, 
      flex: 0.5,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'name', 
      headerName: 'Dokumentname', 
      width: 200, 
      flex: 2,
      renderCell: (params) => {
        const icon = getIconByType(params.row.mimetype, params.row.typ);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {icon}
            <Typography variant="body2">{params.value}</Typography>
          </Box>
        );
      }
    },
    { field: 'fallname', headerName: 'Fall', width: 180, flex: 1.5 },
    { 
      field: 'typ', 
      headerName: 'Dokumenttyp', 
      width: 150, 
      flex: 1,
      renderCell: (params) => {
        const displayTyp = getDisplayTyp(params.value);
        const getColorByTyp = () => {
          const typColors = {
            'kfz_gutachten': 'rgba(229, 57, 53, 0.1)',
            'fahrzeugschein': 'rgba(30, 136, 229, 0.1)',
            'unfall_bilder': 'rgba(126, 87, 194, 0.1)'
          };
          return typColors[params.value] || 'rgba(158, 158, 158, 0.1)';
        };
        
        return (
          <Box
            sx={{
              backgroundColor: getColorByTyp(),
              color: 
                params.value === 'kfz_gutachten' ? '#e53935' : 
                params.value === 'fahrzeugschein' ? '#1e88e5' : 
                params.value === 'unfall_bilder' ? '#7e57c2' : 
                '#616161',
              borderRadius: 1,
              py: 0.5,
              px: 1.5,
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'inline-block',
            }}
          >
            {displayTyp}
          </Box>
        );
      }
    },
    { field: 'datum', headerName: 'Hochgeladen am', width: 150, flex: 1 },
    { 
      field: 'aktionen', 
      headerName: 'Aktionen', 
      width: 150, 
      flex: 1.5,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton 
            size="small" 
            aria-label="ansehen"
            onClick={() => handleView(params.row.id, params.row)}
            sx={{ color: colors.accent.blue }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            aria-label="herunterladen"
            onClick={() => handleDownload(params.row.id, params.row)}
            sx={{ color: colors.primary.dark }}
          >
            <CloudDownloadIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            aria-label="löschen"
            onClick={() => handleDelete(params.row.id)}
            sx={{ color: '#d32f2f' }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      )
    },
  ];

  return (
    <Box sx={{ 
      width: '100%', 
      px: { xs: 1, sm: 2, md: 3 },
      height: 'calc(100vh - 64px)', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
      flexGrow: 1,
      backgroundColor: '#f9fafb', // Hellgrauer Hintergrund
      transition: 'margin 195ms cubic-bezier(0.4, 0, 0.6, 1) 0ms',
    }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          background: colors.background.gradientBlue,
          color: colors.accent.white
        }}
      >
        <Grid container alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
          <Grid item>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Dokumente
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5, opacity: 0.9 }}>
              Verwalten Sie Ihre Gutachten und Dokumente
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              onClick={refreshDokumente}
              disabled={loading}
              sx={{
                backgroundColor: colors.primary.main,
                color: colors.secondary.main,
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: colors.primary.dark,
                  color: colors.secondary.main,
                },
              }}
            >
              {loading ? 'Wird geladen...' : 'Aktualisieren'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 2,
          boxShadow: colors.shadows.sm
        }}
      >
        <Grid container spacing={2} alignItems="center" sx={{ width: '100%' }}>
          <Grid item xs={6} sm={4} md={2}>
            <TextField 
              label="Dokument-ID" 
              variant="outlined" 
              size="small" 
              fullWidth
              value={filterId}
              onChange={e => handleFilterChange('id', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterListIcon sx={{ color: colors.secondary.light }} />
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

          <Grid item xs={6} sm={4} md={3}>
            <TextField 
              label="Dokumentname" 
              variant="outlined" 
              size="small" 
              fullWidth
              value={filterName}
              onChange={e => handleFilterChange('name', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: colors.secondary.light }} />
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
          <Grid item xs={6} sm={4} md={3}>
            <TextField 
              label="Fall" 
              variant="outlined" 
              size="small" 
              fullWidth
              select
              value={filterFall}
              onChange={e => handleFilterChange('fall', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterListIcon sx={{ color: colors.secondary.light }} />
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
            >
              <MenuItem value="">Alle Fälle</MenuItem>
              {fallListe.map((fallname) => (
                <MenuItem key={fallname} value={fallname}>{fallname}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <TextField 
              label="Dokumenttyp" 
              variant="outlined" 
              size="small" 
              fullWidth
              select
              value={filterTyp}
              onChange={e => handleFilterChange('typ', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterListIcon sx={{ color: colors.secondary.light }} />
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
            >
              <MenuItem value="">Alle Typen</MenuItem>
              {dokumentTypen.map((typ) => (
                <MenuItem key={typ} value={typ}>{getDisplayTyp(typ)}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <TextField
              label="Zeitraum von"
              type="date"
              variant="outlined"
              size="small"
              fullWidth
              value={filterVon}
              onChange={e => handleFilterChange('von', e.target.value)}
              InputLabelProps={{ shrink: true }}
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
          <Grid item xs={6} sm={4} md={2}>
            <TextField
              label="Zeitraum bis"
              type="date"
              variant="outlined"
              size="small"
              fullWidth
              value={filterBis}
              onChange={e => handleFilterChange('bis', e.target.value)}
              InputLabelProps={{ shrink: true }}
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
          <Grid item xs={12} md={10} lg={11} sx={{ mt: { xs: 2, md: 0 } }} />
          <Grid item xs={12} md={2} lg={1} sx={{ mt: { xs: 1, md: 0 }, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="outlined" 
              fullWidth
              onClick={resetFilters}
              startIcon={<FilterListIcon />}
              sx={{ color: colors.secondary.main, borderColor: colors.secondary.light, fontWeight: 500 }}
            >
              Zurücksetzen
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper 
        elevation={0} 
        sx={{ 
          flexGrow: 1, 
          width: '100%', 
          background: '#fff', 
          borderRadius: 2, 
          boxShadow: colors.shadows.sm,
          overflow: 'hidden',
          minHeight: 0,
          position: 'relative'
        }}
      >
        {loading && (
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.7)',
            zIndex: 10
          }}>
            <CircularProgress size={40} sx={{ color: colors.primary.main }} />
          </Box>
        )}
        
        <DataGrid
          rows={dokumente}
          columns={columns}
          pagination
          paginationMode="client"
          rowCount={dokumente.length}
          pageSize={pageSize}
          page={page}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          rowsPerPageOptions={[10, 25, 50, 100]}
          disableSelectionOnClick
          density="standard"
          disableColumnMenu={false}
          sortingOrder={['desc', 'asc']}
          initialState={{
            sorting: {
              sortModel: [{ field: 'displayId', sort: 'asc' }],
            },
            pagination: {
              pageSize: 25,
            },
          }}
          sx={{ 
            width: '100%',
            flexGrow: 1,
            minHeight: 400,
            height: '100%', 
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f7fa',
              color: colors.secondary.main,
              fontWeight: 600,
            },
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            border: 'none',
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f0f0f0',
            },
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: colors.hover.green,
              }
            },
            '& .MuiDataGrid-row.Mui-selected': {
              backgroundColor: `${colors.hover.green} !important`,
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '1px solid #f0f0f0',
            }
          }}
        />
      </Paper>

      {/* Dokument-Vorschau-Dialog */}
      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="lg"
        fullWidth
        aria-labelledby="document-preview-title"
      >
        <DialogTitle id="document-preview-title" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {previewType?.startsWith('image/') ? (
              <ImageIcon sx={{ color: colors.accent.blue }} />
            ) : previewType === 'application/pdf' ? (
              <PictureAsPdfIcon sx={{ color: colors.primary.dark }} />
            ) : (
              <DescriptionIcon sx={{ color: colors.secondary.main }} />
            )}
            <Typography variant="h6">{previewName}</Typography>
          </Box>
          <IconButton 
            edge="end" 
            color="inherit" 
            onClick={handleClosePreview} 
            aria-label="schließen"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {renderPreview()}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleClosePreview}
            sx={{ 
              color: colors.secondary.main, 
              fontWeight: 500
            }}
          >
            Schließen
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              // Wenn die URL vorhanden ist, extrahiere die ID und starte Download
              if (previewUrl) {
                // Wir versuchen, die Dokument-ID aus der URL zu extrahieren
                // Letzter Teil der URL nach dem letzten Slash
                const urlParts = previewUrl.split('/');
                const lastPart = urlParts[urlParts.length - 1];
                
                // Suche das entsprechende Dokument anhand der ID
                const matchingDokument = dokumente.find(doc => doc.id === lastPart || 
                    (doc.originalDoc && doc.originalDoc._id === lastPart));
                
                if (matchingDokument) {
                  handleDownload(matchingDokument.id, matchingDokument);
                } else {
                  // Fallback: Versuche es mit der extrahierten ID
                  handleDownload(lastPart, { id: lastPart, originalDoc: { url: previewUrl } });
                }
              }
            }}
            startIcon={<CloudDownloadIcon />}
            sx={{
              bgcolor: colors.primary.main,
              color: colors.text.onPrimary,
              fontWeight: 600,
              '&:hover': {
                bgcolor: colors.primary.dark
              }
            }}
          >
            Herunterladen
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar für Benachrichtigungen */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 