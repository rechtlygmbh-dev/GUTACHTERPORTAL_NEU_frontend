import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { documentService } from '../../services/api';
import { colors } from '../../theme/colors';

const kategorien = [
  'Gutachten',
  'Foto',
  'Bericht',
  'Rechnung',
  'Sonstiges'
];

export default function DocumentUpload({ fallId, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [kategorie, setKategorie] = useState('Sonstiges');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setName(e.target.files[0]?.name || '');
    setError('');
    setSuccess(false);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Bitte wählen Sie eine Datei aus.');
      return;
    }
    setUploading(true);
    setError('');
    setSuccess(false);
    try {
      const formData = new FormData();
      formData.append('dokument', file);
      formData.append('fallId', fallId);
      formData.append('name', name);
      formData.append('kategorie', kategorie);
      // Optional: weitere Felder wie beschreibung, tags
      const res = await documentService.uploadDocument(formData);
      if (res.erfolg) {
        setSuccess(true);
        setFile(null);
        setName('');
        setKategorie('Sonstiges');
        if (onUploadSuccess) onUploadSuccess();
      } else {
        setError(res.nachricht || 'Fehler beim Hochladen der Datei');
      }
    } catch (err) {
      setError(err.response?.data?.nachricht || 'Fehler beim Hochladen der Datei');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: colors.secondary.main, mb: 2 }}>
        Dokument hochladen
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Dokument erfolgreich hochgeladen!</Alert>}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <Button
          variant="contained"
          component="label"
          startIcon={<span role="img" aria-label="upload">📤</span>}
          sx={{ bgcolor: colors.primary.main, color: colors.text.onPrimary, fontWeight: 600, '&:hover': { bgcolor: colors.primary.dark } }}
        >
          Datei auswählen
          <input type="file" hidden onChange={handleFileChange} />
        </Button>
        <TextField
          label="Dateiname"
          value={name}
          onChange={e => setName(e.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
        />
        <TextField
          label="Kategorie"
          select
          value={kategorie}
          onChange={e => setKategorie(e.target.value)}
          size="small"
          sx={{ minWidth: 150 }}
        >
          {kategorien.map(kat => <MenuItem key={kat} value={kat}>{kat}</MenuItem>)}
        </TextField>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={uploading || !file}
          sx={{ fontWeight: 600 }}
        >
          {uploading ? <CircularProgress size={22} /> : 'Hochladen'}
        </Button>
        {file && (
          <Typography variant="body2" sx={{ color: colors.secondary.main }}>
            {file.name}
          </Typography>
        )}
      </Box>
    </Box>
  );
} 