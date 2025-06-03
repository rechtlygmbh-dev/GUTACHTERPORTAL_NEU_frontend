export const colors = {
  // Primary Colors (Limettengrün – Aufmerksamkeit, Highlights)
  primary: {
    main: '#a3e635',      // Haupt-Limettengrün
    light: '#c7e70c',     // Hellerer Akzent
    dark: '#89cb28',      // Abgeleiteter dunklerer Ton
  },

  // Secondary Colors (Dunkelblau – Tiefe, Seriosität)
  secondary: {
    main: '#1b3a4b',      // Haupt-Dunkelblau
    light: '#2c5364',     // Lighter secondary tone
    dark: '#142c3a',      // Noch dunkler für Kontrastflächen
  },

  // Additional Utility Colors
  accent: {
    blue: '#2c5282',      // Blauer Akzent (z. B. für Icons, Buttons)
    textLight: 'var(--text-light)',  // CSS Variable für hellen Text (z. B. Weiß mit Transparenz)
    white: '#ffffff',     // Reinweiß für Texte und Hintergründe
  },

  // Background Colors
  background: {
    gradientGreen: 'linear-gradient(135deg, #a3e635, #c7e70c)',
    gradientBlue: 'linear-gradient(135deg, #1b3a4b, #2c5364)',
    paper: '#fff',
    dark: '#1b3a4b',
  },

  // Text Colors
  text: {
    light: 'var(--text-light)',   // Für dunkle Hintergründe
    onPrimary: '#1b3a4b',         // Dunkler Text auf hellgrün
    onDark: '#ffffff',            // Weiß auf dunklem Hintergrund
  },

  // Shadow Colors
  shadows: {
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },

  // Hover States
  hover: {
    green: 'rgba(163, 230, 53, 0.08)',
    blue: 'rgba(43, 83, 100, 0.08)',
    dark: 'rgba(27, 58, 75, 0.08)',
  }
};
