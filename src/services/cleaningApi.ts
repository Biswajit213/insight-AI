import type {
  DataQualityScanResult,
  DataQualityIssueItem,
  DetailedColumnProfile,
  DatasetVersionItem,
  CleaningOperationRecord,
  ValidationReport,
  AICleaningSuggestion,
  PreviewCleanResult,
  CleanExecutionResult,
  ValidationRuleItem,
} from '../types/cleaning';

const API_BASE_URL = '/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('insightai_token') || '';
  const email = localStorage.getItem('insightai_user_email') || '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(email ? { 'x-user-email': email } : {}),
    ...(options?.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  const json = await response.json();
  if (!response.ok || json.success === false) {
    throw new Error(json.message || json.error?.message || 'API Request failed');
  }
  return json.data as T;
}

export class CleaningApiClient {
  public static async getDatasetProfile(datasetId: string): Promise<DetailedColumnProfile[]> {
    return fetchJson<DetailedColumnProfile[]>(`/datasets/${datasetId}/profile`);
  }

  public static async runQualityScan(datasetId: string, versionId?: string): Promise<DataQualityScanResult> {
    return fetchJson<DataQualityScanResult>(`/datasets/${datasetId}/quality-scan`, {
      method: 'POST',
      body: JSON.stringify({ versionId }),
    });
  }

  public static async getIssues(
    datasetId: string,
    params?: { issueType?: string; severity?: string }
  ): Promise<{ issues: DataQualityIssueItem[]; counts: any; scores: any }> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchJson<{ issues: DataQualityIssueItem[]; counts: any; scores: any }>(
      `/datasets/${datasetId}/issues${query ? `?${query}` : ''}`
    );
  }

  public static async previewClean(
    datasetId: string,
    steps: { operationType: string; columnName?: string; parameters?: Record<string, unknown> }[]
  ): Promise<PreviewCleanResult> {
    return fetchJson<PreviewCleanResult>(`/datasets/${datasetId}/clean/preview`, {
      method: 'POST',
      body: JSON.stringify({ steps }),
    });
  }

  public static async cleanDataset(
    datasetId: string,
    steps: { operationType: string; columnName?: string; parameters?: Record<string, unknown> }[],
    label?: string
  ): Promise<CleanExecutionResult> {
    return fetchJson<CleanExecutionResult>(`/datasets/${datasetId}/clean`, {
      method: 'POST',
      body: JSON.stringify({ steps, label }),
    });
  }

  public static async validateDataset(datasetId: string, versionId?: string): Promise<ValidationReport> {
    return fetchJson<ValidationReport>(`/datasets/${datasetId}/validate`, {
      method: 'POST',
      body: JSON.stringify({ versionId }),
    });
  }

  public static async getCleaningHistory(datasetId: string): Promise<CleaningOperationRecord[]> {
    return fetchJson<CleaningOperationRecord[]>(`/datasets/${datasetId}/cleaning-history`);
  }

  public static async rollbackVersion(datasetId: string, versionId: string): Promise<DatasetVersionItem> {
    return fetchJson<DatasetVersionItem>(`/datasets/${datasetId}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ versionId }),
    });
  }

  public static async getVersions(datasetId: string): Promise<DatasetVersionItem[]> {
    return fetchJson<DatasetVersionItem[]>(`/datasets/${datasetId}/versions`);
  }

  public static async getAICleaningSuggestions(datasetId: string): Promise<AICleaningSuggestion[]> {
    return fetchJson<AICleaningSuggestion[]>(`/datasets/${datasetId}/ai-cleaning-suggestions`, {
      method: 'POST',
    });
  }

  public static async addCustomRule(
    datasetId: string,
    rule: Omit<ValidationRuleItem, 'id' | 'createdAt' | 'datasetId' | 'isEnabled'>
  ): Promise<ValidationRuleItem> {
    return fetchJson<ValidationRuleItem>(`/datasets/${datasetId}/custom-rule`, {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  }

  public static async getQualityReport(datasetId: string): Promise<any> {
    return fetchJson<any>(`/datasets/${datasetId}/report`);
  }
}
