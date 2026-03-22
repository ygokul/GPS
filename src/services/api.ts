import axios from 'axios';
import type { ApiResponse, Device, Position, Stats } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://test.brilliantiasacademy.com/api.php';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add API Key if we have one globally or via params
// Requirements said "Authentication: Bearer token with device API key"
// But often PHP scripts take it as query param too. We'll stick to Bearer header.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gps_api_key');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const setApiKey = (key: string) => {
  localStorage.setItem('gps_api_key', key);
};

export const getApiKey = () => localStorage.getItem('gps_api_key');

// Add User interface
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

export const gpsService = {
  getDevices: async (): Promise<Device[]> => {
    // Endpoint: ?action=devices
    const { data } = await api.get<ApiResponse<Device[]>>('', { params: { action: 'devices' } });
    return data.data || []; // Fallback to empty array
  },

  getUser: async (): Promise<User | null> => {
    // Endpoint: ?action=user
    try {
      const { data } = await api.get<ApiResponse<User>>('', { params: { action: 'user' } });
      return data.data || null;
    } catch (e) {
      console.error('Failed to fetch user', e);
      return null;
    }
  },

  getLivePositions: async (): Promise<Position[]> => {
    // Endpoint: ?action=live
    const { data } = await api.get<ApiResponse<Position[]>>('', { params: { action: 'live' } });
    return (data.data || []).map(p => ({
      ...p,
      lat: Number(p.lat),
      lng: Number(p.lng),
      timestamp: p.timestamp ? p.timestamp.replace(' ', 'T') : new Date().toISOString()
    }));
  },

  getHistory: async (limit = 100, offset = 0, deviceId?: string, date?: string): Promise<Position[]> => {
    // Endpoint: ?action=history
    const params: Record<string, string | number | undefined> = { action: 'history', limit, offset };
    if (deviceId) params.device_id = deviceId;
    if (date) params.date = date; // date format YYYY-MM-DD
    const { data } = await api.get<ApiResponse<Position[]>>('', { params });
    return (data.data || []).map(p => ({
      ...p,
      lat: Number(p.lat),
      lng: Number(p.lng),
      timestamp: p.timestamp ? p.timestamp.replace(' ', 'T') : new Date().toISOString()
    }));
  },

  getStats: async (period = 'week'): Promise<Stats> => {
    // Endpoint: ?action=stats
    const { data } = await api.get<ApiResponse<Stats>>('', { params: { action: 'stats', period } });
    return data.data;
  }
};

export default api;
