import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Geofence, Position } from '../types';

interface GeofenceContextType {
  geofences: Geofence[];
  addGeofence: (fence: Omit<Geofence, 'id'>) => void;
  removeGeofence: (id: string) => void;
  checkProximity: (position: Position) => string | null; // Returns name of fence if inside
}

const GeofenceContext = createContext<GeofenceContextType | undefined>(undefined);

export const GeofenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [geofences, setGeofences] = useState<Geofence[]>(() => {
    const saved = localStorage.getItem('geofences');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('geofences', JSON.stringify(geofences));
  }, [geofences]);

  const addGeofence = (fence: Omit<Geofence, 'id'>) => {
    const newFence = { ...fence, id: crypto.randomUUID() };
    setGeofences(prev => [...prev, newFence]);
  };

  const removeGeofence = (id: string) => {
    setGeofences(prev => prev.filter(g => g.id !== id));
  };

  const checkProximity = (position: Position): string | null => {
    // Simple Haversine distance check
    for (const fence of geofences) {
      const R = 6371e3; // metres
      const φ1 = position.lat * Math.PI/180;
      const φ2 = fence.lat * Math.PI/180;
      const Δφ = (fence.lat-position.lat) * Math.PI/180;
      const Δλ = (fence.lng-position.lng) * Math.PI/180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      if (distance <= fence.radius) {
        return fence.name;
      }
    }
    return null;
  };

  return (
    <GeofenceContext.Provider value={{ geofences, addGeofence, removeGeofence, checkProximity }}>
      {children}
    </GeofenceContext.Provider>
  );
};

export const useGeofence = () => {
  const context = useContext(GeofenceContext);
  if (context === undefined) {
    throw new Error('useGeofence must be used within a GeofenceProvider');
  }
  return context;
};
