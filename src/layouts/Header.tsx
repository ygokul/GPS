import { useState, useEffect } from 'react';
import { FiMenu, FiBell, FiX, FiCheck, FiRefreshCw } from 'react-icons/fi';
import { useNotification } from '../context/NotificationContext';
import { gpsService, type User } from '../services/api';
import clsx from 'clsx';

const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { notifications, unreadCount, markAsRead, clearNotifications } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    gpsService.getUser().then(data => {
      if (data) setUser(data);
    });
  }, []);

  return (
    <header className="h-20 flex items-center justify-between px-6 sticky top-0 z-[1500] transition-all duration-300">
      {/* Floating Glass Container */}
      <div className="absolute inset-x-4 top-2 bottom-2 glass-panel rounded-2xl -z-10" />

      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="mr-4 p-2 hover:bg-white/20 dark:hover:bg-black/20 rounded-xl transition-colors lg:hidden"
        >
          <FiMenu size={20} />
        </button>
      </div>

      <div className="flex items-center space-x-4">
        {/* System Status - Hidden on extra small screens */}
        <div className="hidden sm:flex items-center px-4 py-1.5 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-full text-xs font-medium backdrop-blur-sm shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
          System Online
        </div>

        {/* Refresh Button - Mobile Only */}
        <button 
          onClick={() => window.location.reload()}
          className="lg:hidden p-2.5 hover:bg-white/20 dark:hover:bg-black/20 rounded-xl transition-colors text-slate-600 dark:text-slate-300"
          aria-label="Refresh Page"
        >
          <FiRefreshCw size={20} />
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 hover:bg-white/20 dark:hover:bg-black/20 rounded-xl transition-colors relative"
          >
            <FiBell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse" />
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-12 w-80 glass-panel rounded-xl shadow-2xl z-40 overflow-hidden border border-white/20 flex flex-col max-h-[400px]">
                <div className="p-3 border-b border-white/10 flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-md">
                  <h3 className="font-bold text-sm dark:text-white">Notifications ({unreadCount})</h3>
                  <div className="flex space-x-2">
                     <button onClick={markAsRead} className="text-xs text-blue-500 hover:text-blue-600 flex items-center px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded" title="Mark all read">
                       <FiCheck className="mr-1" /> Read
                     </button>
                     <button onClick={clearNotifications} className="text-xs text-red-500 hover:text-red-600 flex items-center px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded" title="Clear all">
                       <FiX className="mr-1" /> Clear
                     </button>
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={clsx(
                        "p-3 rounded-lg text-sm transition-colors flex items-start",
                        n.read 
                          ? "bg-white/10 dark:bg-white/5 opacity-70" 
                          : "bg-blue-50/80 dark:bg-blue-900/30 border-l-4 border-blue-500 shadow-sm",
                        n.type === 'alert' && !n.read && "bg-red-50/80 dark:bg-red-900/30 border-red-500"
                      )}>
                        <div className="mr-3 text-lg shrink-0 pt-0.5">
                          {n.message.toLowerCase().includes('home') ? '🏠' :
                           n.message.toLowerCase().includes('school') ? '🏫' :
                           n.message.toLowerCase().includes('work') ? '🏢' :
                           n.type === 'alert' ? '⚠️' : 'ℹ️'}
                        </div>
                        <div>
                          <p className="font-medium dark:text-slate-200">{n.message}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(n.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
             <div className="text-sm font-bold text-slate-700 dark:text-white">{user?.name || 'Admin User'}</div>
             <div className="text-xs text-slate-500 dark:text-slate-400">{user?.role || 'Administrator'}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-lg cursor-pointer hover:shadow-indigo-500/30 transition-all overflow-hidden relative">
             <div className="w-full h-full rounded-[10px] bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
               {user?.avatar ? (
                 <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
               ) : (
                 <span className="font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-600">
                   {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                 </span>
               )}
             </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
