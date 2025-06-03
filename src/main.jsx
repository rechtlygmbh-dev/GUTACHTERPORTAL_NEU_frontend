import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { CaseProvider } from './context/CaseContext'

// Create a basic Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#a3e635',
    },
    secondary: {
      main: '#1b3a4b',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <CaseProvider>
            <App />
          </CaseProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  </StrictMode>,
)