import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function resolveApiUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured && configured !== 'auto') return configured.replace(/\/$/, '');
  if (Platform.OS === 'web' && typeof window !== 'undefined')
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = new URL(hostUri.includes('://') ? hostUri : `http://${hostUri}`).hostname;
    return `http://${host}:4000`;
  }
  return 'http://localhost:4000';
}
