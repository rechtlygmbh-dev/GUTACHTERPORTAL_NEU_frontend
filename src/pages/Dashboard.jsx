import * as React from 'react';
import { useEffect, useCallback } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import { colors } from '../theme/colors';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import StatistikDashboard from '../components/StatistikDashboard';
import { useNavigate } from 'react-router-dom';
import { useCase } from '../context/CaseContext';
import { useAuth } from '../context/AuthContext';
import LinearProgress from '@mui/material/LinearProgress';

export default function Dashboard() {
  const navigate = useNavigate();
  const { cases, loading, refreshCases } = useCase();
  const { user } = useAuth();

  // Optimierte Aktualisierungsfunktion
  const loadData = useCallback(async () => {
    if (refreshCases) {
      await refreshCases();
    }
  }, [refreshCases]);

  // Automatische Aktualisierung nur beim Mounten
  useEffect(() => {
    loadData();
  }, [loadData]);

  const gotoFaelle = () => navigate('/faelle');
  const gotoFallDetail = (id) => navigate(`/falldetail/${id}`);
  const gotoDokumente = () => navigate('/dokumente');

  // Aktive Fälle (erste 3)
  const aktiveFaelle = cases.slice(0, 3).map(fall => ({
    id: fall._id,
    name: fall.fallname,
    status: fall.status
  }));

  // Hochgeladene Dokumente (erste 3)
  const dokumente = cases.slice(0, 3).flatMap(fall => 
    fall.dokumente ? fall.dokumente.map(doc => ({
      id: doc._id || `doc-${Math.random()}`,
      name: doc.titel || doc.name || doc.pfad?.split('/').pop() || 'Unbekanntes Dokument',
      kategorie: doc.kategorie || 'sonstiges',
      fallId: fall._id,
      fallName: fall.fallname || 'Unbenannter Fall',
      dateityp: doc.dateityp,
      hochgeladenAm: doc.hochgeladenAm
    })) : []
  ).slice(0, 3);

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
    sonstiges: 'Sonstiges'
  };

  // Hilfsfunktion für Dateinamen
  const getDokumentName = (doc) => {
    if (doc.titel) return doc.titel;
    if (doc.name) return doc.name;
    if (doc.pfad) {
      const pfadTeile = doc.pfad.split('/');
      return pfadTeile[pfadTeile.length - 1];
    }
    return 'Unbekanntes Dokument';
  };

  return (
    <Box sx={{ minHeight: '100vh', background: colors.background.paper, p: { xs: 0.5, sm: 1, md: 4 } }}>
      {/* Willkommensbenachrichtigung */}
      <Alert severity="success" sx={{ mb: 3, fontSize: 18, fontWeight: 500, background: colors.background.gradientGreen, color: colors.text.onPrimary }}>
        Willkommen zurück, {user?.vorname} {user?.nachname}!
      </Alert>

      {/* Kachel: Jetzt Fall anlegen */}
      <Paper elevation={3} sx={{
        width: '100%',
        mb: 4,
        p: 4,
        borderRadius: 3,
        background: colors.background.gradientBlue,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        boxShadow: colors.shadows.md
      }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: colors.accent.white, mb: 1 }}>
          Jetzt neuen Fall anlegen
        </Typography>
        <Typography variant="body1" sx={{ color: colors.accent.white, mb: 2 }}>
          Erfassen Sie einen neuen Gutachtenfall schnell und unkompliziert. Alle Angaben können später ergänzt werden.
        </Typography>
        <Button
          variant="contained"
          size="large"
          sx={{
            backgroundColor: colors.primary.main,
            color: colors.secondary.main,
            fontWeight: 700,
            px: 4,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: 18,
            '&:hover': {
              backgroundColor: colors.primary.dark,
              color: colors.secondary.main
            }
          }}
          onClick={() => navigate('/faelle/neu')}
        >
          Jetzt Fall anlegen
        </Button>
      </Paper>

      {/* Übersicht: Zahlen */}
      {/* Entfernt: Cards für Aktive Fälle, Hochgeladene Dokumente, Offene Aufgaben */}

      {/* Zwei Kacheln: Aktive Fälle & Hochgeladene Dokumente */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, background: '#fff', minHeight: 180, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: colors.secondary.main }}>
                Aktive Fälle
              </Typography>
              <Button variant="outlined" size="small" onClick={gotoFaelle} sx={{ color: colors.primary.main, borderColor: colors.primary.main, fontWeight: 600, '&:hover': { bgcolor: colors.hover.green } }}>
                Alle Fälle anzeigen
              </Button>
            </Box>
            {loading ? (
              <LinearProgress />
            ) : (
              <List>
                {aktiveFaelle.length > 0 ? (
                  aktiveFaelle.map((fall, index) => (
                    <ListItem
                      component="button"
                      key={`fall-${fall.id}-${index}`}
                      onClick={() => gotoFallDetail(fall.id)}
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        background: colors.background.paper,
                        color: colors.secondary.main,
                        outline: 'none',
                        '&:hover': {
                          background: colors.hover.green,
                          color: colors.primary.main,
                          outline: `1.5px solid ${colors.primary.main}`,
                        },
                      }}
                    >
                      <ListItemIcon>
                        <FolderIcon sx={{ color: colors.primary.main }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={fall.name} 
                        secondary={fall.status}
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">Keine aktiven Fälle vorhanden.</Typography>
                )}
              </List>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, background: '#fff', minHeight: 180, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: colors.secondary.main }}>
                Hochgeladene Dokumente
              </Typography>
              <Button variant="outlined" size="small" onClick={gotoDokumente} sx={{ color: colors.primary.main, borderColor: colors.primary.main, fontWeight: 600, '&:hover': { bgcolor: colors.hover.green } }}>
                Zu den Dokumenten
              </Button>
            </Box>
            {loading ? (
              <LinearProgress />
            ) : (
              <List>
                {dokumente.length > 0 ? (
                  dokumente.map((doc, index) => (
                    <ListItem
                      component="button"
                      key={`doc-${doc.id}-${index}`}
                      onClick={() => gotoFallDetail(doc.fallId)}
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        background: colors.background.paper,
                        color: colors.secondary.main,
                        outline: 'none',
                        '&:hover': {
                          background: colors.hover.green,
                          color: colors.primary.main,
                          outline: `1.5px solid ${colors.primary.main}`,
                        },
                      }}
                    >
                      <ListItemIcon>
                        <DescriptionIcon sx={{ color: colors.primary.main }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={getDokumentName(doc)}
                        secondary={
                          <Box component="span" sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography component="span" variant="caption" color="text.secondary">
                              {dokumentTypen[doc.kategorie] || 'Sonstiges Dokument'}
                            </Typography>
                            <Typography component="span" variant="caption" color="text.secondary">
                              Fall: {doc.fallName}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">Keine Dokumente vorhanden.</Typography>
                )}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Statistiken/Diagramme (Platzhalter) */}
      <StatistikDashboard />
    </Box>
  );
} 