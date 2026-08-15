import { AnalyticsService } from '../services/analytics.service';
import { DataQualityService } from '../services/data-quality.service';

describe('Analytics & Data Quality Engine', () => {
  const sampleRows = [
    { product: 'Laptop', region: 'North', revenue: 1000 },
    { product: 'Laptop', region: 'South', revenue: 1500 },
    { product: 'Phone', region: 'North', revenue: 800 },
    { product: 'Phone', region: 'West', revenue: 900 },
    { product: 'Tablet', region: 'East', revenue: 600 },
  ];

  it('should accurately compute SUM aggregation', () => {
    const sum = AnalyticsService.calculateAggregation(sampleRows, 'revenue', 'sum');
    expect(sum).toBe(4800);
  });

  it('should accurately compute AVG aggregation', () => {
    const avg = AnalyticsService.calculateAggregation(sampleRows, 'revenue', 'avg');
    expect(avg).toBe(960);
  });

  it('should accurately compute Group-By revenue sums', () => {
    const grouped = AnalyticsService.calculateGroupBy(sampleRows, 'product', 'revenue', 'sum');
    expect(grouped.length).toBe(3);
    expect(grouped[0].key).toBe('Laptop');
    expect(grouped[0].value).toBe(2500);
  });

  it('should detect statistical anomalies using Z-score', () => {
    const rowsWithAnomaly = [
      ...sampleRows,
      { product: 'Enterprise Server', region: 'Global', revenue: 50000 }, // Huge spike
    ];
    const anomalies = AnalyticsService.detectAnomalies(rowsWithAnomaly, 'revenue');
    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies[0].actual).toBe(50000);
  });

  it('should calculate data quality report completeness and score', () => {
    const headers = ['product', 'region', 'revenue'];
    const quality = DataQualityService.calculateQualityReport(headers, sampleRows);
    expect(quality.completeness).toBe(100);
    expect(quality.overallScore).toBeGreaterThanOrEqual(90);
  });
});
