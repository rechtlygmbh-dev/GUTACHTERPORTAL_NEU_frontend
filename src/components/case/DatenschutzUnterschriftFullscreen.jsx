import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Button from '@mui/material/Button';
import DocusealDatenschutzForm from './DocusealDatenschutzForm';

export default function DatenschutzUnterschriftFullscreen({ src, email, onComplete }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => setOpen(true)}
        sx={{ fontWeight: 600 }}
      >
        Vollmacht unterzeichnen
      </Button>
      <Dialog 
        fullScreen 
        open={open} 
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { p: 0, background: '#fff' } }}
      >
        <IconButton
          edge="start"
          color="inherit"
          onClick={() => setOpen(false)}
          aria-label="close"
          sx={{ position: 'absolute', right: 16, top: 16, zIndex: 10 }}
        >
          <CloseIcon />
        </IconButton>
        <div style={{ width: '100vw', height: '100vh', overflow: 'auto' }}>
          <DocusealDatenschutzForm
            src={src}
            email={email}
            onComplete={(data) => {
              setOpen(false);
              if (onComplete) onComplete(data);
            }}
          />
        </div>
      </Dialog>
    </>
  );
} 