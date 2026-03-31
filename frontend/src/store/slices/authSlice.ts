import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  accessToken: string | null;
  userId: number | null;
  email: string | null;
  fullName: string | null;
  role: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  accessToken: localStorage.getItem('accessToken') || null,
  userId: localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null,
  email: localStorage.getItem('email') || null,
  fullName: localStorage.getItem('fullName') || null,
  role: localStorage.getItem('role') || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ accessToken: string; userId: number; email: string; fullName: string; role: string; refreshToken: string }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.userId = action.payload.userId;
      state.email = action.payload.email;
      state.fullName = action.payload.fullName;
      state.role = action.payload.role;
      state.isAuthenticated = true;
      
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      localStorage.setItem('userId', action.payload.userId.toString());
      localStorage.setItem('email', action.payload.email);
      localStorage.setItem('fullName', action.payload.fullName);
      localStorage.setItem('role', action.payload.role);
    },
    logout: (state) => {
      state.accessToken = null;
      state.userId = null;
      state.email = null;
      state.fullName = null;
      state.role = null;
      state.isAuthenticated = false;
      localStorage.clear();
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
