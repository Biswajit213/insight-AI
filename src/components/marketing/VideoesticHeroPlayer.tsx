import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  Zap,
  BarChart3,
  Bot,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const videoScenes = [
  {
    id: 'connect',
    label: '1. Connect & Import',
    title: 'Instant Multi-Format Data Ingestion',
    desc: 'Drag & drop Excel, CSV, JSON files or sync live PostgreSQL databases.',
    badge: '10x Faster Ingestion',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'cleaning',
    label: '2. AI Data Cleaning',
    title: 'Automated Outlier Imputation & Deduplication',
    desc: 'AI detects missing values, normalizes schemas, and fixes errors automatically.',
    badge: '98% Data Health Score',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'ask',
    label: '3. Ask Your Data',
    title: 'Grounded Natural Language Query Engine',
    desc: 'Type plain English questions like "Show me sales growth by region in Q3".',
    badge: 'Instant Visual Answers',
    color: 'from-violet-500 to-purple-500',
  },
  {
    id: 'forecast',
    label: '4. Executive Reports',
    title: 'AI Predictive Forecasting & Report Export',
    desc: 'Generate boardroom-ready executive summaries with 95% confidence bounds.',
    badge: 'One-Click Boardroom PDF',
    color: 'from-amber-500 to-orange-500',
  },
];

interface VideoesticHeroPlayerProps {
  onExpandModal: () => void;
  onOpenDashboard: () => void;
}

export function VideoesticHeroPlayer({ onExpandModal, onOpenDashboard }: VideoesticHeroPlayerProps) {
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const activeScene = videoScenes[activeSceneIndex];

  // Auto-play timer cycling through video scenes
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setActiveSceneIndex((idx) => (idx + 1) % videoScenes.length);
            return 0;
          }
          return prev + 2.5; // ~4 seconds per scene
        });
      }, 100);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying]);

  return (
    <div className="relative mx-auto max-w-5xl rounded-3xl bg-slate-950 p-2 sm:p-4 border border-slate-800 shadow-2xl shadow-blue-500/20 overflow-hidden group">
      {/* Background glowing aura effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/40 via-indigo-600/30 to-violet-600/40 rounded-3xl blur-2xl opacity-80 group-hover:opacity-100 transition duration-700 pointer-events-none" />

      {/* Video Browser Top Bar Header */}
      <div className="relative bg-slate-900/90 border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-xs font-semibold text-slate-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              video.insightai.com/hero-walkthrough
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-blue-500/10 px-3 py-1 rounded-xl border border-blue-500/20 text-xs text-blue-400 font-bold">
              <Sparkles size={13} /> Live Interactive Preview
            </div>

            <button
              onClick={onExpandModal}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Expand Fullscreen Video Walkthrough"
            >
              <Maximize2 size={15} />
            </button>
          </div>
        </div>

        {/* Video Scene Navigation Tabs */}
        <div className="bg-slate-950/80 border-b border-slate-800/80 p-2 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          {videoScenes.map((scene, idx) => (
            <button
              key={scene.id}
              onClick={() => {
                setActiveSceneIndex(idx);
                setProgress(0);
                setIsPlaying(true);
              }}
              className={`flex-1 min-w-[130px] px-3 py-2 rounded-xl text-xs font-semibold transition-all relative overflow-hidden text-left ${
                activeSceneIndex === idx
                  ? 'bg-slate-900 text-white border border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <span className="block text-[10px] uppercase font-bold tracking-wider text-blue-400">
                SCENE 0{idx + 1}
              </span>
              <span className="block text-xs font-bold truncate">{scene.label}</span>

              {/* Progress indicator bar on active scene tab */}
              {activeSceneIndex === idx && (
                <div
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Video Stage Visualizer Screen */}
        <div className="relative bg-[#070b14] aspect-[16/9] sm:aspect-[21/9] p-6 sm:p-10 flex flex-col justify-between overflow-hidden">
          {/* Subtle Video Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

          {/* Top Video Scene Badge */}
          <div className="relative z-10 flex items-center justify-between">
            <span className={`px-3.5 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r ${activeScene.color} text-white shadow-lg`}>
              {activeScene.badge}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 flex items-center gap-1.5 backdrop-blur-md"
              >
                {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
                <span>{isPlaying ? 'Pause Demo' : 'Play Demo'}</span>
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 backdrop-blur-md"
                title={isMuted ? 'Unmute AI Voiceover' : 'Mute AI Voiceover'}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
          </div>

          {/* Dynamic Scene Content Presentation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScene.id}
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 my-auto text-center space-y-4 max-w-2xl mx-auto"
            >
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {activeScene.title}
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
                {activeScene.desc}
              </p>

              {/* Scene Interactive Visual Graphics */}
              <div className="pt-2 flex justify-center">
                {activeSceneIndex === 0 && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-blue-500/30 shadow-2xl max-w-md w-full text-left space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                      <span className="flex items-center gap-2"><FileSpreadsheet size={16} className="text-emerald-400" /> Q3_Financial_Metrics.xlsx</span>
                      <span className="text-blue-400 font-mono font-bold">Importing 98%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full w-[98%] animate-pulse" />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>142,800 Rows Processed</span>
                      <span className="text-emerald-400">Schema Mapped ✓</span>
                    </div>
                  </div>
                )}

                {activeSceneIndex === 1 && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-2xl max-w-md w-full text-left space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                      <span className="flex items-center gap-1.5"><CheckCircle2 size={15} /> AI Cleaning Completed</span>
                      <span className="text-xs text-slate-400 font-normal">0.4s speed</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 text-[10px]">Null Imputed</span>
                        <p className="font-bold text-white">1,842 values</p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 text-[10px]">Duplicates Removed</span>
                        <p className="font-bold text-white">314 rows</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeSceneIndex === 2 && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-violet-500/30 shadow-2xl max-w-md w-full text-left space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-violet-400">
                      <Bot size={16} /> AI Natural Language Query Engine
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-200">
                      "What drove our highest profit margin in July?"
                    </div>
                    <div className="p-2.5 rounded-xl bg-violet-600/10 border border-violet-500/30 text-xs text-violet-200">
                      📊 Enterprise SaaS expansion boosted profit margin by <strong className="text-emerald-400">+24.8%</strong>.
                    </div>
                  </div>
                )}

                {activeSceneIndex === 3 && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-2xl max-w-md w-full text-left space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                      <span className="flex items-center gap-1.5"><TrendingUp size={15} /> Predictive Forecast</span>
                      <span className="text-emerald-400">95% Confidence</span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">
                      Next quarter revenue forecasted at <strong className="text-white">$52.4M (+16.8%)</strong>. Executive report ready for export.
                    </p>
                    <button
                      onClick={onOpenDashboard}
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg hover:scale-102 transition-transform"
                    >
                      Open Live Dashboard →
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Video Controls Footer */}
          <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-800/60">
            <button
              onClick={onExpandModal}
              className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Play size={14} className="fill-current" /> Watch Full 2-Minute Video Walkthrough →
            </button>

            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
              Auto-Playing Video Showcase (Scene {activeSceneIndex + 1}/4)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
