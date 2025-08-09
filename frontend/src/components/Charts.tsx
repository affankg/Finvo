import React from 'react';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface LineChartProps {
  data: ChartData[];
  height?: number;
  showGrid?: boolean;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  height = 200, 
  showGrid = true, 
  className = '' 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-${height/4} ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = ((maxValue - item.value) / range) * 80 + 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={`relative ${className}`} style={{ height: `${height}px` }}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Grid */}
        {showGrid && (
          <g className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="0.2">
            {[20, 40, 60, 80].map(y => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} />
            ))}
            {data.map((_, index) => {
              const x = (index / (data.length - 1)) * 100;
              return <line key={index} x1={x} y1="0" x2={x} y2="100" />;
            })}
          </g>
        )}
        
        {/* Line */}
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          points={points}
          className="text-blue-600 dark:text-blue-400"
        />
        
        {/* Points */}
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = ((maxValue - item.value) / range) * 80 + 10;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="1.5"
              className="fill-blue-600 dark:fill-blue-400"
            />
          );
        })}
      </svg>
      
      {/* Labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
        {data.map((item, index) => (
          <span key={index} className="truncate max-w-16">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};

interface BarChartProps {
  data: ChartData[];
  height?: number;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  height = 200, 
  orientation = 'vertical',
  className = '' 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-${height/4} ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className={`${className}`} style={{ height: `${height}px` }}>
      <div className="flex h-full items-end space-x-2">
        {data.map((item, index) => {
          const heightPercent = (item.value / maxValue) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                {item.value.toLocaleString()}
              </div>
              <div
                className={`w-full rounded-t-sm transition-all duration-500 ${
                  item.color || 'bg-blue-600 dark:bg-blue-500'
                }`}
                style={{ height: `${heightPercent}%` }}
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface PieChartProps {
  data: ChartData[];
  size?: number;
  showLabels?: boolean;
  className?: string;
}

export const PieChart: React.FC<PieChartProps> = ({ 
  data, 
  size = 200, 
  showLabels = true,
  className = '' 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: `${size}px` }}>
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = [
    'text-blue-600',
    'text-green-600', 
    'text-yellow-600',
    'text-red-600',
    'text-purple-600',
    'text-indigo-600',
    'text-pink-600',
    'text-gray-600'
  ];

  let cumulativePercentage = 0;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-col lg:flex-row items-center justify-center space-y-4 lg:space-y-0 lg:space-x-6">
        {/* Pie Chart */}
        <div className="relative flex-shrink-0" style={{ width: `${size}px`, height: `${size}px` }}>
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = -cumulativePercentage;
              
              cumulativePercentage += percentage;
              
              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className={item.color || colors[index % colors.length]}
                  opacity="0.9"
                />
              );
            })}
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {total.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        {showLabels && (
          <div className="grid grid-cols-1 gap-3 max-w-xs w-full">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between space-x-3 p-2 rounded-lg bg-white/20 dark:bg-gray-700/20">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div 
                    className={`w-4 h-4 rounded-full flex-shrink-0 ${
                      item.color?.replace('text-', 'bg-') || colors[index % colors.length].replace('text-', 'bg-')
                    }`}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {item.label}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {((item.value / total) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {item.value.toLocaleString()}
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
