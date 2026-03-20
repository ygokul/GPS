import { useEffect, useState, useRef, useCallback } from 'react';
import MapCanvas from '../components/map/MapCanvas';
import { gpsService } from '../services/api';
import type { Position } from '../types';
import { FiRefreshCw, FiExternalLink } from 'react-icons/fi';

import { useGeofence } from '../context/GeofenceContext';
import { useNotification } from '../context/NotificationContext';
import { FiPlus, FiTrash2, FiMapPin, FiSearch } from 'react-icons/fi';
import Modal from '../components/common/Modal';
import axios from 'axios';

const LiveTracking = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<number | null>(null);

  // Geofence State
  const { geofences, addGeofence, removeGeofence, checkProximity } = useGeofence();
  const { addNotification } = useNotification();
  const [isAddingFence, setIsAddingFence] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string, lat: string, lon: string }>>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fenceName, setFenceName] = useState('');
  const [pendingLocation, setPendingLocation] = useState<{lat: number, lng: number} | null>(null);
  
  // Use a ref to track alerts sent to avoid spamming every refresh
  const alertsSent = useRef<Set<string>>(new Set());

  // Wrap fetchPositions in useCallback to fix dependency warning
  const fetchPositions = useCallback(async () => {
    try {
      const data = await gpsService.getLivePositions();
      setPositions(data);
      setLastRefreshed(new Date());

      // Check Proximity
      data.forEach(pos => {
        const zoneName = checkProximity(pos);
        const alertKey = `${pos.deviceId}-${zoneName}`;

        if (zoneName) {
           if (!alertsSent.current.has(alertKey)) {
             const msg = `Device ${pos.deviceId} entered ${zoneName}`;
             
             // 1. In-App Notification
             addNotification(msg, 'success');
             
             // 2. System Notification
             if ('Notification' in window && Notification.permission === 'granted') {
               try {
                 new Notification('Geofence Alert', {
                   body: msg,
                   icon: '/vite.svg'
                 });
               } catch (e) {
                 console.error("Notification failed", e);
               }
             }

             alertsSent.current.add(alertKey);
             setTimeout(() => alertsSent.current.delete(alertKey), 60000);
           }
        }
      });

    } catch (error) {
      console.error("Failed to fetch live positions", error);
    }
  }, [checkProximity, addNotification]);

  // Initial Fetch & Interval
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (mounted) await fetchPositions();
    };
    init();
    if (autoRefresh) {
      intervalRef.current = window.setInterval(fetchPositions, 10000);
    }
    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchPositions]);

  // Search Location via Nominatim
  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
      setSearchResults(res.data);
    } catch (e) {
      console.error('Search failed', e);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (isAddingFence) {
      setPendingLocation({ lat, lng });
      setFenceName('Home'); // Default
      setIsModalOpen(true);
    }
  };

  const handleSearchResultClick = (result: { lat: string; lon: string; display_name: string }) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    setPendingLocation({ lat, lng });
    setFenceName(result.display_name.split(',')[0]);
    setSearchResults([]);
    setSearchQuery('');
    setIsModalOpen(true);
  };

  const handleConfirmFence = () => {
    if (pendingLocation && fenceName) {
      addGeofence({
        name: fenceName,
        lat: pendingLocation.lat,
        lng: pendingLocation.lng,
        radius: 200 // Default 200m
      });
      setIsModalOpen(false);
      setIsAddingFence(false);
      setPendingLocation(null);
      setFenceName('');
    }
  };

  const markers = positions.map(p => ({
    id: p.deviceId,
    lat: p.lat,
    lng: p.lng,
    title: `Device ${p.deviceId}`,
    description: (
       <div>
         <p>Updated: {(() => { try { return new Date(p.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }); } catch { return 'Unknown'; } })()}</p>
         <a 
           href={`https://www.google.com/maps?q=${p.lat},${p.lng}`} 
           target="_blank" 
           rel="noopener noreferrer"
           className="text-blue-500 hover:underline flex items-center mt-1"
         >
           View on Google Maps <FiExternalLink className="ml-1 w-3 h-3" />
         </a>
       </div>
    )
  }));

  const center: [number, number] | undefined = positions.length > 0 
    ? [positions[0].lat, positions[0].lng] 
    : undefined;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
        <div>
           <h1 className="text-2xl font-bold dark:text-white">Live Tracking</h1>
           <p className="text-sm text-slate-500 dark:text-slate-400">
             Auto-refreshing every 10s • Last update: {lastRefreshed.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
           </p>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-3 md:space-y-0 md:space-x-3 w-full md:w-auto">
          {/* Search Bar - Full Width on Mobile */}
          <div className="relative w-full md:w-64 z-[500]">
            <input 
              type="text" 
              placeholder="Search place to pin..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2 bg-white/40 dark:bg-slate-800/40 border border-white/20 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
            <FiSearch className="absolute left-3 top-2.5 text-slate-400" />
            
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-12 left-0 w-full bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[600] max-h-60 overflow-y-auto">
                {searchResults.map((res, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleSearchResultClick(res)}
                    className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer text-sm border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div className="font-medium text-slate-800 dark:text-gray-200">{res.display_name.split(',')[0]}</div>
                    <div className="text-xs text-slate-500 truncate">{res.display_name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center justify-between md:justify-start space-x-2">
            
            <button 
               onClick={() => setIsAddingFence(!isAddingFence)}
               className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center transition-all whitespace-nowrap ${
                 isAddingFence 
                 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                 : 'bg-white/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 border border-white/20'
               }`}
            >
              <FiPlus className={`mr-2 transition-transform ${isAddingFence ? 'rotate-45' : ''}`} />
              {isAddingFence ? 'Cancel' : 'Add Place'}
            </button>

            <button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm flex justify-center ${
                autoRefresh 
                 ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20' 
                 : 'bg-white/40 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400 border border-white/20'
              }`}
            >
               {autoRefresh ? 'Auto On' : 'Auto Off'}
            </button>
            
            <button 
              onClick={() => fetchPositions()}
              className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl transition-all border border-blue-500/20 shadow-sm"
              title="Refresh Now"
            >
              <FiRefreshCw className={autoRefresh ? "animate-spin-slow" : ""} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 glass-panel rounded-2xl overflow-hidden relative">
         <MapCanvas 
           markers={markers} 
           geofences={geofences}
           onRemoveGeofence={removeGeofence}
           onMapClick={handleMapClick}
           center={center} 
           zoom={10} 
           className={`h-full w-full ${isAddingFence ? 'cursor-crosshair' : ''}`}
         />
         
         {/* Geofence List Overlay */}
         <div className="absolute top-4 left-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 dark:border-white/10 z-[400] text-sm max-h-[300px] overflow-y-auto w-64">
           <div className="font-bold mb-3 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
             <FiMapPin className="mr-2 text-red-500" /> My Places
           </div>
           <div className="space-y-2">
             {geofences.map(g => (
               <div key={g.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                 <div>
                   <div className="font-medium text-slate-800 dark:text-slate-200">{g.name}</div>
                   <div className="text-xs text-slate-500">{g.radius}m radius</div>
                 </div>
                 <button onClick={() => removeGeofence(g.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                   <FiTrash2 />
                 </button>
               </div>
             ))}
             {geofences.length === 0 && <span className="text-gray-400 italic text-xs">No places added. Click "Add Place" or search.</span>}
           </div>
         </div>

         {/* Device List Overlay (Right) */}
         <div className="absolute top-4 right-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 dark:border-white/10 z-[400] text-sm max-h-[300px] overflow-y-auto">
           <div className="font-bold mb-3 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Active Devices</div>
           <div className="space-y-2">
             {positions.map(p => (
               <div key={p.deviceId} className="flex justify-between items-center w-52 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                 <span className="text-slate-700 dark:text-slate-300 font-medium">ID: {p.deviceId}</span>
                 <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs px-2 py-0.5 rounded-md font-mono border border-green-200 dark:border-green-800">
                   {p.satellites ? `${p.satellites} sats` : 'Online'}
                 </span>
               </div>
             ))}
             {positions.length === 0 && <span className="text-gray-400 italic p-2 block">No signal</span>}
           </div>
         </div>
         
         {/* Add Place Modal */}
         <Modal
           isOpen={isModalOpen}
           onClose={() => setIsModalOpen(false)}
           title="Add New Place"
           footer={
             <>
               <button 
                 onClick={() => setIsModalOpen(false)}
                 className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleConfirmFence}
                 className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-md shadow-blue-500/30"
               >
                 Add Place
               </button>
             </>
           }
         >
           <div className="space-y-3">
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
               Name
             </label>
             <input
               type="text"
               value={fenceName}
               onChange={(e) => setFenceName(e.target.value)}
               placeholder="e.g. Home, Office, School"
               autoFocus
               onKeyDown={(e) => e.key === 'Enter' && handleConfirmFence()}
               className="w-full px-4 py-2 bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
             />
             <p className="text-xs text-slate-500">
               A notification will be triggered when a device enters within 200m of this location.
             </p>
           </div>
         </Modal>

      </div>
    </div>
  );
};

export default LiveTracking;
