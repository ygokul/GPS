import React from 'react';
import clsx from 'clsx';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  color?: 'blue' | 'green' | 'orange' | 'purple';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, trend, trendUp, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
      {/* Glow effect */}
      <div className={clsx("absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity", colorClasses[color].replace('text-', 'bg-'))} />
      
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold mt-1 dark:text-white">{value}</h3>
          {trend && (
            <p className={clsx("text-xs font-medium mt-1", trendUp ? "text-green-500" : "text-red-500")}>
              {trend}
            </p>
          )}
        </div>
        <div className={clsx("p-3 rounded-xl", colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
