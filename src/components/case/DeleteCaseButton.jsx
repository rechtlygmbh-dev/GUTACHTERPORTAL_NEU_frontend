import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { deleteCase } from '../../services/caseService';
import { colors } from '../../theme/colors';

export default function DeleteCaseButton({ caseId, onDeleted }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpen = (e) => {
    e.stopPropagation();
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setError('');
  };

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await deleteCase(caseId);
      if (res.erfolg) {
        setOpen(false);
        if (onDeleted) onDeleted();
      } else {
        setError(res.nachricht || 'Fehler beim Löschen des Falls');
      }
    } catch (err) {
      setError(err.response?.data?.nachricht || 'Fehler beim Löschen des Falls');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <IconButton 
        size="small" 
        aria-label="löschen"
        sx={{ color: '#d32f2f' }}
        onClick={handleOpen}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle sx={{ color: colors.secondary.main, fontWeight: 600 }}>
          Fall wirklich löschen?
        </DialogTitle>
        <DialogContent>
          <Typography>Dieser Vorgang kann nicht rückgängig gemacht werden.</Typography>
          {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading} variant="outlined">Abbrechen</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={22} /> : 'Löschen'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 