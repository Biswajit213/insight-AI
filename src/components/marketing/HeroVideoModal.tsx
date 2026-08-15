import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, X, Sparkles, CheckCircle2, Film, Clock, ArrowRight, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDashboard: () => void;
}

const videoChapters = [
  { id: 'ch1', title: '1. Connect & Upload', timestamp: 0, timeLabel: '0:00', desc: 'Drag & drop CSV/Excel files or connect cloud databases' },
  { id: 'ch2', title: '2. Auto AI Cleaning', timestamp: 25, timeLabel: '0:25', desc: 'Smart outlier detection, missing value imputation & deduplication' },
  { id: 'ch3', title: '3. Ask Natural Language Q&A', timestamp: 55, timeLabel: '0:55', desc: 'Ask questions in plain English & receive instant chart answers' },
  { id: 'ch4', title: '4. Executive Reports & Forecasts', timestamp: 85, timeLabel: '1:25', desc: 'Export PDF executive summaries & predictive trendlines' },
];

export function HeroVideoModal({ isOpen, onClose, onOpenDashboard }: HeroVideoModalProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const intervalRef = useRef<any>(null);

  // Simulated video playback timer (110 seconds duration total)
  const totalDurationSeconds = 110;

  useEffect(() => {
    if (isOpen) {
      setIsPlaying(true);
      setProgress(0);
      setActiveChapterIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isPlaying) {
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 1 * playbackSpeed;
          if (next >= totalDurationSeconds) {
            setIsPlaying(false);
            return totalDurationSeconds;
          }
          // Update active chapter based on progress
          if (next >= 85) setActiveChapterIndex(3);
          else if (next >= 55) setActiveChapterIndex(2);
          else if (next >= 25) setActiveChapterIndex(1);
          else setActiveChapterIndex(0);

          return next;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, isPlaying, playbackSpeed]);

  if (!isOpen) return null;

  const currentChapter = videoChapters[activeChapterIndex];
  const progressPercent = Math.min(100, (progress / totalDurationSeconds) * 100);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
    if (newProgress >= 85) setActiveChapterIndex(3);
    else if (newProgress >= 55) setActiveChapterIndex(2);
    else if (newProgress >= 25) setActiveChapterIndex(1);
    else setActiveChapterIndex(0);
  };

  const handleChapterClick = (chapterIndex: number) => {
    const targetTime = videoChapters[chapterIndex].timestamp;
    setProgress(targetTime);
    setActiveChapterIndex(chapterIndex);
    setIsPlaying(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-y-auto">
        {/* Dark Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 text-slate-100"
        >
          {/* Modal Header Bar */}
          <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Film size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  InsightAI How-To Video Walkthrough
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    2 Min Tour
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Learn how to upload, clean, analyze, and forecast metrics with AI.</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close video"
            >
              <X size={20} />
            </button>
          </div>

          {/* Main Video & Interactive Stage */}
          <div className="relative bg-slate-950 aspect-video max-h-[500px] flex items-center justify-center overflow-hidden group">
            {/* Animated Demo Visualizer Screen */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40 p-6 sm:p-10 flex flex-col justify-between">
              {/* Top Video Status Overlay */}
              <div className="flex items-center justify-between text-xs text-slate-400 z-10">
                <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-slate-200 text-[11px]">CHAPTER {activeChapterIndex + 1}/4</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-600/10 px-3 py-1.5 rounded-xl border border-blue-500/20 text-blue-400 font-semibold text-[11px]">
                  <Sparkles size={13} />
                  <span>AI Narration Active</span>
                </div>
              </div>

              {/* Dynamic Animated Content per Chapter */}
              <div className="my-auto text-center space-y-4 max-w-2xl mx-auto z-10">
                <motion.div
                  key={currentChapter.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
                    {currentChapter.title}
                  </span>
                  <h4 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight font-sans">
                    {currentChapter.desc}
                  </h4>

                  {/* Visual Step Preview Graphic */}
                  <div className="pt-4 flex justify-center">
                    {activeChapterIndex === 0 && (
                      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl max-w-md w-full text-left space-y-3 animate-fadeIn">
                        <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                          <span>Uploading sales_data_2025.xlsx</span>
                          <span className="text-blue-400 font-mono">{Math.min(100, Math.floor((progress / 25) * 100))}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300" style={{ width: `${Math.min(100, (progress / 25) * 100)}%` }} />
                        </div>
                        <p className="text-[11px] text-slate-400">119,390 rows imported · 18 columns detected</p>
                      </div>
                    )}

                    {activeChapterIndex === 1 && (
                      <div className="p-6 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-xl max-w-md w-full text-left space-y-2 animate-fadeIn">
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                          <CheckCircle2 size={16} /> Automated Cleaning Passed
                        </div>
                        <p className="text-xs text-white font-semibold">1,420 Missing Values Imputed · 84 Outliers Cleaned</p>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 flex justify-between">
                          <span>Data Health Score:</span>
                          <span className="text-emerald-400 font-bold">98 / 100 (Optimal)</span>
                        </div>
                      </div>
                    )}

                    {activeChapterIndex === 2 && (
                      <div className="p-6 rounded-2xl bg-slate-900/90 border border-blue-500/30 shadow-xl max-w-md w-full text-left space-y-3 animate-fadeIn">
                        <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                          <Sparkles size={16} /> Natural Language Query
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200">
                          "Which product category generated highest profit in Q3?"
                        </div>
                        <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-xs text-blue-300 font-semibold">
                          💡 Electronics category (+38.4% growth, $1.42M profit)
                        </div>
                      </div>
                    )}

                    {activeChapterIndex === 3 && (
                      <div className="p-6 rounded-2xl bg-slate-900/90 border border-violet-500/30 shadow-xl max-w-md w-full text-left space-y-3 animate-fadeIn">
                        <div className="flex items-center justify-between text-xs font-bold text-violet-400">
                          <span>Automated Executive Summary</span>
                          <span>Ready for PDF Export</span>
                        </div>
                        <p className="text-xs text-slate-300">
                          Forecast predicts +14.2% Q4 growth with 95% confidence interval.
                        </p>
                        <button
                          onClick={() => {
                            onClose();
                            onOpenDashboard();
                          }}
                          className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg flex items-center justify-center gap-2"
                        >
                          Try Live in Dashboard <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Bottom Video Progress Bar & Controls Overlay */}
              <div className="z-20 space-y-2">
                {/* Progress bar */}
                <div className="relative flex items-center group/seek">
                  <input
                    type="range"
                    min="0"
                    max={totalDurationSeconds}
                    value={progress}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div
                    className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-blue-500 to-violet-500 rounded-lg pointer-events-none"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlaying((v) => !v)}
                      className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                    </button>

                    <button
                      onClick={() => {
                        setProgress(0);
                        setIsPlaying(true);
                      }}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                      title="Restart Video"
                    >
                      <RotateCcw size={15} />
                    </button>

                    <button
                      onClick={() => setIsMuted((v) => !v)}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>

                    <span className="font-mono text-xs text-slate-300">
                      {formatTime(progress)} / {formatTime(totalDurationSeconds)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 hover:text-white"
                    >
                      {playbackSpeed}x Speed
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Chapter Selector Footer */}
          <div className="p-4 bg-slate-900 border-t border-slate-800">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {videoChapters.map((ch, i) => (
                <button
                  key={ch.id}
                  onClick={() => handleChapterClick(i)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    activeChapterIndex === i
                      ? 'bg-blue-600/10 border-blue-500/40 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                    <span className={activeChapterIndex === i ? 'text-blue-400 font-bold' : ''}>{ch.timeLabel}</span>
                    {activeChapterIndex === i && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />}
                  </div>
                  <p className="text-xs font-bold line-clamp-1">{ch.title}</p>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
