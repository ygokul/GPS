import { useEffect, useState } from 'react';
import StatsCard from '../components/common/StatsCard';
import { gpsService } from '../services/api';
import type { Position, Stats } from '../types';
import { FiActivity, FiMapPin, FiWifi, FiServer } from 'react-icons/fi';

const Dashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentPositions, setRecentPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, positionsData] = await Promise.all([
          gpsService.getStats(),
          gpsService.getLivePositions()
        ]);
        setStats(statsData);
        setRecentPositions(positionsData);
      } catch (error) {
        console.error("Failed into load dashboard data", error);
        // Fallback or error handling
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);



  if (loading) return <div className="p-8">Loading Dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Overview of system status and fleet activity.</p>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300 bg-white/40 dark:bg-slate-900/40 px-4 py-1.5 rounded-xl border border-white/20 dark:border-white/10 shadow-sm backdrop-blur-md">
          Last updated: {new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Devices" 
          value={stats?.totalDevices || 0} 
          icon={FiServer} 
          color="blue" 
        />
        <StatsCard 
          title="Online Now" 
          value={stats?.onlineDevices || 0} 
          icon={FiWifi} 
          color="green" 
          trend={stats ? `${Math.round((stats.onlineDevices / (stats.totalDevices || 1)) * 100)}% active` : undefined}
          trendUp={true}
        />
        <StatsCard 
          title="Points Today" 
          value={stats?.todayPoints.toLocaleString() || 0} 
          icon={FiMapPin} 
          color="orange" 
        />
        <StatsCard 
          title="Total Points" 
          value={stats?.totalPoints.toLocaleString() || 0} 
          icon={FiActivity} 
          color="purple" 
        />
      </div>

      {/* Notifications Section */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col h-[500px]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
            <FiActivity className="text-blue-500" />
            Live Notifications
          </h3>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
            Real-time
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
          {recentPositions.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
               <FiActivity className="w-8 h-8 mb-2 opacity-50" />
               <p>No recent notifications</p>
            </div>
          )}
          
          {recentPositions.map((pos, idx) => (
            <div key={idx} className="group flex items-start p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-blue-500/30 transition-all duration-200">
               {/* Icon Indicator */}
               <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mr-4 shrink-0 group-hover:bg-blue-500/20 transition-colors">
                 <FiMapPin className="text-blue-600 dark:text-blue-400 w-5 h-5" />
               </div>
               
               <div className="flex-1">
                 <div className="flex justify-between items-start">
                   <p className="font-semibold text-slate-800 dark:text-slate-200">
                     Device {pos.deviceId} updated location
                   </p>
                   <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                     {(() => { try { return new Date(pos.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } })()}
                   </span>
                 </div>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                   New coordinates received at Lat: {pos.lat.toFixed(4)}, Lng: {pos.lng.toFixed(4)}
                 </p>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
