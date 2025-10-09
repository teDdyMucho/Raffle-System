import React, { useState } from 'react';
import { BarChart3, Calendar, Download, TrendingUp, DollarSign, FileText, Ticket, Users } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const Reports = () => {
  const { show } = useToast();
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('last_7_days');

  // Mock report data
  const reportData = {
    overview: {
      totalRevenue: 17280,
      totalTickets: 3456,
      totalUsers: 1247,
      activeRaffles: 3,
      completedRaffles: 12,
      conversionRate: 68.5,
      avgTicketPrice: 7.2,
      avgUserSpent: 13.85
    },
    revenueByMonth: [
      { month: 'Oct 2023', revenue: 8450, tickets: 1205 },
      { month: 'Nov 2023', revenue: 12300, tickets: 1756 },
      { month: 'Dec 2023', revenue: 15600, tickets: 2234 },
      { month: 'Jan 2024', revenue: 17280, tickets: 2456 }
    ],
    topRaffles: [
      { name: 'iPhone 15 Pro Giveaway', revenue: 3715, tickets: 743, participants: 743 },
      { name: 'MacBook Air M3', revenue: 3648, tickets: 456, participants: 456 },
      { name: 'Gaming Setup Bundle', revenue: 2340, tickets: 234, participants: 234 },
      { name: 'iPad Pro 12.9"', revenue: 5600, tickets: 800, participants: 800 },
      { name: 'AirPods Pro 2', revenue: 1680, tickets: 240, participants: 240 }
    ],
    userStats: [
      { segment: 'High Value (>$50)', count: 156, percentage: 12.5, revenue: 8640 },
      { segment: 'Medium Value ($20-$50)', count: 423, percentage: 33.9, revenue: 6340 },
      { segment: 'Low Value (<$20)', count: 668, percentage: 53.6, revenue: 2300 }
    ]
  };

  const handleGenerate = () => {
    const typeLabel = reportTypes.find(r => r.value === reportType)?.label || reportType;
    const rangeLabel = dateRanges.find(r => r.value === dateRange)?.label || dateRange;
    show(`Generating ${typeLabel} for ${rangeLabel}...`, { type: 'info' });
    // In a real app, trigger API download or query here
  };

  const exportReport = (format) => {
    // Mock export functionality
    console.log(`Exporting ${reportType} report as ${format}`);
    show(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report exported as ${format.toUpperCase()}!`, { type: 'success' });
  };

  const dateRanges = [
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last3months', label: 'Last 3 Months' },
    { value: 'last6months', label: 'Last 6 Months' },
    { value: 'lastyear', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const reportTypes = [
    { value: 'overview', label: 'Overview Report' },
    { value: 'revenue', label: 'Revenue Report' },
    { value: 'users', label: 'User Analytics' },
    { value: 'raffles', label: 'Raffle Performance' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Generate detailed reports and export data</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => exportReport('csv')}
            className="btn-secondary flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => exportReport('excel')}
            className="btn-primary flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
            >
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
            >
              {dateRanges.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button onClick={handleGenerate} className="w-full btn-primary flex items-center justify-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            ${reportData.overview.totalRevenue.toLocaleString()}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">Total Revenue</p>
          <div className="mt-2 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">+15.3%</span>
          </div>
        </div>

        <div className="card text-center">
          <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <Ticket className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {reportData.overview.totalTickets.toLocaleString()}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">Tickets Sold</p>
          <div className="mt-2 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">+8.2%</span>
          </div>
        </div>

        <div className="card text-center">
          <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {reportData.overview.totalUsers.toLocaleString()}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">Total Users</p>
          <div className="mt-2 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">+12.5%</span>
          </div>
        </div>

        <div className="card text-center">
          <div className="bg-orange-100 dark:bg-orange-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-orange-600 dark:text-orange-400 font-bold text-lg">%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {reportData.overview.conversionRate}%
          </h3>
          <p className="text-gray-600 dark:text-gray-400">Conversion Rate</p>
          <div className="mt-2 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">+3.1%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Revenue Trend</h2>
            <button onClick={() => setReportType('revenue')} className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm">
              View Details
            </button>
          </div>

          <div className="space-y-4">
            {reportData.revenueByMonth.map((month, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{month.month}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{month.tickets} tickets sold</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    ${month.revenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ${(month.revenue / month.tickets).toFixed(2)} avg
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Raffles */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Top Performing Raffles</h2>
            <button onClick={() => setReportType('raffles')} className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm">
              View All
            </button>
          </div>

          <div className="space-y-4">
            {reportData.topRaffles.map((raffle, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{raffle.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {raffle.participants} participants
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">
                    ${raffle.revenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {raffle.tickets} tickets
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Segmentation */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">User Segmentation</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reportData.userStats.map((segment, index) => (
            <div key={index} className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {segment.segment}
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{segment.count}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">users ({segment.percentage}%)</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    ${segment.revenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">total revenue</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Key Performance Indicators</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Average Ticket Price</span>
              <span className="font-bold text-gray-900 dark:text-white">
                ${reportData.overview.avgTicketPrice}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Average User Spending</span>
              <span className="font-bold text-gray-900 dark:text-white">
                ${reportData.overview.avgUserSpent}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Active Raffles</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {reportData.overview.activeRaffles}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Completed Raffles</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {reportData.overview.completedRaffles}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Export Options</h2>
          
          <div className="space-y-4">
            <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <div className="flex items-center mb-3">
                <FileText className="w-5 h-5 text-gray-500 mr-2" />
                <h3 className="font-medium text-gray-900 dark:text-white">Detailed Reports</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Export comprehensive reports with all raffle data, user information, and financial metrics.
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => exportReport('pdf')}
                  className="btn-secondary text-sm"
                >
                  PDF Report
                </button>
                <button
                  onClick={() => exportReport('csv')}
                  className="btn-secondary text-sm"
                >
                  CSV Data
                </button>
              </div>
            </div>

            <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <div className="flex items-center mb-3">
                <Calendar className="w-5 h-5 text-gray-500 mr-2" />
                <h3 className="font-medium text-gray-900 dark:text-white">Scheduled Reports</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Set up automated reports to be sent to your email weekly or monthly.
              </p>
              <button onClick={() => show('Scheduling setup coming soon.', { type: 'info' })} className="btn-primary text-sm">
                Setup Schedule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
