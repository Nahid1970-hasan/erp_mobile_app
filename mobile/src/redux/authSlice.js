import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthApi, errorDetail } from '../services/api';

async function persistSession(data) {
  await AsyncStorage.multiSet([
    ['access_token', data.access],
    ['refresh_token', data.refresh],
    ['user', JSON.stringify(data.user)],
  ]);
}

export const loadSession = createAsyncThunk('auth/loadSession', async () => {
  const [access, refresh, rawUser] = await Promise.all([
    AsyncStorage.getItem('access_token'),
    AsyncStorage.getItem('refresh_token'),
    AsyncStorage.getItem('user'),
  ]);
  let user = null;
  if (access && rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch (_error) {
      user = null;
    }
  }
  return { access, refresh, user };
});

export const login = createAsyncThunk('auth/login', async (body, { rejectWithValue }) => {
  try {
    const response = await AuthApi.login(body);
    await persistSession(response.data);
    return response.data;
  } catch (error) {
    return rejectWithValue(errorDetail(error, 'Unable to sign in. Check the employee ID and password.'));
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, access: null, ready: false, loading: false, error: null },
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSession.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.access = action.payload.access;
        state.ready = true;
      })
      .addCase(loadSession.rejected, (state) => {
        state.ready = true;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.access = action.payload.access;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.access = null;
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
