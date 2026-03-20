export interface Device {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'inactive';
  lastConnect: string;
  lat: number;
  lng: number;
  speed?: number;
  satellites?: number;
  battery?: number;
}

export interface Geofence {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // in meters
}

export type Theme = 'light' | 'dark';

export interface Position {
  id: string;
  deviceId: string;
  lat: number;
  lng: number;
  timestamp: string;
  satellites?: number;
}

export interface Stats {
  totalDevices: number;
  onlineDevices: number;
  totalPoints: number;
  todayPoints: number;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
}
