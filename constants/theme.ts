// constants/theme.ts
export const colors = {
  primary: {
    50: '#feb556',
    100: '#fea63d',
    200: '#f58f0a',
    300: '#e07f08',
    400: '#c26e06',
    500: '#a45d05',
  },
  secondary: {
    50: '#4a5a8c',
    100: '#354469',
    200: '#2a3552',
    300: '#1e3365',
    400: '#172844',
    500: '#111d33',
  },
  neutral: {
    50: '#ffffff',
    100: '#f8fafc',
    200: '#f0f2f5',
    300: '#e2e8f0',
    400: '#cbd5e1',
    500: '#94a3b8',
    600: '#64748b',
    700: '#475569',
    800: '#334155',
    900: '#1e293b',
  },
  accent: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  tag: {
    Lead: { bg: '#fff4e5', text: '#f58f0a' },
    Client: { bg: '#e8f0fe', text: '#1e3365' },
    Partner: { bg: '#e6f7f0', text: '#10b981' },
    Vendor: { bg: '#f0e6fa', text: '#8b5cf6' },
    Enterprise: { bg: '#fee9e6', text: '#ef4444' },
    Startup: { bg: '#e1f5fe', text: '#0ea5e9' },
    Other: { bg: '#f0f2f5', text: '#64748b' },
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 18,
  xxxl: 20,
  full: 9999,
} as const;

export const typography = {
  size: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 22,
    display: 24,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;