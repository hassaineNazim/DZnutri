import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Stockage des tokens d'authentification.
// - Access token (JWT court) : AsyncStorage, sous la clé 'userToken'.
// - Refresh token (longue durée, sensible) : stockage SÉCURISÉ matériel
//   (Keychain iOS / Keystore Android) via expo-secure-store. Sur le web, repli
//   sur AsyncStorage (SecureStore n'y existe pas).

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
  return AsyncStorage.getItem(ACCESS_KEY);
}

export async function saveTokens({ access_token, refresh_token }: TokenPair): Promise<void> {
  if (access_token) await AsyncStorage.setItem(ACCESS_KEY, access_token);
  if (refresh_token) await setRefreshToken(refresh_token);
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.removeItem(ACCESS_KEY);
  await deleteRefreshToken();
}
