import React, { useEffect } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Provider, useDispatch } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/redux/store';
import { logout } from './src/redux/authSlice';
import { setUnauthorizedHandler } from './src/services/api';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/utils/theme';

function SessionGuard() {
  const dispatch = useDispatch();
  useEffect(() => {
    setUnauthorizedHandler(() => {
      dispatch(logout());
    });
  }, [dispatch]);
  return null;
}

function AppShell() {
  const { width, height } = useWindowDimensions();
  const showPhone = Platform.OS === 'web' && width > 520;

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const style = document.createElement('style');
    style.textContent = 'html,body,#root{height:100%;margin:0;background:#0B1726;}';
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const app = (
    <SafeAreaProvider style={styles.fill}>
      <StatusBar style="dark" />
      <SessionGuard />
      <AppNavigator />
    </SafeAreaProvider>
  );

  if (!showPhone) return app;

  return (
    <View style={styles.stage}>
      <View style={[styles.phone, { height: Math.min(height - 40, 860) }]}>{app}</View>
    </View>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppShell />
    </Provider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.paper },
  stage: {
    flex: 1,
    minHeight: '100vh',
    backgroundColor: '#0B1726',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phone: {
    width: 400,
    maxWidth: '100%',
    overflow: 'hidden',
    backgroundColor: colors.paper,
    borderRadius: 32,
    borderWidth: 8,
    borderColor: '#1C3658',
  },
});
