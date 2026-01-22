import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Use localhost for iOS simulator, or specific IP for Android emulator/Physical device
// Port 3005 as per backend configuration
const DEV_API_URL = Platform.select({
  ios: 'http://localhost:3008',
  android: 'http://10.0.2.2:3008',
  default: 'http://localhost:3008',
});

const apiClient = axios.create({
  baseURL: DEV_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor to inject token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('user_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor to handle errors (e.g. 401 logout)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Logic to logout user or refresh token could go here
      await SecureStore.deleteItemAsync('user_token');
    }
    return Promise.reject(error);
  },
);

export default apiClient;
