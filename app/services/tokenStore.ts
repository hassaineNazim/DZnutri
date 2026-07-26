import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Stockage des tokens d'authentification.
// - Access + refresh tokens : stockage SÉCURISÉ matériel (Keychain iOS /
//   Keystore Android) via expo-secure-store.
// - Web : repli sur AsyncStorage, SecureStore n'y étant pas disponible.

const ACCESS_KEY = 'userToken';
const REFRESH_KEY = 'refreshToken';
const isWeb = Platform.OS === 'web';

type TokenPair = { access_token?: string; refresh_token?: string };

async function setRefreshToken(token: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.setItem(REFRESH_KEY, token);
  } else {
    await SecureStore.setItemAsync(REFRESH_KEY, token);
  }
}

export async function getRefreshToken(): Promise<string | null> {
  if (isWeb) return AsyncStorage.getItem(REFRESH_KEY);
  return SecureStore.getItemAsync(REFRESH_KEY);
}

async function deleteRefreshToken(): Promise<void> {
  if (isWeb) {
    await AsyncStorage.removeItem(REFRESH_KEY);
  } else {
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  }
}

export async function getAccessToken(): Promise<string | null> {
  if (isWeb) return AsyncStorage.getItem(ACCESS_KEY);

  const secureToken = await SecureStore.getItemAsync(ACCESS_KEY);
  if (secureToken) return secureToken;

  // Migration transparente des installations plus anciennes qui stockaient
  // encore l'access token dans AsyncStorage.
  const legacyToken = await AsyncStorage.getItem(ACCESS_KEY);
  if (legacyToken) {
    await SecureStore.setItemAsync(ACCESS_KEY, legacyToken);
    await AsyncStorage.removeItem(ACCESS_KEY);
  }
  return legacyToken;
}

export async function saveTokens({ access_token, refresh_token }: TokenPair): Promise<void> {
  if (access_token) {
    if (isWeb) await AsyncStorage.setItem(ACCESS_KEY, access_token);
    else await SecureStore.setItemAsync(ACCESS_KEY, access_token);
  }
  if (refresh_token) await setRefreshToken(refresh_token);
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.removeItem(ACCESS_KEY);
  if (!isWeb) await SecureStore.deleteItemAsync(ACCESS_KEY);
  await deleteRefreshToken();
}
