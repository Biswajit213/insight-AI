import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Bot, User, Database, Loader2, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useDatasets } from '../../context/DatasetContext';
import { formatNumber } from '../../lib/utils';
import { apiClient } from '../../lib/apiClient';
import type { Dataset, ChatMessage } from '../../types';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset?: Dataset;
  initialQuery?: string;
}

// Backend API response shape
interface AskResponse {
  success: boolean;
  data: {
    answer: string;
    confidence: number;
    conversationId: string;
    messageId: string;
    analysis?: Record<string, unknown>;
  };
}

const SUGGESTED_PROMPTS = [
  'Summarize key insights',
  'Show null values & data quality',
  'Which category has the highest value?',
  'What are the top 5 records?',
  'Detect anomalies and outliers',
  'How do I add new data?',
];

// Simple markdown renderer
function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h4 class="font-bold text-slate-900 dark:text-white text-sm mb-1 mt-2">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-bold text-slate-900 dark:text-white text-sm mb-1 mt-2">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900 dark:text-white">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 text-blue-600 dark:text-blue-400 rounded text-xs font-mono">$1</code>')
    .replace(/^(\d+)\. (.+)$/gm, '<div class="flex gap-2 my-0.5"><span class="text-blue-500 font-bold flex-shrink-0">$1.</span><span>$2</span></div>')
    .replace(/^[-•] (.+)$/gm, '<div class="flex gap-2 my-0.5"><span class="text-blue-400 flex-shrink-0">•</span><span>$1</span></div>')
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export function AIChatModal({ isOpen, onClose, dataset, initialQuery }: AIChatModalProps) {
  const { datasets, getDatasetData } = useDatasets();

  const activeDataset = dataset || datasets[0];
  const { columns, rows } = getDatasetData(activeDataset?.id || '');

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Reset and init when modal opens
  useEffect(() => {
    if (isOpen) {
      setConversationId(undefined);
      setError(null);

      const greeting: ChatMessage = {
        id: `msg_welcome_${Date.now()}`,
        role: 'assistant',
        content: activeDataset
          ? `Hello! I'm **InsightAI** — your AI data analyst.\n\nI've loaded **"${activeDataset.name}"** (${formatNumber(activeDataset.rows)} rows · ${activeDataset.columns} columns) with ${rows.length > 0 ? `${rows.length} rows in memory` : 'metadata only'}.\n\nAsk me anything — data analysis, quality checks, trends, or how to use the platform.`
          : `Hello! I'm **InsightAI**. Upload a CSV dataset from **Data Sources** to start asking questions about your data!`,
        timestamp: new Date().toISOString(),
      };

      setMessages([greeting]);

      if (initialQuery?.trim()) {
        // Small delay so the greeting renders first
        setTimeout(() => handleSendMessage(initialQuery), 100);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeDataset?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || query).trim();
    if (!textToSend || loading) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setQuery('');
    setLoading(true);

    try {
      // ── Try backend Mistral API first ──────────────────────────────────────
      if (activeDataset?.id) {
        const token = localStorage.getItem('insightai_token');

        if (token && token !== 'guest') {
          const res = await apiClient.post<AskResponse>('/api/v1/ai/ask', {
            datasetId: activeDataset.id,
            question: textToSend,
            conversationId,
          });

          if (res?.data?.answer) {
            if (res.data.conversationId) setConversationId(res.data.conversationId);

            const assistantMsg: ChatMessage = {
              id: `msg_ai_${Date.now()}`,
              role: 'assistant',
              content: res.data.answer,
              timestamp: new Date().toISOString(),
              sources: [`Confidence: ${Math.round((res.data.confidence ?? 0.99) * 100)}%`],
            };
            setMessages((prev) => [...prev, assistantMsg]);
            setLoading(false);
            return;
          }
        }
      }

      // ── Fallback: client-side answer using local dataset data ───────────────
      const fallbackAnswer = generateClientAnswer(textToSend);
      const assistantMsg: ChatMessage = {
        id: `msg_fallback_${Date.now()}`,
        role: 'assistant',
        content: fallbackAnswer,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

    } catch (err: any) {
      // API call failed — use client-side fallback
      const fallbackAnswer = generateClientAnswer(textToSend);
      const assistantMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: fallbackAnswer,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // ── Client-side fallback (when backend unavailable) ─────────────────────
  const generateClientAnswer = (question: string): string => {
    const q = question.toLowerCase();

    if (!activeDataset) {
      return 'No dataset loaded. Go to **Data Sources** and upload a CSV file first.';
    }

    // Platform how-to
    if (q.includes('add') || q.includes('upload') || q.includes('import') || q.includes('new data') || q.includes('how to add')) {
      return `To add new data to InsightAI:\n\n1. Click **Data Sources** in the left sidebar\n2. Click **"Upload Dataset"** (top-right button)\n3. Drag your CSV/Excel file into the upload area\n4. Wait for processing — your dataset appears instantly\n\nSupported: CSV, XLSX, XLS (max 50MB)`;
    }

    if (q.includes('edit') || q.includes('modify') || q.includes('change data')) {
      return `To edit your data:\n\n1. Go to **Data Sources**\n2. Find your dataset and click **"Edit"**\n3. The Excel Editor opens — click any cell to edit\n4. Changes save automatically`;
    }

    // Data quality
    if (q.includes('null') || q.includes('missing') || q.includes('quality') || q.includes('anomaly') || q.includes('duplicate')) {
      const missing = activeDataset.missingValues ?? 0;
      const dups = activeDataset.duplicates ?? 0;
      const totalCells = rows.length * columns.length;
      const completeness = totalCells > 0 ? Math.round(((totalCells - missing) / totalCells) * 100) : 100;
      const problemCols = columns.filter(c => c.nullCount > 0);
      return `**Data Quality Report — ${activeDataset.name}**\n\n• **Missing values**: ${missing.toLocaleString()} cells\n• **Duplicate rows**: ${dups.toLocaleString()}\n• **Completeness**: ${completeness}%\n${problemCols.length > 0 ? `• **Columns with nulls**: ${problemCols.map(c => `\`${c.name}\` (${c.nullCount})`).join(', ')}` : '• All columns are complete ✓'}\n\n${missing > 0 ? 'Recommendation: Use the **Data Cleaning Studio** to impute or remove missing values.' : 'Dataset is clean and ready for analysis.'}`;
    }

    // Column info
    if (q.includes('column') || q.includes('field') || q.includes('attribute') || q.includes('schema')) {
      return `**Columns in ${activeDataset.name}** (${columns.length} total):\n\n${columns.map(c => `• \`${c.name}\` — ${c.type} | ${formatNumber(c.uniqueCount)} unique values | ${c.nullCount} missing`).join('\n')}`;
    }

    // Summary
    if (q.includes('summar') || q.includes('overview') || q.includes('insight') || q.includes('tell me about')) {
      const numCols = columns.filter(c => c.type === 'number');
      const catCols = columns.filter(c => c.type === 'string');
      return `**Summary — ${activeDataset.name}**\n\n• **${formatNumber(activeDataset.rows)} rows** × **${activeDataset.columns} columns**\n• **${numCols.length} numeric** columns, **${catCols.length} categorical** columns\n• **Missing values**: ${activeDataset.missingValues ?? 0}\n• **Duplicates**: ${activeDataset.duplicates ?? 0}\n• **File size**: ${(activeDataset.sizeBytes / 1024).toFixed(1)} KB\n\nTop columns: ${columns.slice(0, 5).map(c => `\`${c.name}\``).join(', ')}`;
    }

    // Numeric analysis from local rows
    if (rows.length > 0) {
      const numCol = columns.find(c => c.type === 'number' &&
        ['revenue', 'sales', 'amount', 'value', 'total', 'price', 'cost'].some(k => c.name.toLowerCase().includes(k))
      ) || columns.find(c => c.type === 'number');

      if (numCol) {
        const vals = rows.map(r => Number(r[numCol.name])).filter(n => !isNaN(n));
        if (vals.length > 0) {
          const sum = vals.reduce((a, b) => a + b, 0);
          const avg = sum / vals.length;
          const max = Math.max(...vals);
          const min = Math.min(...vals);
          return `**Analysis of \`${numCol.name}\`** (${vals.length.toLocaleString()} values):\n\n• **Total**: ${sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}\n• **Average**: ${avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}\n• **Max**: ${max.toLocaleString()}\n• **Min**: ${min.toLocaleString()}\n\nFor more specific analysis, try: "Which \`${columns.find(c => c.type === 'string')?.name ?? 'category'}\` has the highest \`${numCol.name}\`?"`;
        }
      }
    }

    return `I'm analyzing **${activeDataset.name}** (${formatNumber(activeDataset.rows)} rows, ${activeDataset.columns} columns).\n\nFor "${question}" — the backend AI is processing. Try asking:\n• "Summarize this dataset"\n• "Show data quality issues"\n• "List all columns"\n• "How do I upload new data?"`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="InsightAI Assistant"
      description={activeDataset ? `Dataset Context: ${activeDataset.name}` : 'Interactive AI Assistant'}
      size="lg"
    >
      <div className="flex flex-col h-[500px]">

        {/* Dataset context badge */}
        {activeDataset && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium mb-3 flex-shrink-0">
            <Database size={13} />
            <span>
              Analyzing <strong>{activeDataset.name}</strong>
              {' '}({formatNumber(activeDataset.rows)} rows · {activeDataset.columns} cols
              {rows.length > 0 ? ` · ${rows.length} in memory` : ' · metadata only'})
            </span>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs mb-2 flex-shrink-0">
            <AlertCircle size={13} />
            <span>{error}</span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gradient-to-br from-violet-500 to-blue-600 text-white shadow-sm'
              }`}>
                {msg.role === 'user' ? <User size={13} /> : <Bot size={14} />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-200/60 dark:border-slate-700/50'
              }`}>
                <div
                  className="text-[13px] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-600/50 flex items-center gap-1">
                    <Sparkles size={10} className="text-violet-400" />
                    <span className="text-[10px] text-slate-400">{msg.sources[0]}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 text-white flex items-center justify-center flex-shrink-0">
                <Bot size={14} />
              </div>
              <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm flex items-center gap-2 text-slate-500">
                <Loader2 size={13} className="animate-spin text-blue-500" />
                <span className="text-xs font-medium">InsightAI is analysing your data...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 mt-1 border-t border-slate-100 dark:border-slate-800 flex-shrink-0 scrollbar-none">
          <Sparkles size={12} className="text-violet-500 flex-shrink-0" />
          <span className="text-[10px] text-slate-400 font-medium flex-shrink-0">Ask:</span>
          {SUGGESTED_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => handleSendMessage(p)}
              disabled={loading}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap text-[11px] disabled:opacity-50 flex-shrink-0"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSendMessage(); }}
            placeholder="Ask InsightAI anything about this dataset..."
            className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            autoComplete="off"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!query.trim() || loading}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-colors flex-shrink-0"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            <span>{loading ? '...' : 'Send'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
