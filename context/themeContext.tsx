// context/ThemeContext.tsx
import React, { createContext, useContext, useState } from 'react';

export const themes = {
  light: {
    isDark: false,
    colors: {
      primary: '#1e3365',
      secondary: '#354469',
      success: '#0b8e5e',
      warning: '#f58f0a',
      error: '#d1453a',
      info: '#0396c5',
      purple: '#7b4da3',
      neutral: '#5f6b7a',
      background: '#ffffff',
      backgroundSecondary: '#f8fafc',
      card: '#ffffff',
      text: '#1e3365',
      textSecondary: '#64748b',
      textTertiary: '#94a3b8',
      border: '#f0f2f5',
      white: '#ffffff',
    },
    spacing: {
      xxs: 2,
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      xxl: 24,
    },
    borderRadius: {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
      full: 9999,
    },
    typography: {
      sizes: {
        xxs: 10,
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
      },
      weights: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        black: '900',
      },
    },
  },
  dark: {
    isDark: true,
    colors: {
      primary: '#4a6fa5',
      secondary: '#5a6a8a',
      success: '#2ecc71',
      warning: '#f39c12',
      error: '#e74c3c',
      info: '#3498db',
      purple: '#9b59b6',
      neutral: '#95a5a6',
      background: '#121212',
      backgroundSecondary: '#1e1e1e',
      card: '#2d2d2d',
      text: '#ffffff',
      textSecondary: '#b0b0b0',
      textTertiary: '#808080',
      border: '#404040',
      white: '#ffffff',
    },
    // same spacing and typography as light theme
    spacing: { /* same as light */ },
    borderRadius: { /* same as light */ },
    typography: { /* same as light */ },
  },
};

const ThemeContext = createContext({
  theme: themes.light,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);
  
  const toggleTheme = () => setIsDark(!isDark);
  const theme = isDark ? themes.dark : themes.light;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);