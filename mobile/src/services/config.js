import { Platform } from 'react-native';

export const DEFAULT_API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8002' : 'http://127.0.0.1:8002';
