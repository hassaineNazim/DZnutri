jest.mock('expo/virtual/env', () => ({ env: process.env }));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: {} } }));
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = {};
  return { getItem: jest.fn(async (k) => store[k] ?? null), setItem: jest.fn(async (k, v) => { store[k] = v; }) };
});
jest.mock('../app/services/authSession', () => ({ invalidateSession: jest.fn() }));
jest.mock('../app/services/tokenStore', () => ({ getAccessToken: jest.fn(), getRefreshToken: jest.fn(), saveTokens: jest.fn() }));

test('la configuration distante remplace l adresse partout', async () => {
  global.__DEV__ = false;
  process.env.EXPO_PUBLIC_API_URL = 'https://ancien.example.com';
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ apiUrl: 'https://nouveau.example.com/' }) }));

  const cfg = require('../app/config/api');
  const { api } = require('../app/services/axios');
  const reader = require('../app/services/openFoodFacts'); // consommateur reel du module

  await cfg.initApiUrl();
  expect(cfg.API_URL).toBe('https://nouveau.example.com');
  expect(api.defaults.baseURL).toBe('https://nouveau.example.com');
  expect(require('@react-native-async-storage/async-storage').setItem)
    .toHaveBeenCalledWith('remote_api_url', 'https://nouveau.example.com');

  // Un ecran qui importe API_URL doit voir la nouvelle valeur.
  global.fetch = jest.fn(async () => ({ json: async () => ({}) }));
  await reader.fetchProduct('123');
  expect(global.fetch).toHaveBeenCalledWith('https://nouveau.example.com/api/product/123');
});

test('une URL non HTTPS est refusee', async () => {
  jest.resetModules();
  global.__DEV__ = false;
  process.env.EXPO_PUBLIC_API_URL = 'https://ancien.example.com';
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ apiUrl: 'http://pirate.example.com' }) }));
  const cfg = require('../app/config/api');
  await cfg.initApiUrl();
  expect(cfg.API_URL).toBe('https://ancien.example.com');
});
