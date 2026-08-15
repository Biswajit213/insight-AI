import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import type { ValidationRuleItem } from '../../types/cleaning';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  headers: string[];
  onSaveRule: (rule: Omit<ValidationRuleItem, 'id' | 'createdAt' | 'datasetId' | 'isEnabled'>) => void;
}

export function CustomRuleBuilderModal({ isOpen, onClose, headers, onSaveRule }: Props) {
  const [columnName, setColumnName] = useState(headers[0] || '');
  const [operator, setOperator] = useState<ValidationRuleItem['operator']>('greater_than');
  const [value, setValue] = useState('');
  const [minValue, setMinValue] = useState<number | undefined>(0);
  const [maxValue, setMaxValue] = useState<number | undefined>(100);
  const [ruleDescription, setRuleDescription] = useState('');

  useEffect(() => {
    if (headers.length > 0 && (!columnName || !headers.includes(columnName))) {
      setColumnName(headers[0]);
    }
  }, [headers, columnName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetCol = columnName || headers[0];
    if (!targetCol) return;

    const desc = ruleDescription || `${targetCol} constraint: ${operator} ${operator === 'between' ? `${minValue} - ${maxValue}` : value || 'limit'}`;

    onSaveRule({
      columnName: targetCol,
      operator,
      value: value || undefined,
      minValue: operator === 'between' ? minValue : undefined,
      maxValue: operator === 'between' ? maxValue : undefined,
      ruleDescription: desc,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="card w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">BUILD CUSTOM DATA VALIDATION RULE</h3>
            <p className="text-xs text-slate-400">Define domain-specific validation constraints for dataset columns.</p>
          </div>
          <button onClick={onClose} type="button" className="p-1 text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Target Column</label>
            <select
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-medium"
            >
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Validation Operator</label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="greater_than">Greater Than (&gt;)</option>
              <option value="less_than">Less Than (&lt;)</option>
              <option value="between">Between Range (Min - Max)</option>
              <option value="equals">Equals (==)</option>
              <option value="not_equals">Not Equals (!=)</option>
              <option value="contains">Contains Substring</option>
              <option value="is_null">Is Null</option>
              <option value="is_not_null">Is Not Null</option>
            </select>
          </div>

          {operator === 'between' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Minimum Limit</label>
                <input
                  type="number"
                  value={minValue ?? ''}
                  onChange={(e) => setMinValue(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Maximum Limit</label>
                <input
                  type="number"
                  value={maxValue ?? ''}
                  onChange={(e) => setMaxValue(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          ) : operator !== 'is_null' && operator !== 'is_not_null' ? (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Threshold / Pattern Value</label>
              <input
                type="text"
                placeholder="e.g. 0, 100, active..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          ) : null}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Rule Description</label>
            <input
              type="text"
              placeholder="e.g. Revenue must be greater than or equal to 0"
              value={ruleDescription}
              onChange={(e) => setRuleDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-semibold bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all"
            >
              <Check size={14} /> Save & Run Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
