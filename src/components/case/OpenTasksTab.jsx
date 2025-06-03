import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { colors } from '../../theme/colors';

export default function OpenTasksTab({ tasksWithStatus = [] }) {
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: colors.secondary.main, mb: 2 }}>
        Offene Aufgaben
      </Typography>
      <Stack spacing={2}>
        {tasksWithStatus.map((taskObj, idx) => (
          <Paper
            key={taskObj.label}
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 2,
              boxShadow: colors.shadows.sm,
              background: '#fff',
              opacity: taskObj.done ? 0.7 : 1,
            }}
          >
            {taskObj.done ? (
              <CheckCircleIcon sx={{ color: '#4caf50', mr: 2 }} />
            ) : (
              <CloseIcon sx={{ color: '#d32f2f', mr: 2 }} />
            )}
            <Typography variant="body1" sx={{ color: taskObj.done ? '#4caf50' : colors.secondary.main, fontWeight: taskObj.done ? 600 : 400 }}>
              {taskObj.label}
            </Typography>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
} 