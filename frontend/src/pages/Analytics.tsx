import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { dashboardAPI, FinancialChartsResponse, FinancialSummaryResponse, financialAPI, FinancialActivity } from '../services/api';
import { formatCurrency, DEFAULT_CURRENCY } from '../utils/currency';
import {
  InvoicePaymentChart,
  ClientReceivablesChart,
  InvoiceStatusChart,
  ReceivablesAgingChart
} from '../components/FinancialCharts';
import { LineChart, PieChart } from '../components/Charts';
import { StatCard } from '../components/DashboardComponents';

interface ChartFilters {
  date_from: string;
  date_to: string;
  client: string;
  status: string;
}

const Analytics: React.FC = () => {
  // Chart data state
  const [chartData, setChartData] = useState<FinancialChartsResponse | null>(null);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummaryResponse | null>(null);
  const [chartsLoading, setChartsLoading] = useState(true);
  
  // Financial Activities data
  const [activities, setActivities] = useState<FinancialActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  
  // Chart filters
  const [chartFilters, setChartFilters] = useState<ChartFilters>({
    date_from: '',
    date_to: '',
    client: '',
    status: ''
  });

  useEffect(() => {
    fetchChartData();
    fetchActivities();
  }, []);
  
  useEffect(() => {
    fetchChartData();
  }, [chartFilters]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing analytics data...');
      fetchActivities();
      fetchChartData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true);
      console.log('Fetching financial activities...');
      const response = await financialAPI.getActivities();
      console.log('Financial activities response:', response.data);
      
      const activitiesData = response.data.results || response.data || [];
      console.log('Processed activities data:', activitiesData);
      setActivities(activitiesData);
    } catch (error: any) {
      console.error('Failed to load financial activities:', error);
      toast.error(`Failed to load financial activities: ${error.response?.data?.detail || error.message}`);
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      setChartsLoading(true);
      
      // Prepare chart filters (remove empty values)
      const filters = Object.fromEntries(
        Object.entries(chartFilters).filter(([, value]) => value !== '')
      );
      
      console.log('Fetching chart data with filters:', filters);
      
      // Fetch chart data and financial summary in parallel
      const [chartsResponse, summaryResponse] = await Promise.all([
        dashboardAPI.getFinancialCharts(filters),
        dashboardAPI.getFinancialSummary()
      ]);
      
      console.log('Charts response:', chartsResponse.data);
      console.log('Summary response:', summaryResponse.data);
      
      setChartData(chartsResponse.data);
      setFinancialSummary(summaryResponse.data);
    } catch (error: any) {
      console.error('Chart data error:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      toast.error(`Failed to load chart data: ${error.response?.data?.detail || error.message}`);
    } finally {
      setChartsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setChartFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setChartFilters({
      date_from: '',
      date_to: '',
      client: '',
      status: ''
    });
  };

  // Enhanced analytics from financial activities
  const analytics = useMemo(() => {
    console.log('Computing analytics for activities:', activities);
    console.log('Activities count:', activities.length);
    
    // Validate activities data
    if (!Array.isArray(activities) || activities.length === 0) {
      console.warn('No activities data available for analytics');
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        profitMargin: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        receivables: { total: 0, overdue: 0, currentMonth: 0, count: 0 },
        payables: { total: 0, overdue: 0, currentMonth: 0, count: 0 },
        expenses: { 
          total: 0, 
          currentMonth: 0, 
          pending: 0, 
          count: 0,
          byProject: [],
          byCategory: [],
          byCostCenter: []
        },
        monthlyData: [],
        typeDistribution: []
      };
    }
    
    // Check what activity types we have
    const activityTypes = [...new Set(activities.map(a => a.activity_type))];
    console.log('Available activity types:', activityTypes);
    
    // Log sample activity to check structure
    if (activities.length > 0) {
      console.log('Sample activity structure:', activities[0]);
    }
    
    // Income calculation (paid income activities)
    const totalIncome = activities
      .filter(a => a.activity_type === 'income' && a.status === 'paid')
      .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

    const totalExpenses = activities
      .filter(a => a.activity_type === 'expense')
      .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

    const pendingAmount = activities
      .filter(a => a.status === 'pending')
      .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

    const overdueAmount = activities
      .filter(a => a.is_overdue)
      .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

    console.log('Calculated metrics:', {
      totalIncome,
      totalExpenses,
      pendingAmount,
      overdueAmount
    });

    // Activity type breakdowns
    const receivables = activities.filter(a => a.activity_type === 'receivable');
    const payables = activities.filter(a => a.activity_type === 'payable');
    const expenses = activities.filter(a => a.activity_type === 'expense');

    console.log('Activity breakdowns:', {
      receivables: receivables.length,
      payables: payables.length,
      expenses: expenses.length
    });

    // Receivables analytics
    const totalReceivablesOutstanding = receivables.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const overdueReceivables = receivables.filter(r => r.status === 'overdue').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const currentMonthReceivables = receivables.filter(r => new Date(r.transaction_date).getMonth() === new Date().getMonth()).reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    // Payables analytics
    const totalPayablesOutstanding = payables.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const overduePayables = payables.filter(p => p.status === 'overdue').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const currentMonthPayables = payables.filter(p => new Date(p.transaction_date).getMonth() === new Date().getMonth()).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Expenses analytics with project tracking
    const totalExpensesAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const currentMonthExpenses = expenses.filter(e => new Date(e.transaction_date).getMonth() === new Date().getMonth()).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const pendingExpenses = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Project-based expense analytics
    const projectExpenses = expenses.reduce((acc, expense) => {
      const projectKey = expense.project_number || expense.client_name || 'Unassigned';
      if (!acc[projectKey]) {
        acc[projectKey] = {
          total: 0,
          count: 0,
          categories: {},
          costCenters: {},
          pending: 0,
          paid: 0
        };
      }
      
      const amount = Number(expense.amount) || 0;
      acc[projectKey].total += amount;
      acc[projectKey].count += 1;
      
      // Track by category
      const category = expense.expense_category || 'Uncategorized';
      acc[projectKey].categories[category] = (acc[projectKey].categories[category] || 0) + amount;
      
      // Track by cost center
      const costCenter = expense.cost_center || 'General';
      acc[projectKey].costCenters[costCenter] = (acc[projectKey].costCenters[costCenter] || 0) + amount;
      
      // Track by status
      if (expense.status === 'pending') {
        acc[projectKey].pending += amount;
      } else if (expense.status === 'paid') {
        acc[projectKey].paid += amount;
      }
      
      return acc;
    }, {} as Record<string, {
      total: number;
      count: number;
      categories: Record<string, number>;
      costCenters: Record<string, number>;
      pending: number;
      paid: number;
    }>);

    // Expense category breakdown
    const expenseCategories = expenses.reduce((acc, expense) => {
      const category = expense.expense_category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + (Number(expense.amount) || 0);
      return acc;
    }, {} as Record<string, number>);

    // Cost center breakdown
    const costCenters = expenses.reduce((acc, expense) => {
      const costCenter = expense.cost_center || 'General';
      acc[costCenter] = (acc[costCenter] || 0) + (Number(expense.amount) || 0);
      return acc;
    }, {} as Record<string, number>);

    // Monthly data for trend analysis
    const monthlyData = activities.reduce((acc, activity) => {
      const monthKey = new Date(activity.transaction_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!acc[monthKey]) {
        acc[monthKey] = { income: 0, expenses: 0, receivables: 0, payables: 0 };
      }
      
      if (activity.activity_type === 'income' && activity.status === 'paid') {
        acc[monthKey].income += Number(activity.amount) || 0;
      } else if (activity.activity_type === 'expense') {
        acc[monthKey].expenses += Number(activity.amount) || 0;
      } else if (activity.activity_type === 'receivable') {
        acc[monthKey].receivables += Number(activity.amount) || 0;
      } else if (activity.activity_type === 'payable') {
        acc[monthKey].payables += Number(activity.amount) || 0;
      }
      return acc;
    }, {} as Record<string, { income: number; expenses: number; receivables: number; payables: number }>);

    const typeDistribution = activities.reduce((acc, activity) => {
      acc[activity.activity_type] = (acc[activity.activity_type] || 0) + (Number(activity.amount) || 0);
      return acc;
    }, {} as Record<string, number>);

    // Cash flow analysis
    const cashFlow = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (cashFlow / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpenses,
      netProfit: cashFlow,
      profitMargin,
      pendingAmount,
      overdueAmount,
      // Receivables metrics
      receivables: {
        total: totalReceivablesOutstanding,
        overdue: overdueReceivables,
        currentMonth: currentMonthReceivables,
        count: receivables.length
      },
      // Payables metrics
      payables: {
        total: totalPayablesOutstanding,
        overdue: overduePayables,
        currentMonth: currentMonthPayables,
        count: payables.length
      },
      // Expenses metrics with project tracking
      expenses: {
        total: totalExpensesAmount,
        currentMonth: currentMonthExpenses,
        pending: pendingExpenses,
        count: expenses.length,
        byProject: Object.entries(projectExpenses).map(([project, data]) => ({
          project,
          ...data,
          categories: Object.entries(data.categories).map(([category, amount]) => ({
            category,
            amount
          })),
          costCenters: Object.entries(data.costCenters).map(([center, amount]) => ({
            center,
            amount
          }))
        })),
        byCategory: Object.entries(expenseCategories).map(([category, amount]) => ({
          category,
          amount
        })),
        byCostCenter: Object.entries(costCenters).map(([center, amount]) => ({
          center,
          amount
        }))
      },
      monthlyData: Object.entries(monthlyData).map(([month, data]) => ({
        month,
        ...data
      })),
      typeDistribution: Object.entries(typeDistribution).map(([type, amount]) => ({
        name: type.charAt(0).toUpperCase() + type.slice(1),
        value: amount
      }))
    };
  }, [activities]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        </div>

        <div className="relative z-10 p-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  Financial Analytics 📈
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Comprehensive insights into your business performance
                </p>
              </div>
              
              {/* Filter Controls */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From:</label>
                  <input
                    type="date"
                    value={chartFilters.date_from}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">To:</label>
                  <input
                    type="date"
                    value={chartFilters.date_to}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={chartFilters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 font-medium"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => {
                    fetchChartData();
                    fetchActivities();
                  }}
                  disabled={chartsLoading || activitiesLoading}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {(chartsLoading || activitiesLoading) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Refreshing...
                    </>
                  ) : (
                    <>
                      🔄 Refresh Data
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Company Performance Overview */}
          <div className="mb-12">
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    📊 Company Performance Overview
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Key performance indicators and business health metrics
                  </p>
                </div>
                <div className="mt-4 lg:mt-0">
                  <button
                    onClick={() => {
                      fetchActivities();
                      fetchChartData();
                    }}
                    disabled={activitiesLoading || chartsLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center gap-2"
                  >
                    {(activitiesLoading || chartsLoading) ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Refreshing...
                      </>
                    ) : (
                      <>
                        🔄 Refresh Data
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {(activitiesLoading || chartsLoading) && (
              <div className="text-center py-12">
                <div className="inline-flex items-center gap-3 text-lg text-gray-600 dark:text-gray-400">
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Loading analytics data...
                </div>
              </div>
            )}

            {/* Core Business Metrics */}
            {!activitiesLoading && (
              <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl">💰</div>
                    <div className="text-right">
                      <div className="text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(analytics.totalIncome, DEFAULT_CURRENCY)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    From all paid transactions
                  </div>
                </div>

                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl">📈</div>
                    <div className="text-right">
                      <div className={`text-xl lg:text-2xl font-bold ${analytics.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(analytics.netProfit, DEFAULT_CURRENCY)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Net Profit</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Revenue minus expenses
                  </div>
                </div>

                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl">📊</div>
                    <div className="text-right">
                      <div className={`text-xl lg:text-2xl font-bold ${analytics.profitMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {analytics.profitMargin.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Profit Margin</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Profitability percentage
                  </div>
                </div>

                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl">🎯</div>
                    <div className="text-right">
                      <div className="text-xl lg:text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {Math.min(100, Math.max(0, Math.round(analytics.profitMargin + 50)))}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Health Score</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Overall business health
                  </div>
                </div>
              </div>
            )}

            {/* Receivables Performance Metrics */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                💳 Receivables Performance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Outstanding"
                  value={formatCurrency(analytics.receivables.total, DEFAULT_CURRENCY)}
                  subtitle="Outstanding receivables"
                  icon={<span className="text-lg">💰</span>}
                  color="blue"
                />
                <StatCard
                  title="Overdue Amount"
                  value={formatCurrency(analytics.receivables.overdue, DEFAULT_CURRENCY)}
                  subtitle="Past due amounts"
                  icon={<span className="text-lg">⚠️</span>}
                  color="red"
                />
                <StatCard
                  title="Current Month"
                  value={formatCurrency(analytics.receivables.currentMonth, DEFAULT_CURRENCY)}
                  subtitle="This month's receivables"
                  icon={<span className="text-lg">📅</span>}
                  color="green"
                />
                <StatCard
                  title="Total Count"
                  value={analytics.receivables.count.toString()}
                  subtitle="Number of receivables"
                  icon={<span className="text-lg">📋</span>}
                  color="purple"
                />
              </div>
            </div>

            {/* Payables Performance Metrics */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                💳 Payables Performance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Outstanding"
                  value={formatCurrency(analytics.payables.total, DEFAULT_CURRENCY)}
                  subtitle="Outstanding payables"
                  icon={<span className="text-lg">💳</span>}
                  color="red"
                />
                <StatCard
                  title="Overdue Amount"
                  value={formatCurrency(analytics.payables.overdue, DEFAULT_CURRENCY)}
                  subtitle="Past due amounts"
                  icon={<span className="text-lg">⚠️</span>}
                  color="red"
                />
                <StatCard
                  title="Current Month"
                  value={formatCurrency(analytics.payables.currentMonth, DEFAULT_CURRENCY)}
                  subtitle="This month's payables"
                  icon={<span className="text-lg">📅</span>}
                  color="yellow"
                />
                <StatCard
                  title="Total Count"
                  value={analytics.payables.count.toString()}
                  subtitle="Number of payables"
                  icon={<span className="text-lg">📋</span>}
                  color="purple"
                />
              </div>
            </div>

            {/* Expenses Performance Metrics */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                🧾 Expenses Performance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Expenses"
                  value={formatCurrency(analytics.expenses.total, DEFAULT_CURRENCY)}
                  subtitle="All recorded expenses"
                  icon={<span className="text-lg">🧾</span>}
                  color="red"
                />
                <StatCard
                  title="This Month"
                  value={formatCurrency(analytics.expenses.currentMonth, DEFAULT_CURRENCY)}
                  subtitle="Current month expenses"
                  icon={<span className="text-lg">📅</span>}
                  color="yellow"
                />
                <StatCard
                  title="Pending Approval"
                  value={formatCurrency(analytics.expenses.pending, DEFAULT_CURRENCY)}
                  subtitle="Awaiting approval"
                  icon={<span className="text-lg">⏰</span>}
                  color="blue"
                />
                <StatCard
                  title="Total Count"
                  value={analytics.expenses.count.toString()}
                  subtitle="Number of expenses"
                  icon={<span className="text-lg">📋</span>}
                  color="purple"
                />
              </div>
            </div>

            {/* Project Tracking Analytics */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                🎯 Project & Expense Tracking
              </h3>
              
              {/* Project-wise Expense Breakdown */}
              {analytics.expenses.byProject && analytics.expenses.byProject.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    📊 Expenses by Project
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analytics.expenses.byProject.slice(0, 6).map((project, index) => (
                      <div key={index} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-xl p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold text-gray-900 dark:text-white truncate">
                            {project.project}
                          </h5>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {project.count} items
                          </span>
                        </div>
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                          {formatCurrency(project.total, DEFAULT_CURRENCY)}
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>Pending: {formatCurrency(project.pending, DEFAULT_CURRENCY)}</span>
                          <span>Paid: {formatCurrency(project.paid, DEFAULT_CURRENCY)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expense Categories */}
              {analytics.expenses.byCategory && analytics.expenses.byCategory.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    📋 Expenses by Category
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {analytics.expenses.byCategory.slice(0, 8).map((category, index) => (
                      <div key={index} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-lg p-3 text-center shadow-sm">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 truncate">
                          {category.category}
                        </div>
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {formatCurrency(category.amount, DEFAULT_CURRENCY)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost Centers */}
              {analytics.expenses.byCostCenter && analytics.expenses.byCostCenter.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    🏢 Expenses by Cost Center
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {analytics.expenses.byCostCenter.slice(0, 8).map((center, index) => (
                      <div key={index} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-lg p-3 text-center shadow-sm">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 truncate">
                          {center.center}
                        </div>
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(center.amount, DEFAULT_CURRENCY)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Performance Charts Section */}
          <div className="mt-12">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                📈 Performance Charts & Insights
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Visual analytics for strategic business decisions
              </p>
            </div>

            {/* Performance Charts */}
            {activitiesLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 shadow-xl h-96">
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Monthly Revenue Trend */}
                <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-blue-500/5"></div>
                  <div className="relative p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        💰 Monthly Revenue Trend
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Revenue from paid transactions over time
                      </p>
                    </div>
                    <LineChart
                      data={analytics.monthlyData.map(item => ({
                        label: item.month,
                        value: item.income,
                        color: 'stroke-green-500'
                      }))}
                      height={280}
                    />
                  </div>
                </div>

                {/* Monthly Expenses Trend */}
                <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5"></div>
                  <div className="relative p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        🧾 Monthly Expenses Trend
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Expense patterns and spending analysis
                      </p>
                    </div>
                    <LineChart
                      data={analytics.monthlyData.map(item => ({
                        label: item.month,
                        value: item.expenses,
                        color: 'stroke-red-500'
                      }))}
                      height={280}
                    />
                  </div>
                </div>

                {/* Activity Type Distribution */}
                <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
                  <div className="relative p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        📊 Activity Distribution
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Financial activity breakdown by type and amount
                      </p>
                    </div>
                    
                    {/* Activity Distribution Cards */}
                    <div className="space-y-4">
                      {analytics.typeDistribution.map((item, index) => {
                        const total = analytics.typeDistribution.reduce((sum, d) => sum + d.value, 0);
                        const percentage = total > 0 ? (item.value / total) * 100 : 0;
                        const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500'];
                        
                        return (
                          <div key={index} className="bg-white/30 dark:bg-gray-700/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <div className={`w-4 h-4 rounded-full ${colors[index % colors.length]}`}></div>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {item.name}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-gray-900 dark:text-white">
                                  {formatCurrency(item.value, DEFAULT_CURRENCY)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {percentage.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${colors[index % colors.length]} transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {analytics.typeDistribution.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400">No activity data available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cash Flow Analysis */}
                <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5"></div>
                  <div className="relative p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        💹 Cash Flow Analysis
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Monthly net cash flow (income - expenses)
                      </p>
                    </div>
                    <LineChart
                      data={analytics.monthlyData.map(item => ({
                        label: item.month,
                        value: item.income - item.expenses,
                        color: item.income - item.expenses >= 0 ? 'stroke-green-500' : 'stroke-red-500'
                      }))}
                      height={280}
                    />
                  </div>
                </div>

                {/* Receivables vs Payables */}
                <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5"></div>
                  <div className="relative p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        ⚖️ Receivables Overview
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Monthly receivables trend analysis
                      </p>
                    </div>
                    <LineChart
                      data={analytics.monthlyData.map(item => ({
                        label: item.month,
                        value: item.receivables,
                        color: 'stroke-blue-500'
                      }))}
                      height={280}
                    />
                  </div>
                </div>

                {/* Business Health Dashboard */}
                <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5"></div>
                  <div className="relative p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        🎯 Business Health Dashboard
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Key performance indicators and financial health
                      </p>
                    </div>
                    
                    {/* Health Score Card */}
                    <div className="bg-white/40 dark:bg-gray-700/40 rounded-lg p-6 mb-4">
                      <div className="text-center">
                        <div className={`text-5xl font-bold mb-2 ${
                          analytics.profitMargin > 20 ? 'text-green-600' :
                          analytics.profitMargin > 0 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {Math.min(100, Math.max(0, Math.round(analytics.profitMargin + 50)))}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 font-semibold mb-2">Health Score</p>
                        <p className={`text-sm font-medium ${
                          analytics.profitMargin > 20 ? 'text-green-600' :
                          analytics.profitMargin > 10 ? 'text-blue-600' :
                          analytics.profitMargin > 0 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {analytics.profitMargin > 20 ? 'Excellent Performance' :
                           analytics.profitMargin > 10 ? 'Good Performance' :
                           analytics.profitMargin > 0 ? 'Stable Performance' : 'Needs Attention'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-white/30 dark:bg-gray-700/30 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Profit Margin</span>
                          <span className={`font-semibold ${analytics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {analytics.profitMargin.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-white/30 dark:bg-gray-700/30 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Net Profit</span>
                          <span className={`font-semibold ${analytics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(analytics.netProfit, DEFAULT_CURRENCY)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-white/30 dark:bg-gray-700/30 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</span>
                          <span className="font-semibold text-blue-600">
                            {formatCurrency(analytics.totalIncome, DEFAULT_CURRENCY)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-white/30 dark:bg-gray-700/30 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</span>
                          <span className="font-semibold text-red-600">
                            {formatCurrency(analytics.totalExpenses, DEFAULT_CURRENCY)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Financial Charts Section */}
          <div className="mt-12">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                🔍 Advanced Financial Insights
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Deep dive into invoice patterns and client relationships
              </p>
            </div>

            {/* Charts Section */}
            {chartsLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 shadow-xl h-96">
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Invoice vs Payments Chart */}
                <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5"></div>
                  <div className="relative p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Invoice vs Payments 💰
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Monthly invoice generation vs payment collection
                      </p>
                    </div>
                    <InvoicePaymentChart 
                      data={chartData?.invoice_payments || []} 
                      height={300}
                      className="rounded-xl overflow-hidden"
                    />
                  </div>
                </div>

                {/* 2. Outstanding Receivables per Client */}
                <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5"></div>
                  <div className="relative p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Top Client Receivables 🏢
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Outstanding amounts by client (highest to lowest)
                      </p>
                    </div>
                    <ClientReceivablesChart 
                      data={chartData?.client_receivables || []} 
                      height={300}
                      className="rounded-xl overflow-hidden"
                    />
                  </div>
                </div>

                {/* 3. Invoice Status Overview */}
                <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5"></div>
                  <div className="relative p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Invoice Status Health 📊
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Distribution of invoice statuses by amount
                      </p>
                    </div>
                    <div className="flex items-center justify-center">
                      <InvoiceStatusChart 
                        data={chartData?.invoice_status || []} 
                        size={280}
                        className="rounded-xl overflow-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Receivables Aging Report */}
                <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-pink-500/5"></div>
                  <div className="relative p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Receivables Aging ⏰
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Age distribution of outstanding receivables
                      </p>
                    </div>
                    <ReceivablesAgingChart 
                      data={chartData?.receivables_aging || []} 
                      height={300}
                      className="rounded-xl overflow-hidden"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Invoice and Quotation Summary Cards */}
          {financialSummary && (
            <div className="mt-12">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  📄 Invoice & Quotation Summary
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Overview of billing and quotation performance
                </p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-xl p-3 text-center shadow-lg">
                  <div className="text-lg lg:text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(financialSummary.total_receivables, DEFAULT_CURRENCY)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Receivables</div>
                </div>
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-xl p-3 text-center shadow-lg">
                  <div className="text-lg lg:text-xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(financialSummary.overdue_amount, DEFAULT_CURRENCY)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Overdue Amount</div>
                </div>
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-xl p-3 text-center shadow-lg">
                  <div className="text-lg lg:text-xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(financialSummary.this_month_revenue, DEFAULT_CURRENCY)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">This Month Revenue</div>
                </div>
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-xl p-3 text-center shadow-lg">
                  <div className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                    {financialSummary.invoice_count}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Invoices</div>
                </div>
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-xl p-3 text-center shadow-lg">
                  <div className="text-lg lg:text-xl font-bold text-green-600 dark:text-green-400">
                    {financialSummary.paid_invoice_count}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Paid Invoices</div>
                </div>
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-xl p-3 text-center shadow-lg">
                  <div className="text-lg lg:text-xl font-bold text-red-600 dark:text-red-400">
                    {financialSummary.overdue_invoice_count}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Overdue Invoices</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
