import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

export default function FallSendenDialog({ open, onClose, fallData, dokumente = [], onSent }) {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const { user } = useAuth();

  const handleSend = async () => {
    setLoading(true);
    try {
      // Determine API URL based on environment
      const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      const API_URL = isProduction 
        ? 'https://gutachterportal-neu-backend-9e0y.onrender.com/api'
        : '/api'; // Use proxy in development

      console.log('API URL:', `${API_URL}/cases/send`); // Debug log
      
      const res = await fetch(`${API_URL}/cases/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ fallId: fallData._id })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.erfolg) {
        setSnackbar({ 
          open: true, 
          message: 'Fall wurde erfolgreich an anfragen@rechtly.de und an Sie gesendet.', 
          severity: 'success' 
        });
        if (onSent && data.fall) onSent(data.fall);
        window.dispatchEvent(new Event('caseStatusChanged'));
        onClose();
      } else {
        setSnackbar({ 
          open: true, 
          message: data.nachricht || 'Fehler beim Senden des Falls.', 
          severity: 'error' 
        });
      }
    } catch (err) {
      console.error('Error sending case:', err);
      setSnackbar({ 
        open: true, 
        message: 'Fehler beim Senden des Falls. Bitte versuchen Sie es erneut.', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  // Hilfsfunktion für Ja/Nein
  const jaNein = (val) => val ? 'Ja' : 'Nein';

  // Hilfsfunktion für deutsches Datumsformat TT-MM-YYYY
  const formatDateDE = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d)) return '-';
    return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getFullYear()}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: colors.background.gradientBlue, color: colors.accent.white }}>
        Fall an Rechtly senden
      </DialogTitle>
      <DialogContent sx={{ py: 3 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/Logo Kopie.png" alt="Rechtly Logo" style={{ maxWidth: 180, marginBottom: 8 }} />
        </div>
        <Typography variant="h6" sx={{ mb: 2, color: colors.secondary.main }}>Zusammenfassung</Typography>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <tbody>
            <tr><td colSpan={2}><b>Gutachterdaten</b></td></tr>
            <tr><td>Name:</td><td>{user?.vorname && user?.nachname ? `${user.vorname} ${user.nachname}` : fallData.gutachterName || '-'}</td></tr>
            <tr><td>Gutachternummer:</td><td>{fallData.gutachterNummer || '-'}</td></tr>
            <tr><td colSpan={2} style={{ height: 8 }}></td></tr>
            <tr><td colSpan={2}><b>Fallinformationen</b></td></tr>
            <tr><td>Aktenzeichen:</td><td>{fallData.aktenzeichen || '-'}</td></tr>
            <tr><td>ID:</td><td>{fallData._id || '-'}</td></tr>
            <tr><td>Erstellt am:</td><td>{formatDateDE(fallData.createdAt)}</td></tr>
            <tr><td>Zuletzt geändert:</td><td>{formatDateDE(fallData.updatedAt)}</td></tr>
            <tr><td colSpan={2} style={{ height: 8 }}></td></tr>
            <tr><td colSpan={2}><b>Mandantendaten</b></td></tr>
            <tr><td>Name:</td><td>{fallData.mandant?.vorname} {fallData.mandant?.nachname}</td></tr>
            <tr><td>Telefon:</td><td>{fallData.mandant?.telefon}</td></tr>
            <tr><td>E-Mail:</td><td>{fallData.mandant?.email}</td></tr>
            <tr><td>Geburtsdatum:</td><td>{fallData.mandant?.geburtsdatum}</td></tr>
            <tr><td>Adresse:</td><td>{fallData.mandant?.adresse}</td></tr>
            <tr><td colSpan={2} style={{ height: 8 }}></td></tr>
            <tr><td colSpan={2}><b>Schadeninformationen</b></td></tr>
            <tr><td>Schadenstyp:</td><td>{fallData.schaden?.schadenstyp}</td></tr>
            <tr><td>Schadensschwere:</td><td>{fallData.schaden?.schadensschwere}</td></tr>
            <tr><td>Unfallort:</td><td>{fallData.schaden?.unfallort}</td></tr>
            <tr><td>Unfallzeit:</td><td>{fallData.schaden?.unfallzeit}</td></tr>
            <tr><td>Beschreibung:</td><td>{fallData.schaden?.beschreibung}</td></tr>
            <tr><td colSpan={2} style={{ height: 8 }}></td></tr>
            <tr><td colSpan={2}><b>Erste Partei</b></td></tr>
            <tr><td>Name:</td><td>{fallData.erstPartei?.vorname} {fallData.erstPartei?.nachname}</td></tr>
            <tr><td>Versicherung:</td><td>{fallData.erstPartei?.versicherung}</td></tr>
            <tr><td>Kennzeichen:</td><td>{fallData.erstPartei?.kennzeichen}</td></tr>
            <tr><td>KFZ Modell:</td><td>{fallData.erstPartei?.kfzModell}</td></tr>
            <tr><td>Fahrzeughalter:</td><td>{fallData.erstPartei?.fahrzeughalter}</td></tr>
            <tr><td>Beteiligung:</td><td>{fallData.erstPartei?.beteiligungsposition}</td></tr>
            <tr><td colSpan={2} style={{ height: 8 }}></td></tr>
            <tr><td colSpan={2}><b>Zweite Partei</b></td></tr>
            <tr><td>Name:</td><td>{fallData.zweitPartei?.vorname} {fallData.zweitPartei?.nachname}</td></tr>
            <tr><td>Versicherung:</td><td>{fallData.zweitPartei?.versicherung}</td></tr>
            <tr><td>Kennzeichen:</td><td>{fallData.zweitPartei?.kennzeichen}</td></tr>
            <tr><td>Beteiligung:</td><td>{fallData.zweitPartei?.beteiligungsposition}</td></tr>
            <tr><td colSpan={2} style={{ height: 8 }}></td></tr>
            <tr><td><b>Datenschutz angenommen?</b></td><td>{jaNein(fallData.datenschutzAngenommen)}</td></tr>
            <tr><td colSpan={2} style={{ height: 8 }}></td></tr>
            <tr><td colSpan={2}><b>Hochgeladene Dokumente</b></td></tr>
            {dokumente.length === 0 ? (
              <tr><td colSpan={2}>Keine Dokumente vorhanden</td></tr>
            ) : (
              dokumente.map((doc, idx) => (
                <tr key={doc._id || idx}><td>{doc.kategorie || doc.name}</td><td>{doc.titel || doc.name}</td></tr>
              ))
            )}
          </tbody>
        </table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: colors.secondary.main }}>Abbrechen</Button>
        <Button variant="contained" onClick={handleSend} disabled={loading} sx={{ bgcolor: colors.primary.main, color: colors.text.onPrimary, fontWeight: 600 }}>
          {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Fall senden'}
        </Button>
      </DialogActions>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}