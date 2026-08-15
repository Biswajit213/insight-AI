import React from 'react';
import { ArrowRight, Trash2, Layers, CheckCircle2, Play, Eye } from 'lucide-react';

export interface PipelineStep {
  id: string;
  operationType: string;
  columnName?: string;
  label: string;
  parameters?: Record<string, unknown>;
}

interface Props {
  steps: PipelineStep[];
  onRemoveStep: (stepId: string) => void;
  onPreviewPipeline: () => void;
  onExecutePipeline: () => void;
  isExecuting: boolean;
}

export function CleaningPipelineVisualizer({
  steps,
  onRemoveStep,
  onPreviewPipeline,
  onExecutePipeline,
  isExecuting,
}: Props) {
  return (
    <div className="card p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">VISUAL CLEANING PIPELINE</h3>
            <p className="text-xs text-slate-400">Sequence of transformation rules applied to generate the clean dataset version.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onPreviewPipeline}
            disabled={steps.length === 0}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Eye size={14} /> Preview Changes
          </button>
          <button
            onClick={onExecutePipeline}
            disabled={steps.length === 0 || isExecuting}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
          >
            {isExecuting ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play size={14} />
            )}
            Apply Pipeline & Create Version
          </button>
        </div>
      </div>

      {/* Visual Flow Diagram */}
      <div className="py-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-3 min-w-max">
          {/* Start Node */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 shadow text-xs font-bold text-blue-400">
            <CheckCircle2 size={16} /> Dataset Input
          </div>

          <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />

          {steps.length === 0 ? (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-slate-500 text-xs italic">
              No cleaning steps added yet. Click issues or AI recommendations to build pipeline.
            </div>
          ) : (
            steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 flex items-center gap-3 shadow-lg hover:border-blue-500/80 transition-all group">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white block">{step.label}</span>
                    {step.columnName && (
                      <span className="text-[10px] font-mono text-slate-400">Col: {step.columnName}</span>
                    )}
                  </div>

                  <button
                    onClick={() => onRemoveStep(step.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors opacity-80 group-hover:opacity-100"
                    title="Remove step"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
              </React.Fragment>
            ))
          )}

          {/* End Node */}
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-2 shadow text-xs font-bold text-emerald-400">
            <CheckCircle2 size={16} /> Clean Dataset Version
          </div>
        </div>
      </div>
    </div>
  );
}
