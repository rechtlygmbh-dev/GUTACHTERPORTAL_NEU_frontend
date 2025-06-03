import * as React from 'react';
import { useMemo, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { colors } from '../theme/colors';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useCase } from '../context/CaseContext';

export default function StatistikDashboard() {
  const { cases, loading, refreshCases } = useCase();

  // Automatische Aktualisierung der Fälle
  useEffect(() => {
    const loadData = async () => {
      if (refreshCases) {
        await refreshCases();
      }
    };
    loadData();
  }, [refreshCases]);

  // Auf Datenschutzänderungen hören
  useEffect(() => {
    const handleDatenschutzChange = () => {
      console.log('📝 Datenschutz-Status geändert, aktualisiere Fälle...');
      if (refreshCases) {
        refreshCases();
      }
    };

    // Event-Listener für Datenschutzänderungen
    window.addEventListener('datenschutzChange', handleDatenschutzChange);

    return () => {
      window.removeEventListener('datenschutzChange', handleDatenschutzChange);
    };
  }, [refreshCases]);

  // Filter-States
  const [monat, setMonat] = useState('');
  const [jahr, setJahr] = useState('2025');
  const [status, setStatus] = useState('alle');
  const [filteredCases, setFilteredCases] = useState([]);

  // Jahre dynamisch (ab 2025)
  const jahre = ['2025', '2026', '2027', '2028'];

  // Hilfsfunktion für Aufgabenstatus
  const isFilled = (value) => value !== undefined && value !== null;

  // Hilfsfunktion für Dokument-Kategorien
  const hasDokument = (dokumente, kategorie) => dokumente?.some(doc => doc.kategorie === kategorie);

  // Alle Cases filtern, wenn die Filter sich ändern oder wenn neue Daten geladen werden
  useEffect(() => {
    setFilteredCases(cases);
  }, [cases]);
  
  // Filter anwenden
  const applyFilters = () => {
    let filtered = [...cases];
    
    // Nach Status filtern
    if (status !== 'alle') {
      filtered = filtered.filter(fall => fall.status === status);
    }
    
    // Nach Monat filtern
    if (monat) {
      filtered = filtered.filter(fall => {
        const fallDate = new Date(fall.erstelltAm);
        return fallDate.getMonth() + 1 === parseInt(monat);
      });
    }
    
    // Nach Jahr filtern
    if (jahr) {
      filtered = filtered.filter(fall => {
        const fallDate = new Date(fall.erstelltAm);
        return fallDate.getFullYear() === parseInt(jahr);
      });
    }
    
    setFilteredCases(filtered);
  };

  // Kennzahlen mit useMemo für bessere Performance
  const kennzahlen = useMemo(() => {
    // Berechne die Gesamtzahl der Dokumente
    const dokumenteGesamt = filteredCases.reduce((acc, fall) => {
      const dokumenteInFall = fall.dokumente?.length || 0;
      return acc + dokumenteInFall;
    }, 0);

    console.log('📊 Dashboard: Dokumente aktualisiert:', dokumenteGesamt);

    return [
      { label: 'Fälle in Bearbeitung', value: filteredCases.filter(fall => fall.status === 'In Bearbeitung').length },
      { label: 'Übermittelte Fälle', value: filteredCases.filter(fall => fall.status === 'Übermittelt').length },
      { 
        label: 'Dokumente hochgeladen', 
        value: dokumenteGesamt
      },
      { label: 'Vollständig ausgefüllte Fälle', value: filteredCases.filter(fall => fall.datenschutzAngenommen).length },
      { 
        label: 'Neue Fälle diese Woche', 
        value: filteredCases.filter(fall => {
          const fallDatum = new Date(fall.erstelltAm);
          const eineWocheZurueck = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return fallDatum > eineWocheZurueck;
        }).length 
      },
    ];
  }, [filteredCases]);

  // Fälle pro Monat berechnen
  const faelleProMonat = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monat = date.toLocaleString('de-DE', { month: 'short' });
      const count = filteredCases.filter(fall => {
        const fallDatum = new Date(fall.erstelltAm);
        return fallDatum.getMonth() === date.getMonth() && fallDatum.getFullYear() === date.getFullYear();
      }).length;
      return { monat, Fälle: count };
    }).reverse();
  }, [filteredCases]);

  // Dokumenten-Uploads pro Monat berechnen
  const dokumentenUploads = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monat = date.toLocaleString('de-DE', { month: 'short' });
    const count = filteredCases.reduce((acc, fall) => {
      if (fall.dokumente) {
        return acc + fall.dokumente.filter(doc => {
          const docDate = new Date(doc.hochgeladenAm);
          return docDate.getMonth() === date.getMonth() && docDate.getFullYear() === date.getFullYear();
        }).length;
      }
      return acc;
    }, 0);
    return { monat, Dokumente: count };
  }).reverse();

  // Qualitätsindikatoren berechnen
  const qualitaet = [
    { name: 'Fehlende Angaben', value: filteredCases.filter(fall => !fall.mandant || !fall.erstPartei).length },
    { name: 'Ohne Gutachten', value: filteredCases.filter(fall => !fall.dokumente || fall.dokumente.length === 0).length },
    { name: 'Ohne Kontakt', value: filteredCases.filter(fall => !fall.mandant || !fall.mandant.telefon).length },
  ];
  const qualitaetColors = [colors.primary.main, colors.accent.blue, colors.secondary.light];

  // Fahrzeugtypen berechnen
  const fahrzeugtypenArray = useMemo(() => {
    const fahrzeugtypen = filteredCases.reduce((acc, fall) => {
      if (fall.erstPartei && fall.erstPartei.kfzModell) {
        const model = fall.erstPartei.kfzModell;
        acc[model] = (acc[model] || 0) + 1;
      }
      return acc;
    }, {});
    
    return Object.entries(fahrzeugtypen)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  }, [filteredCases]);
  
  const fahrzeugColors = [colors.primary.main, colors.accent.blue, colors.secondary.light];

  // Filter zurücksetzen
  const resetFilters = () => {
    setMonat('');
    setJahr('2025');
    setStatus('alle');
    setFilteredCases(cases);
  };

  useEffect(() => {
    const handleCaseStatusChange = () => {
      if (refreshCases) {
        refreshCases();
      }
    };
    window.addEventListener('caseStatusChanged', handleCaseStatusChange);
    return () => {
      window.removeEventListener('caseStatusChanged', handleCaseStatusChange);
    };
  }, [refreshCases]);

  return (
    <Box sx={{ mt: 4 }}>
      {/* Filterleiste */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2, background: '#fff', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.secondary.main, mr: 2 }}>
          Filter:
        </Typography>
        <Select
          value={monat}
          onChange={e => setMonat(e.target.value)}
          displayEmpty
          size="small"
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">Monat (alle)</MenuItem>
          <MenuItem value="1">Januar</MenuItem>
          <MenuItem value="2">Februar</MenuItem>
          <MenuItem value="3">März</MenuItem>
          <MenuItem value="4">April</MenuItem>
          <MenuItem value="5">Mai</MenuItem>
          <MenuItem value="6">Juni</MenuItem>
          <MenuItem value="7">Juli</MenuItem>
          <MenuItem value="8">August</MenuItem>
          <MenuItem value="9">September</MenuItem>
          <MenuItem value="10">Oktober</MenuItem>
          <MenuItem value="11">November</MenuItem>
          <MenuItem value="12">Dezember</MenuItem>
        </Select>
        <Select
          value={jahr}
          onChange={e => setJahr(e.target.value)}
          size="small"
          sx={{ minWidth: 100 }}
        >
          {jahre.map(j => <MenuItem key={j} value={j}>{j}</MenuItem>)}
        </Select>
        <Select
          value={status}
          onChange={e => setStatus(e.target.value)}
          size="small"
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="alle">Status (alle)</MenuItem>
          <MenuItem value="In Bearbeitung">In Bearbeitung</MenuItem>
          <MenuItem value="Übermittelt">Übermittelt</MenuItem>
        </Select>
        <Button 
          variant="outlined" 
          onClick={applyFilters}
          sx={{ color: colors.primary.main, borderColor: colors.primary.main, fontWeight: 600 }}
        >
          Anwenden
        </Button>
        <Button 
          variant="text" 
          onClick={resetFilters}
          sx={{ color: colors.secondary.main, fontWeight: 500 }}
        >
          Zurücksetzen
        </Button>
      </Paper>

      {/* Kennzahlen */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {kennzahlen.map((k) => (
          <Grid item xs={6} sm={4} md={2} key={k.label}>
            <Paper elevation={2} sx={{ p: 2, textAlign: 'center', borderRadius: 2, background: colors.background.gradientBlue, color: colors.text.onDark }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{k.value}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{k.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Diagramme */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2, height: 300 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: colors.secondary.main }}>
              Fälle pro Monat
            </Typography>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={faelleProMonat}>
                <XAxis dataKey="monat" stroke={colors.secondary.light} />
                <YAxis stroke={colors.secondary.light} />
                <Tooltip />
                <Bar dataKey="Fälle" fill={colors.primary.main} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2, height: 300 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: colors.secondary.main }}>
              Häufigste Fahrzeugtypen (Top 3)
            </Typography>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={fahrzeugtypenArray} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {fahrzeugtypenArray.map((entry, i) => (
                    <Cell key={`cell-${entry.name}`} fill={fahrzeugColors[i % fahrzeugColors.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 