import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface ThemeState {
  darkMode: boolean;
  primaryColor: string;
}

const getInitialDarkMode = (): boolean => {
  const saved = localStorage.getItem('darkMode');
  return saved ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const getInitialPrimaryColor = (): string => {
  return localStorage.getItem('primaryColor') || '#4f46e5'; // default indigo-600
};

const initialState: ThemeState = {
  darkMode: getInitialDarkMode(),
  primaryColor: getInitialPrimaryColor(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', JSON.stringify(state.darkMode));
    },
    setPrimaryColor: (state, action: PayloadAction<string>) => {
      state.primaryColor = action.payload;
      localStorage.setItem('primaryColor', action.payload);
    },
  },
});

export const { toggleDarkMode, setPrimaryColor } = themeSlice.actions;
export default themeSlice.reducer;
