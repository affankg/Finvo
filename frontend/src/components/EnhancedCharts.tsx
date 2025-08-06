import React, { useState } from 'react';

interface ChartData {
  label: string;
  value: number;
  color?: string;
  category?: string;
  metadata?: any;
}

interface InteractiveBarChartProps {
  data: ChartData[];
  height?: number;
  onBarClick?: (data: ChartData, index: number) => void;
  showTooltip?: boolean;
  className?: string;
  selectedIndex?: number;
}

export const InteractiveBarChart: React.FC<InteractiveBarChartProps> = ({
  data,
  height = 300,
  onBarClick,
  showTooltip = true,
  className = '',
  selectedIndex = -1
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [tooltipData, setTooltipData] = useState<{ x: number; y: number; data: ChartData } | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: `${height}px` }}>
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => Math.abs(d.value)));
  const minValue = Math.min(...data.map(d => d.value));
  const hasNegativeValues = minValue < 0;

  const handleBarClick = (item: ChartData, index: number) => {
    if (onBarClick) {
      onBarClick(item, index);
    }
  };

  const handleMouseEnter = (item: ChartData, index: number, event: React.MouseEvent) => {
    setHoveredIndex(index);
    if (showTooltip) {
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltipData({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
        data: item
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(-1);
    setTooltipData(null);
  };

  return (
    <div className={`relative ${className}`} style={{ height: `${height}px` }}>
      <div className="flex h-full items-end justify-center space-x-2 px-4">
        {data.map((item, index) => {
          const isPositive = item.value >= 0;
          const barHeight = Math.abs(item.value) / maxValue * (hasNegativeValues ? height * 0.4 : height * 0.8);
          const isSelected = selectedIndex === index;
          const isHovered = hoveredIndex === index;
          
          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center max-w-16"
              onMouseEnter={(e) => handleMouseEnter(item, index, e)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleBarClick(item, index)}
            >
              {/* Value label on top */}
              <div className={`text-xs mb-1 transition-opacity duration-200 ${
                isHovered || isSelected ? 'opacity-100 font-medium' : 'opacity-70'
              } text-gray-600 dark:text-gray-400`}>
                {item.value.toLocaleString()}
              </div>
              
              {/* Bar container */}
              <div 
                className="relative w-full flex flex-col justify-end"
                style={{ 
                  height: hasNegativeValues ? `${height * 0.8}px` : `${height * 0.8}px`,
                  cursor: onBarClick ? 'pointer' : 'default'
                }}
              >
                {/* Zero line for negative values */}
                {hasNegativeValues && (
                  <div 
                    className="absolute w-full border-t border-gray-300 dark:border-gray-600"
                    style={{ 
                      top: isPositive ? `${height * 0.4}px` : `${height * 0.4 - barHeight}px`
                    }}
                  />
                )}
                
                {/* Bar */}
                <div
                  className={`w-full transition-all duration-300 rounded-t-sm ${
                    item.color || (isPositive ? 'bg-blue-600 dark:bg-blue-500' : 'bg-red-600 dark:bg-red-500')
                  } ${
                    isHovered || isSelected 
                      ? 'shadow-lg transform scale-105 opacity-90' 
                      : 'opacity-80 hover:opacity-90'
                  } ${
                    onBarClick ? 'hover:shadow-md' : ''
                  }`}
                  style={{ 
                    height: `${barHeight}px`,
                    marginTop: hasNegativeValues && !isPositive ? '0' : 'auto'
                  }}
                />
              </div>
              
              {/* Label */}
              <div className={`text-xs mt-2 text-center transition-all duration-200 ${
                isHovered || isSelected ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
              }`}>
                <div className="truncate">{item.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltipData && (
        <div
          className="fixed z-50 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltipData.x,
            top: tooltipData.y
          }}
        >
          <div className="font-medium">{tooltipData.data.label}</div>
          <div>Value: {tooltipData.data.value.toLocaleString()}</div>
          {tooltipData.data.category && (
            <div>Category: {tooltipData.data.category}</div>
          )}
        </div>
      )}
    </div>
  );
};

interface InteractivePieChartProps {
  data: ChartData[];
  size?: number;
  onSegmentClick?: (data: ChartData, index: number) => void;
  showLabels?: boolean;
  showPercentages?: boolean;
  className?: string;
  selectedIndex?: number;
}

export const InteractivePieChart: React.FC<InteractivePieChartProps> = ({
  data,
  size = 200,
  onSegmentClick,
  showLabels = true,
  showPercentages = true,
  className = '',
  selectedIndex = -1
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(-1);

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: `${size}px` }}>
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = [
    'text-blue-600 bg-blue-600',
    'text-green-600 bg-green-600',
    'text-yellow-600 bg-yellow-600',
    'text-red-600 bg-red-600',
    'text-purple-600 bg-purple-600',
    'text-indigo-600 bg-indigo-600',
    'text-pink-600 bg-pink-600',
    'text-gray-600 bg-gray-600'
  ];

  let cumulativePercentage = 0;

  const handleSegmentClick = (item: ChartData, index: number) => {
    if (onSegmentClick) {
      onSegmentClick(item, index);
    }
  };

  return (
    <div className={`flex items-center space-x-6 ${className}`}>
      <div className="relative" style={{ width: `${size}px`, height: `${size}px` }}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const strokeDasharray = `${percentage} ${100 - percentage}`;
            const strokeDashoffset = -cumulativePercentage;
            const isSelected = selectedIndex === index;
            const isHovered = hoveredIndex === index;
            
            cumulativePercentage += percentage;
            
            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r={isSelected || isHovered ? "47" : "45"}
                fill="none"
                stroke="currentColor"
                strokeWidth={isSelected || isHovered ? "12" : "10"}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className={`transition-all duration-300 cursor-pointer ${
                  item.color?.split(' ')[0] || colors[index % colors.length].split(' ')[0]
                } ${
                  isHovered || isSelected ? 'opacity-100' : 'opacity-80 hover:opacity-90'
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(-1)}
                onClick={() => handleSegmentClick(item, index)}
              />
            );
          })}
        </svg>
        
        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {total.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
          </div>
        </div>
      </div>
      
      {showLabels && (
        <div className="flex-1 space-y-2">
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100);
            const isSelected = selectedIndex === index;
            const isHovered = hoveredIndex === index;
            
            return (
              <div 
                key={index} 
                className={`flex items-center justify-between p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                  isHovered || isSelected 
                    ? 'bg-gray-100 dark:bg-gray-700 shadow-sm' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(-1)}
                onClick={() => handleSegmentClick(item, index)}
              >
                <div className="flex items-center space-x-2">
                  <div 
                    className={`w-3 h-3 rounded-full ${
                      item.color?.split(' ')[1] || colors[index % colors.length].split(' ')[1]
                    }`}
                  />
                  <span className={`text-sm transition-all duration-200 ${
                    isHovered || isSelected 
                      ? 'font-medium text-gray-900 dark:text-white' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {item.label}
                  </span>
                </div>
                <div className="text-right">
                  <div className={`text-sm transition-all duration-200 ${
                    isHovered || isSelected 
                      ? 'font-bold text-gray-900 dark:text-white' 
                      : 'font-medium text-gray-900 dark:text-white'
                  }`}>
                    {item.value.toLocaleString()}
                  </div>
                  {showPercentages && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {percentage.toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface InteractiveLineChartProps {
  data: ChartData[];
  height?: number;
  onPointClick?: (data: ChartData, index: number) => void;
  showGrid?: boolean;
  showPoints?: boolean;
  className?: string;
  selectedIndex?: number;
}

export const InteractiveLineChart: React.FC<InteractiveLineChartProps> = ({
  data,
  height = 250,
  onPointClick,
  showGrid = true,
  showPoints = true,
  className = '',
  selectedIndex = -1
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(-1);

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: `${height}px` }}>
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
    return { x, y, data: item, index };
  });

  const pathD = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  const handlePointClick = (item: ChartData, index: number) => {
    if (onPointClick) {
      onPointClick(item, index);
    }
  };

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
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-blue-600 dark:text-blue-400"
        />
        
        {/* Points */}
        {showPoints && points.map((point, index) => {
          const isSelected = selectedIndex === index;
          const isHovered = hoveredIndex === index;
          
          return (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={isSelected || isHovered ? "2.5" : "2"}
              className={`transition-all duration-200 cursor-pointer ${
                isSelected || isHovered 
                  ? 'fill-blue-800 dark:fill-blue-300' 
                  : 'fill-blue-600 dark:fill-blue-400 hover:fill-blue-800 dark:hover:fill-blue-300'
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(-1)}
              onClick={() => handlePointClick(point.data, index)}
            />
          );
        })}
      </svg>
      
      {/* Labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 px-2">
        {data.map((item, index) => {
          const isSelected = selectedIndex === index;
          const isHovered = hoveredIndex === index;
          
          return (
            <span 
              key={index} 
              className={`truncate max-w-16 transition-all duration-200 ${
                isHovered || isSelected ? 'font-medium text-gray-900 dark:text-white' : ''
              }`}
            >
              {item.label}
            </span>
          );
        })}
      </div>
    </div>
  );
};
