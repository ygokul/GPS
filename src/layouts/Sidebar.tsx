import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  FiGrid, FiMap, FiClock, FiSmartphone, FiBell,
  FiX, FiSun, FiMoon 
} from 'react-icons/fi';
import clsx from 'clsx';

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { to: '/', icon: FiGrid, label: 'Dashboard' },
    { to: '/live', icon: FiMap, label: 'Live Tracking' },
    { to: '/history', icon: FiClock, label: 'History' },
    { to: '/devices', icon: FiSmartphone, label: 'Devices' },
    { to: '/notifications', icon: FiBell, label: 'Notifications' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[1900] lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Glass Effect */}
      <aside className={clsx(
        "fixed top-0 left-0 z-[2000] h-full w-72 glass-sidebar transition-transform duration-300 lg:translate-x-0 shadow-2xl",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-2xl -z-10" />

          {/* Logo */}
          <div className="h-24 flex items-center px-8">
            <div className="flex items-center space-x-3">
               <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                 <FiMap className="text-white w-6 h-6" />
               </div>
               <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300">
                 GPS Tracker
               </span>
            </div>
            <button 
              onClick={onClose} 
              className="ml-auto lg:hidden p-2 hover:bg-white/10 rounded-lg text-slate-500"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose()}
                className={({ isActive }) => clsx(
                  "flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 group",
                  isActive 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 translate-x-1" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5 hover:translate-x-1"
                )}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={clsx("w-5 h-5 mr-3 transition-colors", isActive ? "text-white" : "text-slate-400 group-hover:text-blue-500")} />
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                       <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50 shadow-inner" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-6">
            <div className="glass-card p-4 rounded-2xl">
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all text-sm font-medium shadow-sm"
              >
                {theme === 'dark' ? <FiSun className="w-4 h-4 mr-2 text-amber-500" /> : <FiMoon className="w-4 h-4 mr-2 text-indigo-500" />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
