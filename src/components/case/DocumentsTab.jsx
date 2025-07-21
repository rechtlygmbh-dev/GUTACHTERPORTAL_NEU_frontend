import * as React from 'react';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { DataGrid } from '@mui/x-data-grid';
import { colors } from '../../theme/colors';
import Divider from '@mui/material/Divider';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useCase } from '../../context/CaseContext';
import { documentService } from '../../services/api';

// Status-Komponente für Upload-Buttons
const UploadStatus = ({ status }) => {
  switch (status) {
    case 'success':
      return <CheckCircleIcon sx={{ color: 'success.main', ml: 1 }} />;
    case 'error':
      return <ErrorIcon sx={{ color: 'error.main', ml: 1 }} />;
    case 'missing':
      return <ErrorIcon sx={{ color: 'warning.main', ml: 1 }} />;
    default:
      return null;
  }
};

// Status-Text für Upload-Buttons
const UploadStatusText = ({ status }) => {
  switch (status) {
    case 'success':
      return <Typography variant="caption" sx={{ color: 'success.main', ml: 1 }}>Hochgeladen</Typography>;
    case 'error':
      return <Typography variant="caption" sx={{ color: 'error.main', ml: 1 }}>Fehler</Typography>;
    case 'missing':
      return <Typography variant="caption" sx={{ color: 'warning.main', ml: 1 }}>Nicht hochgeladen</Typography>;
    default:
      return null;
  }
};

// Upload-Konfigurationen
const uploadGroups = [
  {
    label: 'Führerschein',
    fields: [
      { label: 'Vorderseite', name: 'fuehrerschein_vorne' },
      { label: 'Rückseite', name: 'fuehrerschein_hinten' },
    ],
  },
  {
    label: 'Personalausweis',
    fields: [
      { label: 'Vorderseite', name: 'personalausweis_vorne' },
      { label: 'Rückseite', name: 'personalausweis_hinten' },
    ],
  },
];

const singleUploads = [
  { label: 'KFZ Gutachten', name: 'kfz_gutachten', multiple: false },
  { label: 'Fahrzeugschein', name: 'fahrzeugschein', multiple: false },
  { label: 'Ärztliche Atteste / Diagnosen', name: 'atteste', multiple: false },
  { label: 'Unfallbericht', name: 'unfallbericht', multiple: false },
  { label: 'Sonstige Dokumente', name: 'sonstige', multiple: true },
  { label: 'Bilder vom Unfall', name: 'unfall_bilder', multiple: true },
  { label: 'Rechnungen', name: 'rechnungen', multiple: false },
  { label: 'Reparaturrechnung / Kostenvoranschlag', name: 'reparatur', multiple: false },
];

// Mapping für Dokumenttypen
const dokumentTypen = {
  fuehrerschein_vorne: 'Führerschein (Vorderseite)',
  fuehrerschein_hinten: 'Führerschein (Rückseite)',
  personalausweis_vorne: 'Personalausweis (Vorderseite)',
  personalausweis_hinten: 'Personalausweis (Rückseite)',
  kfz_gutachten: 'KFZ Gutachten',
  fahrzeugschein: 'Fahrzeugschein',
  rechnungen: 'Rechnungen',
  unfallbericht: 'Unfallbericht',
  unfall_bilder: 'Bilder vom Unfall',
  sonstige: 'Sonstige Dokumente',
  atteste: 'Ärztliche Atteste / Diagnosen',
  reparatur: 'Reparaturrechnung / Kostenvoranschlag',
  sonstiges: 'Sonstiges',
  vollmacht: 'Vollmacht'
};

export default function DocumentsTab({ dokumente = [], fallId, onRefresh }) {
  const [uploads, setUploads] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { refreshCases, cases } = useCase();
  
  // Neue States für das Preview-Modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewName, setPreviewName] = useState('');
  const [previewType, setPreviewType] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [currentDocumentId, setCurrentDocumentId] = useState(null); // Für den Download

  // State für Upload Vollmacht
  const [vollmachtUploading, setVollmachtUploading] = useState(false);
  const [vollmachtError, setVollmachtError] = useState('');

  // Mapping: Falls die Dokumente aus der DB eine andere Struktur haben, hier anpassen
  const rows = (dokumente || []).map((doc, idx) => ({
    id: doc._id || idx + 1,
    _id: doc._id, // Original ID für API-Aufrufe
    name: doc.titel || doc.name || 'Unbekanntes Dokument',
    kategorie: doc.kategorie || 'sonstiges',
    datum: doc.hochgeladenAm ? new Date(doc.hochgeladenAm).toLocaleDateString('de-DE') : '',
    dateityp: doc.dateityp,
    dokumentNummer: String(idx + 1).padStart(2, '0'), // Neue fortlaufende Nummer
    ...doc
  }));

  // Handler für Upload-Refresh
  const handleUploadSuccess = async () => {
    // Benachrichtige über Dokumentenänderung
    window.dispatchEvent(new Event('documentChange'));
    // Rufe onRefresh auf
    if (onRefresh) await onRefresh();
    
    // Aktualisiere den CaseContext
    if (refreshCases) {
      await refreshCases();
    }
    
    // Reset Upload-Status
    setUploads({});
    setUploadStatus({});
  };

  // Snackbar schließen
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Dokument löschen
  const handleDelete = async (documentId) => {
    if (!documentId) {
      console.error('Keine Dokument-ID vorhanden');
      return;
    }

    if (window.confirm('Möchten Sie dieses Dokument wirklich löschen?')) {
      try {
        console.log('🗑️ Lösche Dokument:', documentId);
        
        // Zeige Ladeanimation
        setSnackbar({
          open: true,
          message: '🔄 Dokument wird gelöscht...',
          severity: 'info'
        });

        const response = await documentService.deleteDocument(documentId);
        console.log('📥 Lösch-Response:', response);
        
        if (response.erfolg) {
          setSnackbar({
            open: true,
            message: '✅ Dokument erfolgreich gelöscht',
            severity: 'success'
          });
          
          // Aktualisiere die Dokumentenliste und den Context
          await handleUploadSuccess();
        } else {
          throw new Error(response.nachricht || 'Fehler beim Löschen des Dokuments');
        }
      } catch (error) {
        console.error('❌ Fehler beim Löschen:', error);
        setSnackbar({
          open: true,
          message: `❌ Fehler beim Löschen: ${error.message || 'Unbekannter Fehler'}`,
          severity: 'error'
        });
      }
    }
  };

  // Dokument herunterladen
  const handleDownload = async (documentId, row) => {
    if ((row.kategorie === 'vollmacht' || row.kategorie === 'datenschutzerklaerung') && row.url) {
      window.open(row.url, '_blank');
      return;
    }
    // Standard-Logik
    try {
      setSnackbar({
        open: true,
        message: `🔄 Download wird vorbereitet...`,
        severity: 'info'
      });
      const response = await documentService.getDocumentById(documentId);
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
          message: `✅ Download von ${fileName} gestartet`,
          severity: 'success'
        });
      } else {
        throw new Error(response.nachricht || 'Fehler beim Herunterladen');
      }
    } catch (error) {
      console.error('❌ Fehler beim Herunterladen:', error);
      setSnackbar({
        open: true,
        message: `❌ Fehler beim Herunterladen: ${error.message || 'Unbekannter Fehler'}`,
        severity: 'error'
      });
    }
  };

  // Dokument anzeigen (im Modal)
  const handleView = async (documentId, row) => {
    if ((row.kategorie === 'vollmacht' || row.kategorie === 'datenschutzerklaerung') && row.url) {
      setPreviewUrl(row.url);
      setPreviewName(row.name);
      setPreviewType('application/pdf');
      setPreviewOpen(true);
      setCurrentDocumentId(documentId);
      return;
    }
    // Standard-Logik
    try {
      setPreviewLoading(true);
      const response = await documentService.getDocumentById(documentId);
      if (response.erfolg) {
        const dokument = response.dokument;
        setPreviewUrl(dokument.url);
        setPreviewName(dokument.name || 'Dokument');
        setPreviewType(dokument.dateityp || 'application/octet-stream');
        setPreviewOpen(true);
        setCurrentDocumentId(documentId);
      } else {
        throw new Error(response.nachricht || 'Fehler beim Anzeigen');
      }
    } catch (error) {
      console.error('❌ Fehler beim Anzeigen:', error);
      setPreviewError(error.message);
      setSnackbar({
        open: true,
        message: `❌ Fehler beim Anzeigen: ${error.message || 'Unbekannter Fehler'}`,
        severity: 'error'
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // Modal schließen
  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewUrl('');
    setPreviewType('');
    setPreviewName('');
    setPreviewError(null);
    setCurrentDocumentId(null);
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

  // Spalten-Definition nach den Handler-Funktionen
  const columns = [
    { 
      field: 'dokumentNummer', 
      headerName: 'ID', 
      width: 70, 
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
        const icon = params.row.dateityp?.startsWith('image/') ? 
          <ImageIcon sx={{ color: colors.primary.dark, mr: 1 }} /> : 
          <DescriptionIcon sx={{ color: colors.secondary.main, mr: 1 }} />;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {icon}
            <Typography variant="body2">{params.value}</Typography>
          </Box>
        );
      }
    },
    { 
      field: 'kategorie', 
      headerName: 'Dokumenttyp', 
      width: 200, 
      flex: 1.5,
      renderCell: (params) => (
        <Typography variant="body2">
          {dokumentTypen[params.value] || 'Unbekannt'}
        </Typography>
      )
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
            sx={{ color: colors.accent.blue }} 
            aria-label="ansehen"
            onClick={() => handleView(params.row._id, params.row)}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            sx={{ color: colors.primary.dark }} 
            aria-label="herunterladen"
            onClick={() => handleDownload(params.row._id, params.row)}
          >
            <CloudDownloadIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            sx={{ color: '#d32f2f' }} 
            aria-label="löschen"
            onClick={() => handleDelete(params.row._id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      )
    },
  ];

  // Upload-Handler für Gruppen/Einzeluploads
  const handleFileChange = async (e, name) => {
    const files = Array.from(e.target.files);
    console.log('📁 Ausgewählte Dateien:', files);
    setUploads((prev) => ({ ...prev, [name]: files }));
    
    if (files.length > 0 && fallId) {
      for (const file of files) {
        setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }));
        
        const formData = new FormData();
        formData.append('dokument', file);
        formData.append('fallId', fallId);
        formData.append('titel', file.name); // Setze den Dateinamen als Titel
        formData.append('name', file.name); // Behalte auch den Namen
        formData.append('kategorie', name);
        formData.append('dateityp', file.type);
        formData.append('groesse', file.size);
        
        try {
          const res = await documentService.uploadDocument(formData);
          console.log('📥 Upload-Response:', res);
          
          if (res.erfolg) {
            setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }));
            setSnackbar({
              open: true,
              message: `✅ ${file.name} erfolgreich hochgeladen`,
              severity: 'success'
            });
            
            // Aktualisiere die Dokumentenliste und den Context
            await handleUploadSuccess();
          } else {
            throw new Error(res.nachricht || 'Unbekannter Fehler beim Upload');
          }
        } catch (err) {
          console.error('❌ Upload-Fehler:', err);
          setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
          setSnackbar({
            open: true,
            message: `❌ Fehler beim Hochladen von ${file.name}: ${err.message || 'Unbekannter Fehler'}`,
            severity: 'error'
          });
        }
      }
    }
  };

  // Prüfe Dokument-Status
  const getDocumentStatus = (kategorie) => {
    const doc = dokumente?.find(d => d.kategorie === kategorie);
    if (!doc) return 'missing';
    return 'success';
  };

  // Render-Funktion für Upload-Button mit Status
  const renderUploadButton = (field, groupLabel = '') => {
    const status = getDocumentStatus(field.name);
    const isUploading = uploadStatus[field.name] === 'uploading';

    return (
      <Box key={field.name}>
        <Button
          variant="contained"
          component="label"
          startIcon={<CloudUploadIcon />}
          sx={{
            backgroundColor: status === 'success' ? colors.primary.main : colors.primary.main,
            color: colors.secondary.main,
            fontWeight: 600,
            '&:hover': {
              backgroundColor: colors.primary.dark,
              color: colors.secondary.main
            },
            width: '100%',
            justifyContent: 'flex-start',
            position: 'relative',
            pr: 4 // Platz für Status-Icon
          }}
        >
          {field.label}
          <input
            type="file"
            hidden
            multiple={field.multiple}
            onChange={(e) => handleFileChange(e, field.name)}
          />
          <Box sx={{ 
            position: 'absolute', 
            right: 8, 
            display: 'flex', 
            alignItems: 'center' 
          }}>
            {isUploading ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              <UploadStatus status={status} />
            )}
          </Box>
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, ml: 1 }}>
          <UploadStatusText status={status} />
          {field.multiple && (
            <Typography variant="caption" sx={{ color: colors.secondary.main, ml: 1 }}>
              (Mehrere Dateien möglich)
            </Typography>
          )}
        </Box>
        {uploads[field.name]?.map((file, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Typography variant="body2" sx={{ color: colors.secondary.main, ml: 1, flex: 1 }}>
              {file.name}
            </Typography>
            {uploadStatus[file.name] === 'uploading' && (
              <CircularProgress size={20} sx={{ ml: 1 }} />
            )}
            {uploadStatus[file.name] === 'success' && (
              <Typography variant="body2" sx={{ color: 'success.main', ml: 1 }}>
                ✅
              </Typography>
            )}
            {uploadStatus[file.name] === 'error' && (
              <Typography variant="body2" sx={{ color: 'error.main', ml: 1 }}>
                ❌
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    );
  };

  // Handler für Vollmacht-Upload
  const handleVollmachtUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVollmachtUploading(true);
    setVollmachtError('');
    try {
      const formData = new FormData();
      formData.append('dokument', file);
      formData.append('name', file.name);
      formData.append('kategorie', 'vollmacht');
      formData.append('fallId', fallId);
      const res = await documentService.uploadDocument(formData);
      if (res.erfolg) {
        setSnackbar({ open: true, message: 'Vollmacht erfolgreich hochgeladen', severity: 'success' });
        if (refreshCases) await refreshCases(); // expliziter Reload aller Fälle
        if (onRefresh) await onRefresh();
        // Debug: Zeige die aktuellen Dokumente im Fall nach Upload
        const updatedCase = cases.find(f => f._id === fallId);
        if (updatedCase) {
          console.log('📄 Dokumente nach Upload:', updatedCase.dokumente);
        } else {
          console.log('⚠️ Fall nach Upload nicht gefunden.');
        }
      } else {
        setVollmachtError(res.nachricht || 'Fehler beim Hochladen der Vollmacht');
      }
    } catch (err) {
      setVollmachtError(err.message || 'Fehler beim Hochladen der Vollmacht');
    } finally {
      setVollmachtUploading(false);
    }
  };

  return (
    <Box>
      {/* Upload-Gruppen und Einzeluploads */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: colors.shadows.sm }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: colors.secondary.main, mb: 2 }}>
          Dokumente hochladen
        </Typography>
        <Grid container spacing={3}>
          {/* Gruppen für Führerschein und Personalausweis */}
          {uploadGroups.map((group) => (
            <Grid item xs={12} md={6} key={group.label}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 2, mb: 2, background: '#f5f7fa', boxShadow: colors.shadows.sm }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.secondary.main, mb: 1 }}>
                  {group.label}
                </Typography>
                <Stack spacing={1}>
                  {group.fields.map((field) => renderUploadButton(field, group.label))}
                </Stack>
              </Paper>
            </Grid>
          ))}
          {/* Einzelne Uploads */}
          {singleUploads.map((field) => (
            <Grid item xs={12} md={6} key={field.name}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 2, mb: 2, background: '#f5f7fa', boxShadow: colors.shadows.sm }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.secondary.main, mb: 1 }}>
                  {field.label}
                </Typography>
                {renderUploadButton(field)}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: colors.shadows.sm }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: colors.secondary.main, mb: 2 }}>
          Vollmacht hochladen
        </Typography>
        <Button
          variant="contained"
          component="label"
          startIcon={<CloudUploadIcon />}
          disabled={vollmachtUploading}
          sx={{ fontWeight: 600 }}
        >
          {vollmachtUploading ? 'Wird hochgeladen...' : 'Vollmacht auswählen'}
          <input type="file" accept="application/pdf" hidden onChange={handleVollmachtUpload} />
        </Button>
        {vollmachtError && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>{vollmachtError}</Typography>
        )}
      </Paper>
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, boxShadow: colors.shadows.sm }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: colors.secondary.main, mb: 2 }}>
          Hochgeladene Dokumente
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          disableSelectionOnClick
          autoHeight
          density="standard"
          disableColumnMenu
          sx={{
            height: '100%',
            width: '100%',
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
            '& .MuiDataGrid-row:hover': {
              backgroundColor: colors.hover.green,
            },
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
              <DescriptionIcon sx={{ color: colors.primary.dark }} />
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
            onClick={() => currentDocumentId && handleDownload(currentDocumentId, { _id: currentDocumentId, name: previewName, kategorie: previewType === 'application/pdf' ? 'vollmacht' : 'sonstiges', url: previewUrl })}
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
          sx={{ 
            width: '100%',
            '& .MuiAlert-icon': {
              display: 'flex',
              alignItems: 'center'
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 