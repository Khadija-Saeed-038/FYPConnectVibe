import {THEME_SET,TOGGLE_THEME} from './types';

export const setTheme = theme => ({
  type: THEME_SET,
  payload: theme,
});

export const toggleTheme = () => ({
  type: TOGGLE_THEME,
});
