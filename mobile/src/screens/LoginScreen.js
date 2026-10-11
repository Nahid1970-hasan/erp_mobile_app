import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { colors } from '../utils/theme';
import { DEFAULT_API_URL } from '../services/config';
import { clearAuthError, login } from '../redux/authSlice';

const DEMOS = [
  ['rahim', 'R', 'Manager'],
  ['sadia', 'S', 'Merchandiser'],
  ['karim', 'K', 'Supervisor'],
  ['farhana', 'F', 'Store'],
  ['nusrat', 'N', 'Operator'],
];

export default function LoginScreen() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [username, setUsername] = useState('rahim');
  const [password, setPassword] = useState('Dekko@123');
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [showServer, setShowServer] = useState(false);
  const [hint, setHint] = useState('');

  useEffect(() => {
    dispatch(clearAuthError());
    AsyncStorage.getItem('api_url').then((value) => {
      if (value) setApiUrl(value);
    });
  }, [dispatch]);

  async function onSubmit() {
    await AsyncStorage.setItem('api_url', apiUrl.trim().replace(/\/$/, ''));
    dispatch(login({ username: username.trim(), password }));
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>ISHO</Text>
            </View>
          </View>

          <TextInput
            testID="username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Username"
            placeholderTextColor="#B0B4C0"
            style={styles.input}
          />

          <View style={styles.passHead}>
            <Text style={styles.passLabel}>Password</Text>
            <Pressable onPress={() => setHint('Demo password is Dekko@123')}>
              <Text style={styles.forget}>Forget Password?</Text>
            </Pressable>
          </View>
          <TextInput
            testID="password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Password"
            placeholderTextColor="#B0B4C0"
            style={styles.input}
          />
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable testID="login" style={[styles.button, loading && styles.buttonOff]} onPress={onSubmit} disabled={loading || !username.trim() || !password}>
            <Text style={styles.buttonText}>{loading ? 'SIGNING IN' : 'LOGIN'}</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Demo login</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.demos}>
            {DEMOS.map(([id, initial]) => {
              const active = username === id;
              return (
                <Pressable
                  key={id}
                  style={[styles.demo, active && styles.demoOn]}
                  onPress={() => { setUsername(id); setPassword('Dekko@123'); }}
                >
                  <Text style={[styles.demoText, active && styles.demoTextOn]}>{initial}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.signup}>
            New user? <Text style={styles.signupLink}>Use a demo account</Text>
          </Text>

          <Pressable onPress={() => setShowServer((value) => !value)} style={styles.serverToggle}>
            <Ionicons name="server-outline" size={14} color="#9AA0AE" />
            <Text style={styles.serverLink}>{showServer ? 'Hide API server' : 'API server'}</Text>
          </Pressable>
          {showServer ? (
            <TextInput
              value={apiUrl}
              onChangeText={setApiUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://192.168.0.10:8002"
              placeholderTextColor="#B0B4C0"
              style={styles.input}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  body: { paddingHorizontal: 28, paddingTop: 54, paddingBottom: 28 },
  logoWrap: { alignItems: 'center', marginBottom: 54 },
  logo: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.purple,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  logoText: { color: colors.white, fontSize: 22, fontWeight: '800', letterSpacing: 1.4 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7EE',
    paddingVertical: 10,
    fontSize: 16,
    color: '#2C3142',
    marginBottom: 8,
  },
  passHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 },
  passLabel: { color: '#8E94A3', fontSize: 14 },
  forget: { color: colors.purple, fontSize: 13, fontWeight: '600' },
  hint: { color: colors.purple, fontSize: 13, marginTop: 6 },
  error: { color: '#E34B4B', fontSize: 13, marginTop: 8 },
  button: {
    backgroundColor: colors.purple,
    borderRadius: 6,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
  },
  buttonOff: { opacity: 0.7 },
  buttonText: { color: colors.white, fontWeight: '800', letterSpacing: 1.2, fontSize: 15 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 28, marginBottom: 18 },
  divider: { flex: 1, height: 1, backgroundColor: '#E6E8EF' },
  dividerText: { color: '#A0A6B4', fontSize: 13 },
  demos: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  demo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#E1E4EC',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  demoOn: { backgroundColor: colors.purple, borderColor: colors.purple },
  demoText: { color: '#5C6373', fontWeight: '800' },
  demoTextOn: { color: colors.white },
  signup: { textAlign: 'center', color: '#8E94A3', marginTop: 28, fontSize: 14 },
  signupLink: { color: colors.purple, fontWeight: '700' },
  serverToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 22 },
  serverLink: { color: '#9AA0AE', fontSize: 12 },
});
