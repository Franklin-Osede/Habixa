import { Platform } from 'react-native';

export async function getStoredItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  const SecureStore = require('expo-secure-store');
  return SecureStore.getItemAsync(key);
}

export async function setStoredItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {}
    return;
  }
  const SecureStore = require('expo-secure-store');
  await SecureStore.setItemAsync(key, value);
}

export async function deleteStoredItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {}
    return;
  }
  const SecureStore = require('expo-secure-store');
  await SecureStore.deleteItemAsync(key);
}
