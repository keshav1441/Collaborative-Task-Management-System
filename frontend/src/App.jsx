import React from 'react';
import { ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material';
import { theme } from './theme';
import AppRoutes from './routes';

const globalStyles = {
  '*': {
    boxSizing: 'border-box',
    margin: 0,
    padding: 0,
  },
  html: {
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    height: '100%',
    width: '100%',
  },
  body: {
    backgroundColor: '#ffffff', // Updated to light theme
    height: '100%',
    width: '100%',
  },
  '#root': {
    height: '100%',
    width: '100%',
  },
  '::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '::-webkit-scrollbar-track': {
    background: 'rgba(0, 0, 0, 0.05)', // Adjusted for light theme
  },
  '::-webkit-scrollbar-thumb': {
    background: 'rgba(0, 0, 0, 0.1)', // Adjusted for light theme
    borderRadius: '4px',
    '&:hover': {
      background: 'rgba(0, 0, 0, 0.2)', // Adjusted for light theme
    },
  },
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={globalStyles} />
      <AppRoutes />
    </ThemeProvider>
  );
}

export default App;
