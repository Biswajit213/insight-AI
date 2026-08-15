import React, { useState, useMemo } from 'react';
import { X, Sliders, TrendingUp, DollarSign, AlertTriangle, RefreshCw, Check } from 'lucide-react';
import { Button } from '../common/Button';
import { calculateWhatIfSimulation, formatCurrencyImpact } from '../../lib/analyticsEngine';
import type { AIInsight, WhatIfParams } from '../../types';

interface WhatIfSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  insight: AIInsight | null;
}

export const WhatIfSimulatorModal: React.FC<WhatIfSimulatorModalProps> = ({ isOpen, onClose, insight }) => {
  if (!isOpen || !insight) return null;

  const initialParams: WhatIfParams = insight.whatIfParams || {
    baseRevenue: 4800000,
    baseProfit: 960000,
    baseOrders: 12500,
    pricePct: 0,
    volumePct: 0,
    inventoryPct: 0,
    discountPct: 0,
  };

  const [pricePct, setPricePct] = useState(initialParams.pricePct);
  const [volumePct, setVolumePct] = useState(initialParams.volumePct);
  const [inventoryPct, setInventoryPct] = useState(initialParams.inventoryPct);
  const [discountPct, setDiscountPct] = useState(initialParams.discountPct);

  // Deterministically compute simulation results
  const simResult = useMemo(() => {
    return calculateWhatIfSimulation({
      ...initialParams,
      pricePct,
      volumePct,
      inventoryPct,
      discountPct,
    });
  }, [initialParams, pricePct, volumePct, inventoryPct, discountPct]);

  const handleReset = () => {
    setPricePct(0);
    setVolumePct(0);
    setInventoryPct(0);
    setDiscountPct(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">WHAT-IF SIMULATOR</h2>
              <p className="text-xs text-slate-400">Target: {insight.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        {/* Dynamic Metric Prediction Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
            <p className="text-xs text-slate-400 mb-1">Baseline Revenue</p>
            <p className="text-sm font-bold text-slate-300 font-mono">{formatCurrencyImpact(simResult.baseRevenue)}</p>
          </div>
          <div className="p-3 bg-slate-950 border border-blue-500/30 bg-blue-950/20 rounded-xl text-center">
            <p className="text-xs text-blue-300 mb-1">Simulated Revenue</p>
            <p className="text-base font-bold text-blue-400 font-mono">{formatCurrencyImpact(simResult.projectedRevenue)}</p>
          </div>
          <div className="p-3 bg-slate-950 border border-emerald-500/30 bg-emerald-950/20 rounded-xl text-center">
            <p className="text-xs text-emerald-300 mb-1">Expected Growth</p>
            <p className="text-base font-bold text-emerald-400 font-mono">
              {simResult.expectedGrowthPct >= 0 ? '+' : ''}{simResult.expectedGrowthPct}%
            </p>
          </div>
          <div className="p-3 bg-slate-950 border border-violet-500/30 bg-violet-950/20 rounded-xl text-center">
            <p className="text-xs text-violet-300 mb-1">Profit Delta</p>
            <p className="text-base font-bold text-violet-400 font-mono">{formatCurrencyImpact(simResult.profitDelta)}</p>
          </div>
        </div>

        {/* Interactive Sliders */}
        <div className="space-y-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Simulated Parameter Controls</h3>
            <button onClick={handleReset} className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1">
              <RefreshCw size={12} /> Reset Parameters
            </button>
          </div>

          {/* Price Delta % Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">Price Adjustment (%)</span>
              <span className="font-mono font-bold text-blue-400">{pricePct >= 0 ? `+${pricePct}%` : `${pricePct}%`}</span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              value={pricePct}
              onChange={(e) => setPricePct(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Sales Volume Delta % Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">Sales Volume Adjustment (%)</span>
              <span className="font-mono font-bold text-emerald-400">{volumePct >= 0 ? `+${volumePct}%` : `${volumePct}%`}</span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              value={volumePct}
              onChange={(e) => setVolumePct(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Inventory Availability % Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">Inventory Allocation (%)</span>
              <span className="font-mono font-bold text-violet-400">{inventoryPct >= 0 ? `+${inventoryPct}%` : `${inventoryPct}%`}</span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              value={inventoryPct}
              onChange={(e) => setInventoryPct(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
          </div>

          {/* Discount Rate % Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">Discount Rate (%)</span>
              <span className="font-mono font-bold text-amber-400">{discountPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              value={discountPct}
              onChange={(e) => setDiscountPct(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>

        {/* Risk Assessment Banner */}
        <div className="flex items-center justify-between p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className={simResult.riskLevel === 'High' ? 'text-red-400' : 'text-emerald-400'} />
            <span className="text-slate-300">Simulated Operational Risk:</span>
            <span className={`font-bold uppercase ${simResult.riskLevel === 'High' ? 'text-red-400' : simResult.riskLevel === 'Medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {simResult.riskLevel}
            </span>
          </div>
          <span className="text-slate-400 italic font-mono">Calculated deterministically</span>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose} className="bg-slate-800 text-slate-300 border-slate-700">
            Close Simulator
          </Button>
          <Button variant="primary" size="sm" onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white">
            Apply Simulation Results
          </Button>
        </div>
      </div>
    </div>
  );
};
