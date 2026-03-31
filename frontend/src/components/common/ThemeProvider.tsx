import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createTheme, ThemeProvider as MUIThemeProvider, CssBaseline } from '@mui/material';
import type { RootState } from '../../store/store';

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { darkMode, primaryColor } = useSelector((state: RootState) => state.theme);

  // Create MUI theme dynamically
  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: primaryColor,
      },
      background: {
        default: darkMode ? '#0f172a' : '#f8fafc', // slate-900 / slate-50
        paper: darkMode ? '#1e293b' : '#ffffff',   // slate-800 / white
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none', // Remove gradients in dark mode
          },
        },
      },
    },
  }), [darkMode, primaryColor]);

  useEffect(() => {
    // Apply Dark Mode Class for Tailwind
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply Primary Color CSS Variables for Tailwind
    const root = document.documentElement;
    root.style.setProperty('--color-primary-600', primaryColor);
    
    const hexToRgb = (hex: string) => {
      const bigint = parseInt(hex.slice(1), 16);
      return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    };
    
    const [r, g, b] = hexToRgb(primaryColor);
    root.style.setProperty('--color-primary-50', `rgba(${r}, ${g}, ${b}, 0.1)`);
    root.style.setProperty('--color-primary-100', `rgba(${r}, ${g}, ${b}, 0.2)`);
    root.style.setProperty('--color-primary-700', `rgba(${Math.max(0, r-20)}, ${Math.max(0, g-20)}, ${Math.max(0, b-20)}, 1)`);

  }, [darkMode, primaryColor]);

  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
};

export default ThemeProvider;
