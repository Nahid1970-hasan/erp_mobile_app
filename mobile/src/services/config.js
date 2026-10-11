import { Platform } from 'react-native';

const API_PORT = '8002';

function defaultApiUrl() {
  if (Platform.OS === 'android') return `http://10.0.2.2:${API_PORT}`;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:${API_PORT}`;
  }
  return `http://127.0.0.1:${API_PORT}`;
}

export const DEFAULT_API_URL = defaultApiUrl();
