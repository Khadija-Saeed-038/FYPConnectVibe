import {THEME_SET, TOGGLE_THEME} from './types';

const initialState = {
  theme: 'default',
  isDark: false,
};

export default (state = initialState, action) => {
  switch (action.type) {
    case THEME_SET:
      return {
        ...state,
        theme: action.payload,
        isDark: action.payload === 'dark',
      };
    case TOGGLE_THEME:
      return {...state, isDark: !state.isDark};
    default:
      return state;
  }
};
