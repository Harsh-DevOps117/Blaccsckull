import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000').replace(
  /\/$/,
  '',
);
let token: string | null = null;
export const getToken = () => token;
export async function restoreToken() {
  token =
    Platform.OS === 'web'
      ? localStorage.getItem('feedants.token')
      : await SecureStore.getItemAsync('feedants.token');
  return token;
}
export async function saveToken(value: string | null) {
  token = value;
  if (Platform.OS === 'web') {
    if (value) localStorage.setItem('feedants.token', value);
    else localStorage.removeItem('feedants.token');
  } else if (value) await SecureStore.setItemAsync('feedants.token', value);
  else await SecureStore.deleteItemAsync('feedants.token');
}
export class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.body instanceof FormData ? 120000 : 20000,
  );
  try {
    const response = await fetch(`${API_URL}/api${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    const body = await response.json();
    if (!response.ok)
      throw new RequestError(
        body.error?.message ?? 'Unable to complete the request',
        response.status,
        body.error?.code,
      );
    return body;
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError('Unable to reach Feedants. Check your connection and try again.', 0);
  } finally {
    clearTimeout(timeout);
  }
}
