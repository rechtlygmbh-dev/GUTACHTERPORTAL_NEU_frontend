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
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Stack from '@mui/material/Stack';
import CreateCaseForm from '../components/case/CreateCaseForm';
import { colors } from '../theme/colors';
import Paper from '@mui/material/Paper';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { getCases } from '../services/caseService';
import { useNavigate } from 'react-router-dom';
import DeleteCaseButton from '../components/case/DeleteCaseButton';

export default function Faelle({ onViewFallDetail }) {
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  // Filter-States
  const [filterId, setFilterId] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterKunde, setFilterKunde] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDatum, setFilterDatum] = useState('');
  const [filterVon, setFilterVon] = useState('');
  const [filterBis, setFilterBis] = useState('');

  // Fälle State
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Fälle laden
  const loadCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCases();
      if (data.erfolg) {
        setCases(data.faelle);
      } else {
        setError(data.nachricht || 'Fehler beim Laden der Fälle');
      }
    } catch (err) {
      setError(err.response?.data?.nachricht || 'Fehler beim Laden der Fälle');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  // Nach dem Anlegen eines Falls neu laden
  const handleCaseCreated = () => {
    setOpenCreateDialog(false);
    loadCases();
  };

  const handleOpenCreateDialog = () => {
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
  };

  // Detailansicht öffnen
  const handleViewFallDetail = (id) => {
    navigate(`/falldetail/${id}`);
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 120, flex: 0.7 },
    { field: 'name', headerName: 'Fallname', width: 180, flex: 2 },
    { field: 'kunde', headerName: 'Kunde', width: 180, flex: 2 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120, 
      flex: 1,
      renderCell: (params) => (
        <Box
          sx={{
            backgroundColor: 
              params.value === 'In Bearbeitung' ? 'rgba(44, 82, 130, 0.2)' : 
              params.value === 'Übermittelt' ? 'rgba(137, 203, 40, 0.2)' : 'rgba(200,200,200,0.2)',
            color: 
              params.value === 'In Bearbeitung' ? colors.accent.blue : 
              params.value === 'Übermittelt' ? colors.primary.dark : colors.secondary.light,
            borderRadius: 1,
            py: 0.5,
            px: 1.5,
            fontSize: '0.875rem',
            fontWeight: 500,
            display: 'inline-block',
          }}
        >
          {params.value}
        </Box>
      )
    },
    { field: 'datum', headerName: 'Datum', width: 120, flex: 1 },
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
            color="primary" 
            aria-label="ansehen"
            onClick={e => { e.stopPropagation(); handleViewFallDetail(params.row._id); }}
            sx={{ color: colors.accent.blue }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            aria-label="bearbeiten"
            sx={{ color: colors.primary.dark }}
            onClick={e => { e.stopPropagation(); handleViewFallDetail(params.row._id); }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <DeleteCaseButton caseId={params.row._id} onDeleted={loadCases} />
        </Stack>
      )
    },
  ];

  // Dummy-Daten entfernen, rows aus cases generieren
  const rows = cases.map(fall => {
    const hasValidNummern =
      typeof fall.gutachterNummer === 'number' &&
      typeof fall.fallNummer === 'number' &&
      !isNaN(fall.gutachterNummer) &&
      !isNaN(fall.fallNummer);
    return {
      id: hasValidNummern
        ? `${fall.gutachterNummer} - ${fall.fallNummer.toString().padStart(2, '0')}`
        : '-',
      name: fall.fallname,
      kunde: fall.mandant ? `${fall.mandant.vorname} ${fall.mandant.nachname}` : '',
      status: fall.status,
      datum: fall.datum ? new Date(fall.datum).toLocaleDateString('de-DE') : '',
      _id: fall._id // für Detailansicht
    };
  });

  // Filterlogik (hier nur als Beispiel, in echt würdest du die rows filtern)
  const filteredRows = rows.filter(row => {
    const matchId = filterId === '' || String(row.id).includes(filterId);
    const matchName = filterName === '' || row.name.toLowerCase().includes(filterName.toLowerCase());
    const matchKunde = filterKunde === '' || row.kunde.toLowerCase().includes(filterKunde.toLowerCase());
    const matchStatus = filterStatus === '' || row.status === filterStatus;

    // Zeitraum-Filter (korrektes Parsen und Vergleichen)
    let matchVon = true;
    let matchBis = true;
    if (filterVon) {
      // row.datum im Format 'dd.mm.yyyy'
      const [d, m, y] = row.datum.split('.');
      if (d && m && y) {
        const rowDate = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
        const vonDate = new Date(filterVon);
        matchVon = rowDate >= vonDate;
      }
    }
    if (filterBis) {
      const [d, m, y] = row.datum.split('.');
      if (d && m && y) {
        const rowDate = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
        const bisDate = new Date(filterBis);
        matchBis = rowDate <= bisDate;
      }
    }
    // Wenn kein Datum gesetzt ist, ignoriere Zeitraum-Filter
    if (!row.datum) {
      matchVon = true;
      matchBis = true;
    }
    return matchId && matchName && matchKunde && matchStatus && matchVon && matchBis;
  });

  return (
    <Box sx={{ 
      width: '100%', 
      height: 'calc(100vh - 64px)', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
      flexGrow: 1,
      backgroundColor: '#f9fafb', // Hellgrauer Hintergrund
      transition: 'margin 195ms cubic-bezier(0.4, 0, 0.6, 1) 0ms',
    }}>
      {/* Ladeanzeige und Fehleranzeige */}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
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
              Fälle
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5, opacity: 0.9 }}>
              Verwalten Sie Ihre Gutachtenfälle
            </Typography>
          </Grid>
          <Grid item>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
              sx={{ 
                bgcolor: colors.primary.main,
                color: colors.text.onPrimary,
                fontWeight: 600,
                '&:hover': {
                  bgcolor: colors.primary.dark,
                }
              }}
            >
              Fall anlegen
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
        <Grid container spacing={2} sx={{ width: '100%' }}>
          <Grid item xs={6} sm={4} md={2}>
            <TextField 
              label="ID" 
              variant="outlined" 
              size="small" 
              fullWidth
              value={filterId}
              onChange={e => setFilterId(e.target.value)}
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
          <Grid item xs={6} sm={4} md={2}>
            <TextField 
              label="Fallname" 
              variant="outlined" 
              size="small" 
              fullWidth
              value={filterName}
              onChange={e => setFilterName(e.target.value)}
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
          <Grid item xs={6} sm={4} md={2}>
            <TextField 
              label="Kunde" 
              variant="outlined" 
              size="small" 
              fullWidth
              value={filterKunde}
              onChange={e => setFilterKunde(e.target.value)}
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
          <Grid item xs={6} sm={4} md={2}>
            <TextField 
              label="Status" 
              variant="outlined" 
              size="small" 
              fullWidth
              select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
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
              <MenuItem value="">Alle</MenuItem>
              <MenuItem value="In Bearbeitung">In Bearbeitung</MenuItem>
              <MenuItem value="Übermittelt">Übermittelt</MenuItem>
            </TextField>
          </Grid>
          {/* Zeitraum-Filter */}
          <Grid item xs={6} sm={4} md={2}>
            <TextField
              label="Zeitraum von"
              type="date"
              variant="outlined"
              size="small"
              fullWidth
              value={filterVon}
              onChange={e => setFilterVon(e.target.value)}
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
              onChange={e => setFilterBis(e.target.value)}
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
          minHeight: 0 
        }}
      >
        <DataGrid
          rows={filteredRows}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          disableSelectionOnClick
          density="standard"
          disableColumnMenu
          getRowId={row => row._id}
          onRowClick={(params) => handleViewFallDetail(params.row._id)}
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
            }
          }}
        />
      </Paper>

      {/* Dialog zum Erstellen eines Falls */}
      <CreateCaseForm open={openCreateDialog} handleClose={handleCloseCreateDialog} onCaseCreated={handleCaseCreated} />
    </Box>
  );
}
