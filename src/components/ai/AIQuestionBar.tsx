import { useState } from 'react';
import { Search, Mic, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatResponses, suggestedQuestions } from '../../data/insights';
import { AIChatModal } from './AIChatModal';

export function AIQuestionBar() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);

  const handleSubmit = async (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    setAnswer(null);

    await new Promise((r) => setTimeout(r, 1000));

    const key = Object.keys(chatResponses).find((k) => q.toLowerCase().includes(k));
    setAnswer(chatResponses[key ?? 'default']);
    setLoading(false);
  };

  const handleOpenChat = (customQ?: string) => {
    if (customQ) setQuery(customQ);
    setChatModalOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f2937] rounded-card shadow-card p-4"
    >
      {/* Input row */}
      <div className="relative flex items-center gap-3 bg-slate-50 dark:bg-[#0b1120] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
        {loading ? (
          <Loader2 size={18} className="text-blue-500 animate-spin flex-shrink-0" />
        ) : (
          <Search size={18} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
        )}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (query.trim()) handleOpenChat(query);
            }
          }}
          placeholder='Ask your data a question... e.g., "What was our highest-selling product last quarter?"'
          className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
          aria-label="AI query input"
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors" aria-label="Voice input">
            <Mic size={15} />
          </button>
          <button
            onClick={() => handleOpenChat(query)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
            aria-label="Send query to AI"
          >
            <Sparkles size={12} />
            Ask AI
          </button>
        </div>
      </div>

      {/* Answer */}
      <AnimatePresence>
        {answer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 p-3.5 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles size={10} className="text-white" />
              </div>
              <div className="flex-1">
                <p
                  className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: answer.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-white">$1</strong>') }}
                />
                <button
                  onClick={() => handleOpenChat(query)}
                  className="flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  Ask follow-up with InsightAI Assistant <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions */}
      {!answer && !loading && (
        <div className="flex flex-wrap gap-2 mt-3">
          {suggestedQuestions.slice(0, 4).map((q) => (
            <button
              key={q}
              onClick={() => handleOpenChat(q)}
              className="px-3 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Chat modal */}
      <AIChatModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        initialQuery={query}
      />
    </motion.div>
  );
}
