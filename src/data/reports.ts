import type { Report } from '../types';

export const reports: Report[] = [];

export const reportSections = [
  { id: 's1', label: 'Executive Summary', description: 'AI-generated overview of key findings' },
  { id: 's2', label: 'Revenue Analysis', description: 'Detailed revenue breakdown and trends' },
  { id: 's3', label: 'Product Performance', description: 'Top/bottom performing products' },
  { id: 's4', label: 'Regional Breakdown', description: 'Performance by region and geography' },
  { id: 's5', label: 'Customer Insights', description: 'Customer behavior and segmentation' },
  { id: 's6', label: 'Anomaly Detection', description: 'Unusual patterns and outliers' },
  { id: 's7', label: 'AI Forecasts', description: 'Predictive analytics and projections' },
  { id: 's8', label: 'Recommendations', description: 'Actionable next steps' },
];
