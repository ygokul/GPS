import { useEffect, useState } from 'react';
import { gpsService } from '../services/api';
import type { Device } from '../types';
import { FiXCircle, FiSmartphone, FiClock, FiActivity } from 'react-icons/fi';
import clsx from 'clsx';

const Devices = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const data = await gpsService.getDevices();
        setDevices(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadDevices();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold dark:text-white">Device Management</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           [...Array(3)].map((_, i) => (
             <div key={i} className="glass-panel p-6 rounded-2xl animate-pulse h-48 bg-white/20 dark:bg-slate-800/20" />
           ))
        ) : (
          devices.map(d => (
            <div key={d.id} className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all border border-white/20 dark:border-white/5">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                  <FiSmartphone size={24} />
                </div>
                <div className={clsx(
                  "px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1",
                  d.status === 'online' 
                    ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" 
                    : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                )}>
                   {d.status === 'online' ? <FiActivity /> : <FiXCircle />}
                   <span className="capitalize">{d.status}</span>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{d.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-mono">ID: {d.id}</p>
              
              <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex items-center text-xs text-slate-400">
                <FiClock className="mr-2" />
                Last seen: {new Date(d.lastConnect).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </div>

              {/* Decorative Accent */}
              <div className={clsx(
                "absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-current opacity-5 rounded-bl-full -mr-10 -mt-10",
                d.status === 'online' ? "text-green-500" : "text-slate-500"
              )} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Devices;
