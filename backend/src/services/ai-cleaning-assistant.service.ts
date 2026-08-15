import { mistralClient, MISTRAL_MODEL } from '../config/mistral';
import { PIIDetectorService } from './pii-detector.service';
import { AICleaningSuggestion, DataQualityIssueItem, DetailedColumnProfile } from '../types/cleaning';
import { logger } from '../utils/logger';

const SYSTEM_PROMPT = `You are InsightAI Data Quality Assistant.
Your task is to analyze dataset quality scan metrics and provide actionable data cleaning recommendations.

Rules:
1. Never request raw PII data.
2. Only recommend standard cleaning operations (IMPUTE_MISSING, REMOVE_DUPLICATES, STANDARDIZE_CATEGORY, CAST_TYPE, HANDLE_OUTLIERS, MASK_PII, REMOVE_COLUMN).
3. Be concise and practical.
4. Output structured json array of recommendations.`;

export class AICleaningAssistantService {
  public static async generateSuggestions(
    datasetName: string,
    rowCount: number,
    columnCount: number,
    issues: DataQualityIssueItem[],
    profiles: DetailedColumnProfile[]
  ): Promise<AICleaningSuggestion[]> {
    // 1. Sanitize profiles for PII safety
    const safeProfiles = profiles.map((p) => ({
      columnName: p.columnName,
      dataType: p.dataType,
      nullPercentage: p.nullPercentage,
      uniquePercentage: p.uniquePercentage,
      outlierCount: p.outlierCount,
      detectedPII: p.detectedPII || null,
      topValuesSample: p.topValues.slice(0, 3).map((tv) => (p.detectedPII ? PIIDetectorService.maskValue(tv.value, p.detectedPII) : tv.value)),
    }));

    const safeIssues = issues.slice(0, 10).map((iss) => ({
      issueType: iss.issueType,
      severity: iss.severity,
      columnName: iss.columnName,
      description: iss.description,
      percentage: iss.percentage,
    }));

    const prompt = `Analyze dataset quality profile for "${datasetName}" (${rowCount} rows, ${columnCount} columns).
    
Detected Issues Summary:
${JSON.stringify(safeIssues, null, 2)}

Column Metadata Summary:
${JSON.stringify(safeProfiles, null, 2)}

Generate a JSON object with key "suggestions" containing an array of objects:
{
  "id": "uuid string",
  "issueType": "MISSING_VALUE | DUPLICATE | INVALID_TYPE | OUTLIER | PII | CATEGORY_INCONSISTENCY",
  "severity": "critical | high | medium | low | info",
  "columnName": "column name or null",
  "problem": "concise description of the data defect",
  "recommendation": "specific recommended fix action",
  "confidence": number between 0.80 and 0.99,
  "actionParams": {
    "operationType": "IMPUTE_MISSING | REMOVE_DUPLICATES | STANDARDIZE_CATEGORY | CAST_TYPE | HANDLE_OUTLIERS | MASK_PII",
    "parameters": { "key": "value" }
  }
}`;

    try {
      const response = await mistralClient.chat.complete({
        model: MISTRAL_MODEL,
        responseFormat: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
      });

      const content = response.choices?.[0]?.message?.content;
      if (typeof content === 'string') {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
          return parsed.suggestions as AICleaningSuggestion[];
        }
      }
    } catch (err) {
      logger.warn('Mistral AI cleaning suggestions failed, using deterministic suggestions', { error: (err as Error).message });
    }

    // Fallback deterministic suggestions based on issues array
    return issues.slice(0, 5).map((issue) => {
      let confidence = 0.92;
      if (issue.percentage > 10) confidence = 0.96;

      return {
        id: crypto.randomUUID(),
        issueType: issue.issueType,
        severity: issue.severity,
        columnName: issue.columnName,
        problem: issue.description,
        recommendation: issue.recommendedAction.label,
        confidence,
        actionParams: {
          operationType: issue.recommendedAction.actionType,
          parameters: issue.recommendedAction.parameters || {},
        },
      };
    });
  }
}
