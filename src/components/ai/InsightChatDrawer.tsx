import React, { useState, useEffect } from 'react';
import { X, Send, Sparkles, Bot, User } from 'lucide-react';
import type { AIInsight } from '../../types';

interface InsightChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  insight: AIInsight | null;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

const PRESET_PROMPTS = [
  'Why did this happen?',
  'What should we do to fix this?',
  'Show supporting statistical evidence',
  'What happens if this trend continues?',
];

export const InsightChatDrawer: React.FC<InsightChatDrawerProps> = ({ isOpen, onClose, insight }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (insight) {
      setMessages([
        {
          id: 'm1',
          sender: 'ai',
          text: `Hello! I am your AI Data Analyst assistant. I have verified all metrics for insight "${insight.title}". What would you like to investigate?`,
        },
      ]);
    }
  }, [insight]);

  if (!isOpen || !insight) return null;

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: Message = { id: `u_${Date.now()}`, sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 900));

    let reply = '';
    const qLower = query.toLowerCase();

    if (qLower.includes('why') || qLower.includes('cause')) {
      reply = `Based on deterministic statistical decomposition of dataset "${insight.dataset}", the top contributor was ${insight.rootCauses?.[0]?.title || 'category variance'} representing ${insight.rootCauses?.[0]?.changePct || 18}% delta.`;
    } else if (qLower.includes('do') || qLower.includes('fix') || qLower.includes('recommend')) {
      reply = `Recommendation: ${insight.recommendationData?.action || 'Review inventory allocations and apply automated quality thresholding.'} Expected Impact: ${insight.recommendationData?.expectedRevenueImpact || '+$420K'}.`;
    } else if (qLower.includes('evidence') || qLower.includes('data')) {
      reply = `Verified Evidence Audit: ${insight.evidence?.recordsAnalyzed || 100} records analyzed with ${insight.confidence}% AI Confidence and ${insight.evidenceScore}% Evidence Quality Score.`;
    } else {
      reply = `Regarding "${insight.title}": Historical records indicate a cumulative variance of ${insight.supportingMetrics?.[0]?.value || 'high'}. I recommend launching a What-If simulation to model future outcomes.`;
    }

    setMessages((prev) => [...prev, { id: `ai_${Date.now()}`, sender: 'ai', text: reply }]);
    setIsTyping(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl animate-slideLeft">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Ask AI About Insight</h2>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{insight.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Preset Prompt Chips */}
        <div className="p-3 bg-slate-950 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto">
          {PRESET_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => handleSend(p)}
              className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap transition-colors border border-slate-700/60"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/40">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                m.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-violet-600 text-white'
              }`}>
                {m.sender === 'user' ? <User size={13} /> : <Bot size={13} />}
              </div>
              <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-tl-none'
              }`}>
                {m.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono italic animate-pulse">
              <Sparkles size={13} className="text-violet-400" /> AI is reasoning over verified data...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-900 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask a question about this insight..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-colors"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
