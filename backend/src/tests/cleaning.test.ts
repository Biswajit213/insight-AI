import request from 'supertest';
import { createApp } from '../app';
import { DataProfilerService } from '../services/data-profiler.service';
import { PIIDetectorService } from '../services/pii-detector.service';
import { DataCleaningEngineService } from '../services/data-cleaning-engine.service';
import { CleaningVersionService } from '../services/cleaning-version.service';
import { DatasetService } from '../services/dataset.service';

const app = createApp();

describe('Data Cleaning & Quality Engine Suite', () => {
  const sampleHeaders = ['ID', 'Name', 'Email', 'Revenue', 'Region', 'JoinDate'];
  const sampleRows: Record<string, unknown>[] = [
    { ID: '01', Name: 'Alex Naskar', Email: 'alex@example.com', Revenue: '$1,200', Region: ' North ', JoinDate: '2025-08-14' },
    { ID: '02', Name: '', Email: 'invalid-email', Revenue: 'NULL', Region: 'north', JoinDate: '14/08/2025' },
    { ID: '03', Name: 'Bob Smith', Email: 'bob@example.com', Revenue: '$1,400', Region: 'NORTH', JoinDate: '2025-08-15' },
    { ID: '01', Name: 'Alex Naskar', Email: 'alex@example.com', Revenue: '$1,200', Region: ' North ', JoinDate: '2025-08-14' }, // Duplicate row
    { ID: '05', Name: 'Charlie Brown', Email: 'charlie@gmail.com', Revenue: '$98,000', Region: 'North Region', JoinDate: '2025-08-16' }, // Outlier revenue
  ];

  beforeEach(() => {
    // Populate mock dataset in memory for test API calls
    DatasetService.setMemoryDataset('sample-ds', {
      dataset: {
        id: 'sample-ds',
        user_id: 'test-user-id',
        name: 'Sales_Data_2025',
        original_filename: 'Sales_2025.csv',
        file_type: 'csv',
        file_size: 1024,
        row_count: sampleRows.length,
        column_count: sampleHeaders.length,
        status: 'ready',
        data_quality_score: 86,
        storage_path: 'datasets/test-user-id/sample-ds.csv',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      columns: sampleHeaders.map((h) => ({
        id: h,
        dataset_id: 'sample-ds',
        column_name: h,
        data_type: 'string',
        nullable: true,
        unique_values: 5,
        missing_values: 1,
        created_at: new Date().toISOString(),
      })),
      rows: sampleRows,
    });
  });

  test('DataProfilerService should accurately profile columns and compute dynamic quality scores', () => {
    const profiler = DataProfilerService.profileDataset('sample-ds', 'v1', sampleHeaders, sampleRows);
    expect(profiler.scores.overallScore).toBeGreaterThan(0);
    expect(profiler.scores.overallScore).toBeLessThanOrEqual(100);
    expect(profiler.counts.duplicates).toBe(1);
    expect(profiler.issues.length).toBeGreaterThan(0);
    expect(profiler.profiles.length).toBe(6);
  });

  test('PIIDetectorService should detect Email PII and mask values correctly', () => {
    const piiType = PIIDetectorService.detectColumnPII('Email', ['john@gmail.com', 'alice@company.org']);
    expect(piiType).toBe('EMAIL');

    const masked = PIIDetectorService.maskValue('biswajit@gmail.com', 'EMAIL');
    expect(masked).toBe('b***t@gmail.com');
  });

  test('DataCleaningEngineService should execute imputation, duplicate removal, and category standardization', () => {
    const steps = [
      { operationType: 'REMOVE_DUPLICATES', parameters: { strategy: 'keep_first' } },
      { operationType: 'IMPUTE_MISSING', columnName: 'Revenue', parameters: { strategy: 'median' } },
      { operationType: 'STANDARDIZE_CATEGORY', columnName: 'Region', parameters: { target: 'North' } },
      { operationType: 'CAST_TYPE', columnName: 'Revenue', parameters: { targetType: 'NUMBER' } },
    ];

    const cleaned = DataCleaningEngineService.applyPipeline(sampleHeaders, sampleRows, steps);
    expect(cleaned.length).toBe(4); // Duplicate removed
    expect(cleaned[0].Region).toBe('North');
    expect(typeof cleaned[0].Revenue).toBe('number');
  });

  test('CleaningVersionService should track dataset versions and rollback', () => {
    const v1 = CleaningVersionService.getActiveVersion('sample-ds');
    expect(v1.versionNumber).toBe(1);

    const exec = CleaningVersionService.executeCleaningPipeline('test-user-id', 'sample-ds', [
      { operationType: 'REMOVE_DUPLICATES' },
    ]);

    expect(exec.newVersion.versionNumber).toBe(2);
    expect(exec.newScore).toBeDefined();

    const restored = CleaningVersionService.rollbackToVersion('sample-ds', v1.id);
    expect(restored.versionNumber).toBe(1);
  });

  test('API Endpoint: GET /api/v1/datasets/sample-ds/profile should return 200 with auth header', async () => {
    const response = await request(app)
      .get('/api/v1/datasets/sample-ds/profile')
      .set('x-test-user-id', 'test-user-id');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('API Endpoint: POST /api/v1/datasets/sample-ds/clean/preview should return before vs after diff', async () => {
    const response = await request(app)
      .post('/api/v1/datasets/sample-ds/clean/preview')
      .set('x-test-user-id', 'test-user-id')
      .send({
        steps: [{ operationType: 'REMOVE_DUPLICATES' }],
      });

    expect(response.status).toBe(200);
    expect(response.body.data.rowsAffected).toBeDefined();
  });
});
