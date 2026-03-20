
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { GeofenceProvider } from './context/GeofenceContext';
import { NotificationProvider } from './context/NotificationContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import LiveTracking from './pages/LiveTracking';
import HistoryPage from './pages/History';
import Devices from './pages/Devices';
import NotificationsPage from './pages/Notifications';

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <GeofenceProvider>
          <BrowserRouter>
            <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="live" element={<LiveTracking />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="devices" element={<Devices />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </GeofenceProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
