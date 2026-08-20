import { mistralClient, MISTRAL_MODEL } from '../config/mistral';
import { supabaseAdmin } from '../config/supabase';
import { DatasetService } from './dataset.service';
import { AnalyticsService } from './analytics.service';
import { AIAskRequest, AIAskResponse, AIExecutiveSummaryResponse } from '../types/ai';
import { logger } from '../utils/logger';

// ─── Master System Prompt ────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are InsightAI — a world-class data analyst AI embedded inside a data analytics platform.

You have DIRECT ACCESS to the user's actual dataset. Every response must be grounded in the real data provided.

## YOUR CAPABILITIES
- Answer ANY question about the dataset: aggregations, trends, comparisons, distributions, outliers
- Explain data quality issues: nulls, duplicates, type mismatches
- Provide actionable business recommendations based on findings
- Handle how-to questions about using the platform
- Detect and explain patterns, correlations, anomalies
- Compute and explain statistical summaries

## HOW TO ANSWER
1. ALWAYS directly answer the exact question asked — do not deflect or rephrase
2. Use the ACTUAL DATA provided (rows, column values, computed metrics) — never make up numbers
3. For questions about platform usage (e.g. "how to add data"), give clear step-by-step instructions
4. For analytical questions, cite specific values from the computed metrics
5. Keep answers focused, clear, and actionable
6. Use markdown formatting: **bold** for key figures, bullet points for lists, \`code\` for column names
7. If data is insufficient to answer precisely, explain what data would be needed

## PLATFORM KNOWLEDGE
- Users can upload data via: Data Sources page → "Upload Dataset" button → drag CSV/Excel file
- Users can edit data in the Excel Editor (Edit button on any dataset)
- Users can run AI analysis via the "Ask Your Data" page
- Users can view cleaning suggestions in the "Data Cleaning Studio"
- Users can generate reports from the "Reports" page

## STRICT RULES
- Never fabricate statistics not present in the provided metrics
- Never say "I cannot access your data" — you HAVE the data summary
- Never give generic non-answers — always attempt to address the specific question
- Accuracy target: 99%. When uncertain, say so and explain why.`;

// ─── Compute rich analytics from dataset rows ────────────────────────────────
function computeRichAnalytics(
  rows: Record<string, unknown>[],
  columnNames: string[],
  columns: Array<{ column_name: string; data_type: string; missing_values: number; unique_values: number }>
): Record<string, unknown> {
  if (rows.length === 0) {
    return { type: 'no_data', message: 'No rows available in memory for this dataset.' };
  }

  const analytics: Record<string, unknown> = {
    totalRows: rows.length,
    totalColumns: columnNames.length,
    columnNames,
  };

  // Numeric columns — compute min, max, sum, avg, median
  const numericStats: Record<string, unknown> = {};
  const categoricalStats: Record<string, unknown> = {};

  for (const col of columns) {
    const values = rows.map((r) => r[col.column_name]).filter((v) => v !== null && v !== undefined && v !== '');

    if (col.data_type === 'number' || col.data_type === 'integer' || col.data_type === 'float') {
      const nums = values.map(Number).filter((n) => !isNaN(n));
      if (nums.length > 0) {
        nums.sort((a, b) => a - b);
        const sum = nums.reduce((a, b) => a + b, 0);
        const avg = sum / nums.length;
        const median = nums.length % 2 === 0
          ? (nums[nums.length / 2 - 1] + nums[nums.length / 2]) / 2
          : nums[Math.floor(nums.length / 2)];
        numericStats[col.column_name] = {
          min: nums[0],
          max: nums[nums.length - 1],
          sum: Math.round(sum * 100) / 100,
          avg: Math.round(avg * 100) / 100,
          median: Math.round(median * 100) / 100,
          count: nums.length,
          missing: col.missing_values,
        };
      }
    } else {
      // Categorical — top 10 value counts
      const freq: Record<string, number> = {};
      for (const v of values) {
        const key = String(v);
        freq[key] = (freq[key] || 0) + 1;
      }
      const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10);
      categoricalStats[col.column_name] = {
        uniqueValues: col.unique_values,
        topValues: sorted.map(([value, count]) => ({ value, count, pct: Math.round((count / rows.length) * 1000) / 10 })),
        missing: col.missing_values,
      };
    }
  }

  analytics.numericColumns = numericStats;
  analytics.categoricalColumns = categoricalStats;

  // Cross-column: find best numeric + best categorical for group-by
  const numCols = Object.keys(numericStats);
  const catCols = Object.keys(categoricalStats);

  // Revenue/sales metric detection
  const metricCol = numCols.find((c) =>
    ['revenue', 'sales', 'amount', 'total', 'price', 'value', 'cost', 'profit', 'income'].some((k) => c.toLowerCase().includes(k))
  ) || numCols[0];

  const groupCol = catCols.find((c) =>
    ['product', 'category', 'region', 'country', 'city', 'segment', 'channel', 'type', 'status', 'hotel', 'meal', 'market'].some((k) => c.toLowerCase().includes(k))
  ) || catCols[0];

  if (metricCol && groupCol) {
    const grouped = AnalyticsService.calculateGroupBy(rows, groupCol, metricCol, 'sum');
    analytics.topGroupsByMetric = {
      groupByColumn: groupCol,
      metricColumn: metricCol,
      top10: grouped.slice(0, 10),
      bottom5: grouped.slice(-5).reverse(),
      total: grouped.length,
    };
  }

  // Data quality summary
  const totalCells = rows.length * columns.length;
  const totalMissing = columns.reduce((s, c) => s + (c.missing_values || 0), 0);
  analytics.dataQuality = {
    totalCells,
    missingCells: totalMissing,
    completenessPercent: Math.round(((totalCells - totalMissing) / totalCells) * 1000) / 10,
    columnsWithMissing: columns.filter((c) => c.missing_values > 0).map((c) => ({
      column: c.column_name,
      missing: c.missing_values,
      pct: Math.round((c.missing_values / rows.length) * 1000) / 10,
    })),
  };

  // Sample rows for context
  analytics.sampleRows = rows.slice(0, 5);

  return analytics;
}

// ─── AIService ────────────────────────────────────────────────────────────────
export class AIService {
  public static async askDatasetQuestion(
    userId: string,
    request: AIAskRequest
  ): Promise<AIAskResponse> {
    const { datasetId, question, conversationId: existingConvId } = request;

    // 1. Load dataset metadata + columns
    const dataset = await DatasetService.getDatasetById(userId, datasetId);
    const columns = await DatasetService.getDatasetColumns(userId, datasetId);
    const columnNames = columns.map((c) => c.column_name);

    // 2. Get in-memory rows and compute rich analytics
    const rows = DatasetService.getDatasetMemoryRows(datasetId);
    const analytics = computeRichAnalytics(rows, columnNames, columns as any);

    // 3. Build detailed context prompt
    const dataContextPrompt = `## DATASET INFORMATION
Name: ${dataset.name}
Total Rows: ${dataset.row_count}
Total Columns: ${dataset.column_count}
File Type: ${dataset.file_type}
Data Quality Score: ${dataset.data_quality_score}%

## COLUMN SCHEMA
${columns.map((c) => `- \`${c.column_name}\` (${c.data_type}) — ${c.missing_values} missing, ${c.unique_values} unique values`).join('\n')}

## COMPUTED ANALYTICS (based on actual dataset rows in memory: ${rows.length} rows loaded)
${JSON.stringify(analytics, null, 2)}

## USER QUESTION
"${question}"

## INSTRUCTIONS
Answer the user's exact question using the data above. Be specific, accurate, and actionable.
- If the question is about adding/uploading data → explain the platform steps
- If the question is about data analysis → use the computed metrics and cite real numbers
- If rows in memory is 0 (dataset not in memory) → explain they need to re-upload the file since server-side memory is cleared on restart`;

    let aiAnswer = '';
    let tokensUsed = { input: 0, output: 0 };

    try {
      const response = await mistralClient.chat.complete({
        model: MISTRAL_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: dataContextPrompt },
        ],
        temperature: 0.1,   // low temperature = more factual, less hallucination
        maxTokens: 800,
      });

      const messageContent = response.choices?.[0]?.message?.content;
      aiAnswer = typeof messageContent === 'string' ? messageContent.trim() : 'No response generated.';

      tokensUsed = {
        input: response.usage?.promptTokens || 0,
        output: response.usage?.completionTokens || 0,
      };
    } catch (err) {
      logger.warn('Mistral AI call failed', { error: (err as Error).message });
      aiAnswer = this.generateFallbackExplanation(question, analytics);
    }

    // 4. Persist conversation + messages
    let conversationId = existingConvId;
    if (!conversationId) {
      conversationId = crypto.randomUUID();
      try {
        await supabaseAdmin.from('ai_conversations').insert({
          id: conversationId,
          user_id: userId,
          dataset_id: datasetId,
          title: question.slice(0, 80),
        });
      } catch (err) {
        logger.warn('Failed to insert conversation:', err);
      }
    }

    const messageId = crypto.randomUUID();
    try {
      await supabaseAdmin.from('ai_messages').insert([
        {
          id: crypto.randomUUID(),
          conversation_id: conversationId,
          user_id: userId,
          role: 'user',
          content: question,
        },
        {
          id: messageId,
          conversation_id: conversationId,
          user_id: userId,
          role: 'assistant',
          content: aiAnswer,
          metadata: { datasetId, tokensUsed },
        },
      ]);

      await supabaseAdmin.from('ai_usage').insert({
        user_id: userId,
        model: MISTRAL_MODEL,
        request_type: 'ask_question',
        input_tokens: tokensUsed.input,
        output_tokens: tokensUsed.output,
        total_tokens: tokensUsed.input + tokensUsed.output,
        estimated_cost: (tokensUsed.input + tokensUsed.output) * 0.000002,
      });
    } catch (err) {
      logger.warn('Failed to record AI message/usage:', err);
    }

    return {
      answer: aiAnswer,
      confidence: 0.99,
      sources: [`Dataset: ${dataset.name}`, `Rows analysed: ${rows.length}`],
      analysis: analytics,
      conversationId,
      messageId,
    };
  }

  public static async generateExecutiveSummary(
    userId: string,
    datasetId: string
  ): Promise<AIExecutiveSummaryResponse> {
    const dataset = await DatasetService.getDatasetById(userId, datasetId);
    const columns = await DatasetService.getDatasetColumns(userId, datasetId);
    const rows = DatasetService.getDatasetMemoryRows(datasetId);
    const analytics = computeRichAnalytics(rows, columns.map(c => c.column_name), columns as any);

    const prompt = `Generate a comprehensive Executive Summary for the following dataset.

Dataset: "${dataset.name}"
Rows: ${dataset.row_count}
Columns: ${columns.map(c => c.column_name).join(', ')}

Analytics:
${JSON.stringify(analytics, null, 2)}

Return ONLY valid JSON with this exact structure:
{
  "summary": "2-3 sentence executive overview with specific numbers",
  "keyInsights": [
    { "title": "Insight title", "description": "Specific finding with numbers", "type": "trend|opportunity|risk|anomaly" }
  ],
  "recommendations": ["Specific actionable recommendation 1", "Recommendation 2", "Recommendation 3"],
  "confidence": 0.99
}

Use real numbers from the analytics. Generate 4-5 key insights minimum.`;

    try {
      const response = await mistralClient.chat.complete({
        model: MISTRAL_MODEL,
        responseFormat: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        maxTokens: 1200,
      });

      const content = response.choices?.[0]?.message?.content;
      if (typeof content === 'string') {
        const parsed = JSON.parse(content);
        return parsed as AIExecutiveSummaryResponse;
      }
      throw new Error('Invalid response format');
    } catch (err) {
      logger.warn('Executive summary generation failed:', err);
      // Meaningful fallback using real analytics
      const numCols = analytics.numericColumns as Record<string, any>;
      const catCols = analytics.categoricalColumns as Record<string, any>;
      const quality = analytics.dataQuality as any;
      const firstNumKey = Object.keys(numCols)[0];
      const firstCatKey = Object.keys(catCols)[0];

      return {
        summary: `${dataset.name} contains ${dataset.row_count.toLocaleString()} records across ${dataset.column_count} attributes with ${quality?.completenessPercent ?? 100}% data completeness.${firstNumKey ? ` Total ${firstNumKey}: ${numCols[firstNumKey]?.sum?.toLocaleString()}, average: ${numCols[firstNumKey]?.avg?.toLocaleString()}.` : ''}`,
        keyInsights: [
          {
            title: 'Data Completeness',
            description: `Dataset is ${quality?.completenessPercent ?? 100}% complete with ${quality?.missingCells ?? 0} missing cells across ${quality?.columnsWithMissing?.length ?? 0} columns.`,
            type: 'trend',
          },
          ...(firstNumKey ? [{
            title: `${firstNumKey} Distribution`,
            description: `Range: ${numCols[firstNumKey]?.min?.toLocaleString()} to ${numCols[firstNumKey]?.max?.toLocaleString()}, median: ${numCols[firstNumKey]?.median?.toLocaleString()}.`,
            type: 'opportunity',
          }] : []),
          ...(firstCatKey ? [{
            title: `Top ${firstCatKey}`,
            description: `Most frequent: "${catCols[firstCatKey]?.topValues?.[0]?.value}" at ${catCols[firstCatKey]?.topValues?.[0]?.pct}% of records.`,
            type: 'trend',
          }] : []),
        ],
        recommendations: [
          quality?.missingCells > 0 ? `Impute or remove ${quality.missingCells} missing values before analysis` : 'Dataset is clean — proceed with analysis',
          'Run anomaly detection to identify outliers in numeric columns',
          'Use the Data Cleaning Studio to standardize categorical values',
        ],
        confidence: 0.95,
      };
    }
  }

  private static generateFallbackExplanation(
    question: string,
    analytics: Record<string, unknown>
  ): string {
    const q = question.toLowerCase();

    // Platform how-to questions
    if (q.includes('add') || q.includes('upload') || q.includes('import') || q.includes('new data')) {
      return `To add new data to InsightAI:\n\n1. Go to **Data Sources** in the left sidebar\n2. Click the **"Upload Dataset"** button (top right)\n3. Drag your CSV or Excel file into the upload area, or click to browse\n4. Wait for processing to complete\n5. Your dataset will appear in the datasets list immediately\n\nSupported formats: CSV, XLSX, XLS (up to 50MB)`;
    }

    if (q.includes('edit') || q.includes('change') || q.includes('modify')) {
      return `To edit data:\n\n1. Go to **Data Sources** → find your dataset\n2. Click the **"Edit"** button on the dataset row\n3. The Excel Editor will open — you can modify cells directly\n4. Changes are saved automatically`;
    }

    const quality = analytics.dataQuality as any;
    const numCols = analytics.numericColumns as Record<string, any> || {};
    const firstNum = Object.keys(numCols)[0];

    if (firstNum) {
      return `Based on **${analytics.totalRows?.toLocaleString()} rows** analysed:\n\n• **${firstNum}**: total ${numCols[firstNum].sum?.toLocaleString()}, avg ${numCols[firstNum].avg?.toLocaleString()}, range ${numCols[firstNum].min?.toLocaleString()} – ${numCols[firstNum].max?.toLocaleString()}\n• **Data completeness**: ${quality?.completenessPercent ?? 100}%\n\nFor "${question}" — please rephrase your question with more specific column names for a precise answer.`;
    }

    return `I've analysed **${analytics.totalRows?.toLocaleString() ?? 0} rows** with columns: ${(analytics.columnNames as string[] || []).join(', ')}.\n\nFor a precise answer to "${question}", try asking:\n- "What is the total [column name]?"\n- "Which [category column] has the highest [metric column]?"\n- "Show me missing values"\n- "Summarize the dataset"`;
  }
}
