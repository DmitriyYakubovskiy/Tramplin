import { alpha, createTheme } from '@mui/material/styles';

const ink = '#132238';
const teal = '#0f766e';
const orange = '#ea580c';
const sand = '#f4efe6';
const paper = 'rgba(255, 252, 247, 0.92)';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: teal,
      light: '#2dd4bf',
      dark: '#115e59',
      contrastText: '#ffffff',
    },
    secondary: {
      main: orange,
      light: '#fb923c',
      dark: '#c2410c',
      contrastText: '#ffffff',
    },
    background: {
      default: sand,
      paper: '#fffaf5',
    },
    text: {
      primary: ink,
      secondary: '#5f6f82',
    },
    divider: alpha(ink, 0.12),
    success: {
      main: '#2f855a',
    },
    warning: {
      main: '#d97706',
    },
    info: {
      main: '#0284c7',
    },
  },
  shape: {
    borderRadius: 4,
  },
  typography: {
    fontFamily: '"Manrope", "Segoe UI", sans-serif',
    h1: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
      fontSize: 'clamp(2.9rem, 5vw, 5rem)',
      lineHeight: 0.96,
      letterSpacing: '-0.06em',
    },
    h2: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
      fontSize: 'clamp(2.2rem, 3.4vw, 3.5rem)',
      lineHeight: 1,
      letterSpacing: '-0.05em',
    },
    h3: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.04em',
    },
    h4: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    subtitle1: {
      fontSize: '1.05rem',
      lineHeight: 1.7,
    },
    body1: {
      lineHeight: 1.75,
    },
    body2: {
      lineHeight: 1.65,
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
      letterSpacing: '-0.01em',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body, #root': {
          minHeight: '100%',
        },
        body: {
          background: `
            radial-gradient(circle at top left, rgba(45, 212, 191, 0.10), transparent 22%),
            radial-gradient(circle at 88% 12%, rgba(251, 146, 60, 0.10), transparent 18%),
            linear-gradient(180deg, #faf7f2 0%, #f4efe6 52%, #ece5d8 100%)
          `,
          color: ink,
        },
        '::selection': {
          backgroundColor: alpha(teal, 0.18),
        },
        a: {
          color: 'inherit',
          textDecoration: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: paper,
          border: `1px solid ${alpha(ink, 0.08)}`,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 16px 44px rgba(19, 34, 56, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: paper,
          border: `1px solid ${alpha(ink, 0.08)}`,
          boxShadow: '0 16px 44px rgba(19, 34, 56, 0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          paddingInline: 20,
          minHeight: 46,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 100%)',
          boxShadow: '0 14px 30px rgba(15, 118, 110, 0.22)',
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
          boxShadow: '0 14px 30px rgba(249, 115, 22, 0.22)',
        },
        outlined: {
          borderColor: alpha(ink, 0.12),
          backgroundColor: alpha('#ffffff', 0.56),
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: 24,
          paddingRight: 24,
          '@media (max-width:599px)': {
            paddingLeft: 16,
            paddingRight: 16,
          },
        },
        maxWidthXl: {
          maxWidth: '1180px !important',
        },
        maxWidthLg: {
          maxWidth: '1020px !important',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 700,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: alpha('#ffffff', 0.74),
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(ink, 0.18),
          },
          '&.Mui-focused': {
            boxShadow: `0 0 0 6px ${alpha(teal, 0.12)}`,
            backgroundColor: '#ffffff',
          },
        },
        notchedOutline: {
          borderColor: alpha(ink, 0.12),
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 4,
          borderRadius: 8,
        },
      },
    },
  },
});
