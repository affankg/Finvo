import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { formatSmartCurrency, DEFAULT_CURRENCY } from '../utils/currency';

// Blue-themed color palette for consistency
const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#1E40AF',
  accent: '#60A5FA',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  gray: '#6B7280'
};

// Colors for pie chart segments
const PIE_COLORS = [CHART_COLORS.primary, CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.danger];

// Custom tooltip formatter
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? formatSmartCurrency(entry.value, {}, DEFAULT_CURRENCY) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Chart Interfaces
export interface InvoicePaymentData {
  month: string;
  invoices: number;
  payments: number;
}

export interface ClientReceivablesData {
  client: string;
  amount: number;
}

export interface InvoiceStatusData {
  status: string;
  count: number;
  amount: number;
}

export interface ReceivablesAgingData {
  client: string;
  days_0_30: number;
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
}

// 1. Invoice vs Payments Chart (Line + Bar)
interface InvoicePaymentChartProps {
  data: InvoicePaymentData[];
  height?: number;
  className?: string;
}

export const InvoicePaymentChart: React.FC<InvoicePaymentChartProps> = ({ 
  data, 
  height = 300, 
  className = '' 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: `${height}px` }}>
        <p className="text-gray-500 dark:text-gray-400">No invoice/payment data available</p>
      </div>
    );
  }

  return (
    <div className={className} style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="month" 
            className="text-xs text-gray-600 dark:text-gray-400"
            stroke="currentColor"
          />
          <YAxis 
            className="text-xs text-gray-600 dark:text-gray-400"
            stroke="currentColor"
            tickFormatter={(value) => formatSmartCurrency(value, {}, DEFAULT_CURRENCY)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="invoices" 
            fill={CHART_COLORS.primary} 
            name="Invoice Amount" 
            radius={[4, 4, 0, 0]}
            opacity={0.8}
          />
          <Line 
            type="monotone" 
            dataKey="payments" 
            stroke={CHART_COLORS.success} 
            strokeWidth={3}
            name="Payments Received"
            dot={{ fill: CHART_COLORS.success, strokeWidth: 2, r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// 2. Outstanding Receivables per Client (Horizontal Bar)
interface ClientReceivablesChartProps {
  data: ClientReceivablesData[];
  height?: number;
  className?: string;
}

export const ClientReceivablesChart: React.FC<ClientReceivablesChartProps> = ({ 
  data, 
  height = 300, 
  className = '' 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: `${height}px` }}>
        <p className="text-gray-500 dark:text-gray-400">No receivables data available</p>
      </div>
    );
  }

  // Sort by amount descending and take top 10
  const sortedData = [...data]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  return (
    <div className={className} style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={sortedData} 
          layout="horizontal"
          margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            type="number"
            className="text-xs text-gray-600 dark:text-gray-400"
            stroke="currentColor"
            tickFormatter={(value) => formatSmartCurrency(value, {}, DEFAULT_CURRENCY)}
          />
          <YAxis 
            type="category"
            dataKey="client" 
            className="text-xs text-gray-600 dark:text-gray-400"
            stroke="currentColor"
            width={80}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="amount" 
            fill={CHART_COLORS.warning} 
            name="Outstanding Amount"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// 3. Invoice Status Overview (Donut Chart)
interface InvoiceStatusChartProps {
  data: InvoiceStatusData[];
  size?: number;
  className?: string;
}

export const InvoiceStatusChart: React.FC<InvoiceStatusChartProps> = ({ 
  data, 
  size = 250, 
  className = '' 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: `${size}px` }}>
        <p className="text-gray-500 dark:text-gray-400">No invoice status data available</p>
      </div>
    );
  }

  return (
    <div className={className} style={{ height: `${size}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="amount"
            nameKey="status"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string) => [
              formatSmartCurrency(value, {}, DEFAULT_CURRENCY), 
              name
            ]}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry: any) => (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {value}: {formatSmartCurrency(entry?.payload?.amount || 0, {}, DEFAULT_CURRENCY)}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// 4. Receivables Aging Report (Stacked Bar)
interface ReceivablesAgingChartProps {
  data: ReceivablesAgingData[];
  height?: number;
  className?: string;
}

export const ReceivablesAgingChart: React.FC<ReceivablesAgingChartProps> = ({ 
  data, 
  height = 300, 
  className = '' 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: `${height}px` }}>
        <p className="text-gray-500 dark:text-gray-400">No aging data available</p>
      </div>
    );
  }

  return (
    <div className={className} style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="client" 
            className="text-xs text-gray-600 dark:text-gray-400"
            stroke="currentColor"
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            className="text-xs text-gray-600 dark:text-gray-400"
            stroke="currentColor"
            tickFormatter={(value) => formatSmartCurrency(value, {}, DEFAULT_CURRENCY)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="days_0_30" 
            stackId="aging" 
            fill={CHART_COLORS.success} 
            name="0-30 days"
          />
          <Bar 
            dataKey="days_31_60" 
            stackId="aging" 
            fill={CHART_COLORS.warning} 
            name="31-60 days"
          />
          <Bar 
            dataKey="days_61_90" 
            stackId="aging" 
            fill="#F97316" 
            name="61-90 days"
          />
          <Bar 
            dataKey="days_90_plus" 
            stackId="aging" 
            fill={CHART_COLORS.danger} 
            name="90+ days"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Export all chart components
export {
  CHART_COLORS,
  PIE_COLORS,
  CustomTooltip
};
