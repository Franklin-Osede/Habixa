import axios from 'axios';
import { Platform } from 'react-native';
import { deleteStoredItem, getStoredItem } from './storage';

// Use localhost for iOS simulator, or specific IP for Android emulator/Physical device.
// Port 3008 matches backend; `/v1` prefix is enforced globally by NestJS URI versioning.
const DEV_API_URL = Platform.select({
  ios: 'http://localhost:3008/v1',
  android: 'http://10.0.2.2:3008/v1',
  default: 'http://localhost:3008/v1',
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
    const token = await getStoredItem('user_token');
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
      await deleteStoredItem('user_token');
    }
    return Promise.reject(error);
  },
);

export default apiClient;
