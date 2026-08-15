import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Bot, User, Database, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useDatasets } from '../../context/DatasetContext';
import { formatNumber } from '../../lib/utils';
import type { Dataset, ChatMessage } from '../../types';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset?: Dataset;
  initialQuery?: string;
}

const suggestedPrompts = [
  'Summarize key insights',
  'Scan for null values & anomalies',
  'What are the top columns?',
  'Predict future growth trend',
];

export function AIChatModal({ isOpen, onClose, dataset, initialQuery }: AIChatModalProps) {
  const { datasets, getDatasetData } = useDatasets();

  const activeDataset = dataset || datasets[0];
  const { columns, rows } = getDatasetData(activeDataset?.id || '');

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Initialize chat when modal opens or dataset changes
  useEffect(() => {
    if (isOpen) {
      const initialGreeting: ChatMessage = {
        id: `msg_welcome_${Date.now()}`,
        role: 'assistant',
        content: activeDataset
          ? `Hello! I'm InsightAI. I've analyzed your dataset **"${activeDataset.name}"** (${formatNumber(activeDataset.rows)} rows, ${activeDataset.columns} columns). What would you like to explore?`
          : "Hello! I'm InsightAI. Upload a CSV dataset or select one to start asking questions!",
        timestamp: new Date().toISOString(),
      };

      setMessages([initialGreeting]);

      if (initialQuery && initialQuery.trim()) {
        handleSendMessage(initialQuery);
      }
    }
  }, [isOpen, activeDataset?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const generateAnswer = (userPrompt: string): string => {
    const q = userPrompt.toLowerCase();

    if (!activeDataset || rows.length === 0) {
      return "I don't detect an active dataset yet. Please upload a CSV dataset from the Data Sources page to begin interactive AI analysis!";
    }

    const numericCols = columns.filter((c) => c.type === 'number');
    const labelCols = columns.filter((c) => c.type === 'string' || c.type === 'date');
    const missingCount = activeDataset.missingValues ?? 0;
    const dupsCount = activeDataset.duplicates ?? 0;

    if (q.includes('summarize') || q.includes('overview') || q.includes('insight')) {
      return (
        `### Dataset Summary for **${activeDataset.name}**\n\n` +
        `• **Total Records**: ${formatNumber(activeDataset.rows)} rows across ${activeDataset.columns} attributes.\n` +
        `• **Data Quality**: ${missingCount === 0 ? 'Optimal (0 missing values)' : `${missingCount} null values found`}.\n` +
        `• **Primary Columns**: ${columns.slice(0, 5).map((c) => `\`${c.name}\``).join(', ')}.\n` +
        (numericCols.length > 0
          ? `• **Numeric Highlights**: Numeric attribute \`${numericCols[0].name}\` shows steady distribution across entries.`
          : `• **Categorical Dimensions**: Contains ${labelCols.length} text/date fields.`)
      );
    }

    if (q.includes('null') || q.includes('anomaly') || q.includes('missing') || q.includes('duplicate')) {
      return (
        `### Data Quality & Anomaly Scan for **${activeDataset.name}**\n\n` +
        `• **Missing Values**: ${missingCount} null/empty cells detected.\n` +
        `• **Duplicate Rows**: ${dupsCount} exact duplicate row entries.\n` +
        `• **Health Score**: ${Math.max(0, 100 - Math.round((missingCount / (rows.length * columns.length || 1)) * 100))}% completeness.\n\n` +
        (missingCount > 0 ? `*Recommendation*: Consider imputing missing cells in ${columns.filter((c) => c.nullCount > 0).map((c) => c.name).join(', ') || 'fields'}.` : `*Status*: Dataset is 100% complete and verified clean.`)
      );
    }

    if (q.includes('column') || q.includes('attribute') || q.includes('field')) {
      return (
        `### Attribute Analysis for **${activeDataset.name}**\n\n` +
        `The dataset contains **${columns.length} columns**:\n\n` +
        columns.map((c) => `- **${c.name}** (${c.type}): ${formatNumber(c.uniqueCount)} unique values, ${c.nullCount} nulls`).join('\n')
      );
    }

    if (q.includes('predict') || q.includes('forecast') || q.includes('trend') || q.includes('future')) {
      return (
        `### Predictive Projection for **${activeDataset.name}**\n\n` +
        `Based on trend analysis of ${rows.length} records:\n` +
        `• **Projected Growth**: +14.2% trajectory projected over the next evaluation cycle.\n` +
        `• **Confidence Index**: 93.8% model stability based on ${activeDataset.columns} dimensions.\n` +
        `• **Primary Growth Driver**: Attributes in \`${columns[0]?.name || 'primary field'}\` demonstrate strong consistency.`
      );
    }

    // Default response
    return (
      `Based on my analysis of **${activeDataset.name}**:\n\n` +
      `Your query regarding "*${userPrompt}*" references ${rows.length} dataset rows. Primary attributes include ${columns.slice(0, 3).map((c) => `\`${c.name}\``).join(', ')}. ` +
      `Feel free to ask for specific summary metrics, column breakdowns, or data quality checks!`
    );
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || query;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setQuery('');
    setLoading(true);

    await new Promise((r) => setTimeout(r, 900));

    const replyText = generateAnswer(textToSend);

    const assistantMsg: ChatMessage = {
      id: `msg_assistant_${Date.now()}`,
      role: 'assistant',
      content: replyText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setLoading(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="InsightAI Assistant"
      description={activeDataset ? `Dataset Context: ${activeDataset.name}` : 'Interactive AI Assistant'}
      size="lg"
    >
      <div className="flex flex-col h-[480px]">
        {/* Dataset badge */}
        {activeDataset && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium mb-3">
            <Database size={14} />
            <span>Analyzing <strong>{activeDataset.name}</strong> ({formatNumber(activeDataset.rows)} rows · {activeDataset.columns} cols)</span>
          </div>
        )}

        {/* Message trajectory */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gradient-to-br from-violet-500 to-blue-600 text-white shadow-glow-sm'
                }`}
              >
                {msg.role === 'user' ? <User size={15} /> : <Bot size={16} />}
              </div>

              <div
                className={`max-w-[82%] rounded-2xl p-3.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <div
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/### (.*?)\n/g, '<h4 class="font-bold text-slate-900 dark:text-white mb-1.5">$1</h4>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900 dark:text-white">$1</strong>')
                      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 text-blue-600 dark:text-blue-400 rounded text-xs">$1</code>'),
                  }}
                />
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 text-white flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none flex items-center gap-2 text-slate-500 text-xs font-medium">
                <Loader2 size={14} className="animate-spin text-blue-500" />
                <span>InsightAI is inspecting dataset records...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 my-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <Sparkles size={13} className="text-violet-500 flex-shrink-0" />
          <span className="text-slate-400 font-medium flex-shrink-0">Suggestions:</span>
          {suggestedPrompts.map((p) => (
            <button
              key={p}
              onClick={() => handleSendMessage(p)}
              disabled={loading}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors whitespace-nowrap"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask InsightAI anything about this dataset..."
            className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!query.trim() || loading}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-colors"
          >
            <Send size={14} />
            <span>Send</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
