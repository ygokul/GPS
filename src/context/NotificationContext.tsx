import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface Notification {
  id: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'info' | 'alert' | 'success';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (message: string, type?: Notification['type']) => void;
  markAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem('notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse notifications', e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = useCallback((message: string, type: Notification['type'] = 'info') => {
    const newNotif: Notification = {
      id: crypto.randomUUID(),
      message,
      timestamp: new Date(),
      read: false,
      type
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const markAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
