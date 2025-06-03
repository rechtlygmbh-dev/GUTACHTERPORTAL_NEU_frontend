import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import EditIcon from '@mui/icons-material/Edit';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import { colors } from '../../theme/colors';

export default function ActivitiesTab({ aktivitaeten }) {
  // Mapping: Falls die Aktivitäten/Notizen aus der DB eine andere Struktur haben, hier anpassen
  // Beispiel für Notizen: { text, erstelltVon, erstelltAm }
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: colors.secondary.main, mb: 2 }}>
        Aktivitäten
      </Typography>
      <Stack spacing={2}>
        {(aktivitaeten || []).length === 0 && (
          <Typography variant="body2" color="text.secondary">Keine Aktivitäten vorhanden.</Typography>
        )}
        {(aktivitaeten || []).map((activity, idx) => (
          <Paper
            key={activity._id || idx}
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 2,
              boxShadow: colors.shadows.sm,
              background: '#fff',
            }}
          >
            <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
              <EditIcon sx={{ color: colors.accent.blue }} />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.secondary.main }}>
                {activity.text || activity.title || 'Aktivität'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activity.erstelltVon?.vorname ? `von ${activity.erstelltVon.vorname} ${activity.erstelltVon.nachname}` : ''}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150, textAlign: 'right' }}>
              {activity.erstelltAm ? new Date(activity.erstelltAm).toLocaleString('de-DE') : ''}
            </Typography>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
} 