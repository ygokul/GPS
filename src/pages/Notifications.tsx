import { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { FiBell, FiCheck, FiTrash2, FiClock } from 'react-icons/fi';
import clsx from 'clsx';

const NotificationsPage = () => {
  const { notifications, markAsRead, clearNotifications } = useNotification();
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'default'
  );

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    const res = await Notification.requestPermission();
    setPermission(res);
    if (res === 'granted') {
      new Notification('Notifications Enabled', {
        body: 'You will now receive alerts from this device.',
        icon: '/vite.svg'
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400">System alerts and geofence updates.</p>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={markAsRead}
            className="flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
          >
            <FiCheck className="mr-2" /> Mark all read
          </button>
          <button 
            onClick={clearNotifications}
            className="flex items-center px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          >
            <FiTrash2 className="mr-2" /> Clear all
          </button>
        </div>
      </div>

      {/* Permission Request Banner */}
      {permission !== 'granted' && 'Notification' in window && (
        <div className="glass-panel p-6 rounded-2xl border-l-4 border-yellow-500 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
             <div className="p-3 bg-yellow-500/10 rounded-full mr-4 text-yellow-500">
               <FiBell size={24} />
             </div>
             <div>
               <h3 className="font-bold text-slate-800 dark:text-white">Enable Push Notifications</h3>
               <p className="text-sm text-slate-500 max-w-lg">
                 Get untethered alerts for geofences even when the app is in the background. 
                 Essential for mobile users.
               </p>
             </div>
          </div>
          <button 
            onClick={requestPermission}
            className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-xl shadow-lg shadow-yellow-500/30 transition-all active:scale-95"
          >
            Enable Now
          </button>
        </div>
      )}

      {/* Notification List */}
      <div className="glass-panel rounded-2xl overflow-hidden min-h-[400px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <FiBell size={48} className="mb-4 opacity-20" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/10">
            {notifications.map((n) => (
              <div key={n.id} className={clsx(
                "p-4 flex items-start hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
                !n.read && "bg-blue-50/50 dark:bg-blue-900/10"
              )}>
                <div className={clsx(
                  "p-2 rounded-lg mr-4 shrink-0 text-2xl",
                  n.type === 'alert' ? "bg-red-100 dark:bg-red-900/40" :
                  n.type === 'success' ? "bg-green-100 dark:bg-green-900/40" :
                  "bg-blue-100 dark:bg-blue-900/40"
                )}>
                  {/* Smart Icon Logic */}
                  {n.message.toLowerCase().includes('home') ? '🏠' :
                   n.message.toLowerCase().includes('school') ? '🏫' :
                   n.message.toLowerCase().includes('work') ? '🏢' :
                   n.type === 'alert' ? '⚠️' : 
                   n.type === 'success' ? '✅' : 'ℹ️'}
                </div>
                
                <div className="flex-1">
                  <p className={clsx("text-sm", n.read ? "text-slate-600 dark:text-slate-400" : "font-semibold text-slate-900 dark:text-white")}>
                    {n.message}
                  </p>
                  <div className="flex items-center mt-1 text-xs text-slate-400">
                    <FiClock className="mr-1" />
                    {new Date(n.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
