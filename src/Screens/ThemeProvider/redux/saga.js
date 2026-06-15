import {useTheme} from '../ThemeProvider';

const defaultColors = {
  primary: '#E8F1FB',
  headerColor: '#1A4B8C',
  headerText: '#FFFFFF',
  text: '#0B1F3F',
  textSecondary: '#4A6B9A',
  textOnButton: '#FFFFFF',
  placeholder: '#7A94B8',
  activeTab: 'rgba(255,255,255,0.18)',
  activeTabIcon: '#FFFFFF',
  tabInactive: '#B8CCE8',
  inputBackground: '#FFFFFF',
  buttonColor: '#2563EB',
  buttonColorPressed: '#1D4ED8',
  cardBackground: '#FFFFFF',
  border: '#B8CCE8',
  chipInactive: '#FFFFFF',
  error: '#EF4444',
  success: '#10B981',
  bubbleSent: '#C7DCFF',
  bubbleReceived: '#FFFFFF',

  black: '#000000',
  white: '#FFFFFF',
  100: '#E8F1FB',
  200: '#C7DCFF',
  300: '#B8CCE8',
  400: '#7A94B8',
  500: '#4A6B9A',
  600: '#1A4B8C',
  700: '#0B1F3F',
  800: '#082A52',
  900: '#051A33',
};

const darkColors = {
  primary: '#0B1F3F',
  headerColor: '#1A4B8C',
  headerText: '#FFFFFF',
  text: '#F0F6FC',
  textSecondary: '#B8CCE8',
  textOnButton: '#FFFFFF',
  placeholder: '#7A94B8',
  activeTab: 'rgba(255,255,255,0.18)',
  activeTabIcon: '#FFFFFF',
  tabInactive: '#7A94B8',
  inputBackground: '#132D52',
  buttonColor: '#3B82F6',
  buttonColorPressed: '#2563EB',
  cardBackground: '#132D52',
  border: '#2A5080',
  chipInactive: '#132D52',
  error: '#F87171',
  success: '#34D399',
  bubbleSent: '#1E3A5F',
  bubbleReceived: '#132D52',

  black: defaultColors.white,
  white: defaultColors.black,
  100: defaultColors[900],
  200: defaultColors[800],
  300: defaultColors[700],
  400: defaultColors[600],
  500: defaultColors[500],
  600: defaultColors[400],
  700: defaultColors[300],
  800: defaultColors[200],
  900: defaultColors[100],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
};

export const shadow = {
  card: {
    shadowColor: '#0B1F3F',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
};

const themes = {
  default: {...defaultColors},
  dark: {...darkColors},
};

export const getThemeColor = (color, theme = 'default') => {
  const themeColor = themes[theme][color];
  const fallbackColor = themes.default[color];
  return themeColor || fallbackColor;
};

export const useThemeColor = color => {
  const {theme} = useTheme();
  return getThemeColor(color, theme);
};

export default themes;
