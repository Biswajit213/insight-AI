import type { KPICard, SalesDataPoint, RevenueTrendPoint, TopProduct, RecentAnalysis, Notification } from '../types';

export const kpiCards: KPICard[] = [
  {
    id: 'revenue',
    title: 'Total Revenue',
    value: '$2.48M',
    rawValue: 2480000,
    change: 15.8,
    changeLabel: 'vs previous period',
    trend: 'up',
    icon: 'DollarSign',
    color: 'blue',
    sparkData: [820, 940, 880, 1020, 1100, 980, 1250, 1380, 1420, 1590, 1740, 1980],
  },
  {
    id: 'sales',
    title: 'Total Sales',
    value: '48,294',
    rawValue: 48294,
    change: 12.4,
    changeLabel: 'vs previous period',
    trend: 'up',
    icon: 'ShoppingCart',
    color: 'emerald',
    sparkData: [3200, 3800, 3500, 4100, 4400, 3900, 4800, 5200, 5600, 6100, 6500, 7200],
  },
  {
    id: 'customers',
    title: 'Active Customers',
    value: '12,849',
    rawValue: 12849,
    change: 8.7,
    changeLabel: 'vs previous period',
    trend: 'up',
    icon: 'Users',
    color: 'violet',
    sparkData: [8200, 8600, 8900, 9200, 9600, 10100, 10800, 11200, 11600, 12000, 12400, 12849],
  },
  {
    id: 'conversion',
    title: 'Conversion Rate',
    value: '7.82%',
    rawValue: 7.82,
    change: 2.1,
    changeLabel: 'vs previous period',
    trend: 'up',
    icon: 'TrendingUp',
    color: 'amber',
    sparkData: [5.2, 5.8, 6.1, 5.9, 6.4, 6.8, 7.0, 7.2, 7.4, 7.6, 7.7, 7.82],
  },
];

export const salesData: SalesDataPoint[] = [
  { month: 'Jan', north: 420, south: 380, east: 310, west: 290 },
  { month: 'Feb', north: 480, south: 420, east: 350, west: 320 },
  { month: 'Mar', north: 560, south: 510, east: 430, west: 390 },
  { month: 'Apr', north: 520, south: 480, east: 400, west: 360 },
  { month: 'May', north: 610, south: 570, east: 480, west: 430 },
  { month: 'Jun', north: 590, south: 550, east: 460, west: 415 },
  { month: 'Jul', north: 680, south: 620, east: 530, west: 490 },
  { month: 'Aug', north: 720, south: 660, east: 570, west: 520 },
];

export const revenueTrend: RevenueTrendPoint[] = [
  { year: '2020', actual: 8200000 },
  { year: '2021', actual: 12400000 },
  { year: '2022', actual: 18600000 },
  { year: '2023', actual: 24800000 },
  { year: '2024', actual: 31200000 },
  { year: '2025', actual: 38900000, predicted: 38900000 },
  { year: '2026', predicted: 47200000 },
  { year: '2027', predicted: 56800000 },
];

export const topProducts: TopProduct[] = [
  { rank: 1, name: 'MacBook Pro', category: 'Electronics', revenue: 482500, units: 1250, growth: 22.4, revenuePercent: 94 },
  { rank: 2, name: 'Wireless Headphones', category: 'Electronics', revenue: 298400, units: 4820, growth: 18.1, revenuePercent: 78 },
  { rank: 3, name: 'Smart Watch', category: 'Wearables', revenue: 241800, units: 3640, growth: 31.5, revenuePercent: 65 },
  { rank: 4, name: 'Mechanical Keyboard', category: 'Accessories', revenue: 184200, units: 6210, growth: 12.8, revenuePercent: 52 },
  { rank: 5, name: '4K Monitor', category: 'Electronics', revenue: 156900, units: 890, growth: 9.3, revenuePercent: 42 },
];

export const recentAnalyses: RecentAnalysis[] = [
  { id: 'ra1', name: 'Sales Performance Q3', dataset: 'Sales_2026.csv', date: new Date().toISOString(), status: 'completed', type: 'sales' },
  { id: 'ra2', name: 'Customer Segmentation', dataset: 'Customers.xlsx', date: new Date(Date.now() - 86400000).toISOString(), status: 'completed', type: 'customer' },
  { id: 'ra3', name: 'Regional Revenue Breakdown', dataset: 'Revenue.csv', date: new Date(Date.now() - 172800000).toISOString(), status: 'completed', type: 'revenue' },
  { id: 'ra4', name: 'Marketing Campaign ROI', dataset: 'Campaigns.xlsx', date: new Date(Date.now() - 259200000).toISOString(), status: 'completed', type: 'marketing' },
  { id: 'ra5', name: 'Inventory Optimization', dataset: 'Inventory.csv', date: new Date(Date.now() - 345600000).toISOString(), status: 'running', type: 'inventory' },
];

export const executiveSummaryPoints = [
  'Revenue increased 15.8% compared with the previous period, driven by Electronics and Wearables.',
  'The Electronics category generated the highest revenue, accounting for 62% of total sales.',
  'The North region is the fastest-growing market with 22.4% year-over-year growth.',
  'Customer churn decreased by 5.2%, reflecting improvements in retention strategies.',
  'Sales volume increased significantly during the final week of the month (+34%).',
  'AI forecast confidence is 92% for the next quarter\'s revenue trajectory.',
];

export const notifications: Notification[] = [
  { id: 'n1', title: 'Dataset processing completed', description: 'Sales_2026.csv has been successfully processed and is ready for analysis.', type: 'success', read: false, timestamp: new Date(Date.now() - 300000).toISOString() },
  { id: 'n2', title: '3 anomalies detected', description: 'Unusual patterns found in the Electronics category for October data.', type: 'warning', read: false, timestamp: new Date(Date.now() - 900000).toISOString() },
  { id: 'n3', title: 'AI report is ready', description: 'Your Executive Summary report has been generated and is ready to view.', type: 'info', read: false, timestamp: new Date(Date.now() - 1800000).toISOString() },
  { id: 'n4', title: 'Data quality warning', description: 'Customers.xlsx has 48 rows with missing email fields.', type: 'warning', read: true, timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'n5', title: 'New insight available', description: 'AI discovered a 23% revenue opportunity in the North region.', type: 'info', read: true, timestamp: new Date(Date.now() - 7200000).toISOString() },
];

export const anomalyChartData = [
  { day: 'Oct 1', value: 72 },
  { day: 'Oct 3', value: 68 },
  { day: 'Oct 5', value: 74 },
  { day: 'Oct 7', value: 70 },
  { day: 'Oct 9', value: 69 },
  { day: 'Oct 11', value: 73 },
  { day: 'Oct 12', value: 124 },
  { day: 'Oct 13', value: 71 },
  { day: 'Oct 15', value: 68 },
];
