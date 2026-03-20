import { useEffect, useState } from 'react';
import { gpsService } from '../services/api';
import type { Position } from '../types';
import MapCanvas from '../components/map/MapCanvas';


const HistoryPage = () => {
  const [history, setHistory] = useState<Position[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  // No longer using limit selector found in previous version, defaulting to max points for map path
  
  useEffect(() => {
    const loadHistory = async () => {
      try {
        // Fetch up to 1000 points for the selected date to draw a good path
        const data = await gpsService.getHistory(1000, 0, undefined, selectedDate);
        setHistory(data);
      } catch (e) {
        console.error(e);
      }
    };
    loadHistory();
  }, [selectedDate]);

  // Convert for map path
  const path: [number, number][] = history.map(h => [h.lat, h.lng]);
  const center: [number, number] | undefined = path.length > 0 ? path[0] : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold dark:text-white">History & Analytics</h1>
        <div className="flex items-center space-x-2 w-full md:w-auto">
           <label className="text-sm text-slate-500 whitespace-nowrap">Filter Date:</label>
           <input 
             type="date"
             value={selectedDate} 
             onChange={(e) => setSelectedDate(e.target.value)}
             className="w-full md:w-auto bg-white/40 dark:bg-slate-900/40 border border-white/20 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm dark:text-white"
           />
        </div>
      </div>

        {/* Map View */}
        <div className="glass-panel p-4 rounded-xl flex flex-col h-[400px]">
          <h3 className="font-bold mb-4 dark:text-white">Path Replay</h3>
          <div className="flex-1 rounded-xl overflow-hidden relative shadow-inner">
             <MapCanvas path={path} center={center} zoom={13} className="h-full w-full" />
          </div>
        </div>

      {/* Data Table Removed as per user request */}
    </div>
  );
};

export default HistoryPage;
