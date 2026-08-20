import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { useDatasets } from '../context/DatasetContext';
import { CleaningApiClient } from '../services/cleaningApi';
import type {
  DataQualityScanResult,
  DataQualityIssueItem,
  DatasetVersionItem,
  CleaningOperationRecord,
  ValidationReport,
  AICleaningSuggestion,
  PreviewCleanResult,
} from '../types/cleaning';

import { DataQualityScoreCard } from '../components/cleaning/DataQualityScoreCard';
import { QualityMetricCards } from '../components/cleaning/QualityMetricCards';
import { DatasetSpreadsheetPreview } from '../components/cleaning/DatasetSpreadsheetPreview';
import { AICleaningAssistantPanel } from '../components/cleaning/AICleaningAssistantPanel';
import { IssueListPanel } from '../components/cleaning/IssueListPanel';
import { CleaningPipelineVisualizer } from '../components/cleaning/CleaningPipelineVisualizer';
import type { PipelineStep } from '../components/cleaning/CleaningPipelineVisualizer';
import { BeforeAfterComparisonModal } from '../components/cleaning/BeforeAfterComparisonModal';
import { CleaningHistoryTable } from '../components/cleaning/CleaningHistoryTable';
import { DatasetVersionSelector } from '../components/cleaning/DatasetVersionSelector';
import { CustomRuleBuilderModal } from '../components/cleaning/CustomRuleBuilderModal';
import { DataQualityReportModal } from '../components/cleaning/DataQualityReportModal';

import {
  Sparkles, Upload, RefreshCw, RotateCcw, RotateCw,
  PlusCircle, FileSpreadsheet, Database,
} from 'lucide-react';
import {
  profileDatasetClientSide,
  generateClientAISuggestions,
  applyCustomRuleClientSide,
} from '../lib/clientDataProfiler';

export default function DataCleaningStudio() {
  const navigate = useNavigate();
  const { id: routeDatasetId } = useParams();
  const { datasets, getDatasetData, updateDatasetData } = useDatasets();

  const [activeDatasetId, setActiveDatasetId] = useState<string>('');
  const [scanResult, setScanResult]           = useState<DataQualityScanResult | null>(null);
  const [aiSuggestions, setAiSuggestions]     = useState<AICleaningSuggestion[]>([]);
  const [versions, setVersions]               = useState<DatasetVersionItem[]>([]);
  const [history, setHistory]                 = useState<CleaningOperationRecord[]>([]);
  const [validation, setValidation]           = useState<ValidationReport | null>(null);
  const [rows, setRows]                       = useState<Record<string, unknown>[]>([]);

  const [isLoadingScan, setIsLoadingScan]         = useState(false);
  const [isLoadingAi, setIsLoadingAi]             = useState(false);
  const [isExecutingPipeline, setIsExecutingPipeline] = useState(false);
  const [selectedIssueFilter, setSelectedIssueFilter] = useState<string | null>(null);

  const [pipelineSteps, setPipelineSteps]   = useState<PipelineStep[]>([]);
  const [previewData, setPreviewData]       = useState<PreviewCleanResult | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen]       = useState(false);
  const [isReportModalOpen, setIsReportModalOpen]   = useState(false);

  const [undoStack, setUndoStack] = useState<PipelineStep[][]>([]);
  const [redoStack, setRedoStack] = useState<PipelineStep[][]>([]);

  // ── Dataset init ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (routeDatasetId) setActiveDatasetId(routeDatasetId);
    else if (datasets.length > 0) setActiveDatasetId(datasets[0].id);
  }, [routeDatasetId, datasets]);

  // ── Load dataset details ──────────────────────────────────────────────────
  const loadDatasetDetails = useCallback(async (dsId: string) => {
    if (!dsId) return;
    setIsLoadingScan(true);

    const dsMeta   = datasets.find((d) => d.id === dsId);
    const dsData   = getDatasetData(dsId);

    const sampleRows: Record<string, unknown>[] = [
      { ID: '01', Name: 'Alex Naskar',    Email: 'alex@example.com',    Revenue: '$1,200', Region: ' North ',      JoinDate: '2025-08-14' },
      { ID: '02', Name: '',               Email: 'invalid-email',        Revenue: 'NULL',   Region: 'north',        JoinDate: '14/08/2025' },
      { ID: '03', Name: 'Bob Smith',      Email: 'bob@example.com',     Revenue: '$1,400', Region: 'NORTH',        JoinDate: '2025-08-15' },
      { ID: '01', Name: 'Alex Naskar',    Email: 'alex@example.com',    Revenue: '$1,200', Region: ' North ',      JoinDate: '2025-08-14' },
      { ID: '05', Name: 'Charlie Brown',  Email: 'charlie@gmail.com',   Revenue: '$98,000',Region: 'North Region', JoinDate: '2025-08-16' },
    ];

    const activeRows = dsData?.rows?.length > 0
      ? (dsData.rows as Record<string, unknown>[])
      : sampleRows;

    setRows(activeRows);

    try {
      const scan  = await CleaningApiClient.runQualityScan(dsId);
      setScanResult(scan);
      const vers  = await CleaningApiClient.getVersions(dsId);
      setVersions(vers);
      const hist  = await CleaningApiClient.getCleaningHistory(dsId);
      setHistory(hist);
      const val   = await CleaningApiClient.validateDataset(dsId);
      setValidation(val);

      setIsLoadingAi(true);
      CleaningApiClient.getAICleaningSuggestions(dsId)
        .then((sug) => setAiSuggestions(sug))
        .catch(() => {
          const clientScan = profileDatasetClientSide(dsId, dsMeta?.name || 'Dataset', activeRows);
          setAiSuggestions(generateClientAISuggestions(clientScan.issues));
        })
        .finally(() => setIsLoadingAi(false));
    } catch {
      const clientScan = profileDatasetClientSide(dsId, dsMeta?.name || 'Dataset', activeRows);
      setScanResult(clientScan);
      setVersions([clientScan.version]);
      setAiSuggestions(generateClientAISuggestions(clientScan.issues));
    } finally {
      setIsLoadingScan(false);
    }
  }, [datasets, getDatasetData]);

  useEffect(() => {
    if (activeDatasetId) loadDatasetDetails(activeDatasetId);
  }, [activeDatasetId, loadDatasetDetails]);

  // ── Pipeline helpers ──────────────────────────────────────────────────────
  const addStepToPipeline = (step: Omit<PipelineStep, 'id'>) => {
    const newStep: PipelineStep = { ...step, id: crypto.randomUUID() };
    setUndoStack((prev) => [...prev, pipelineSteps]);
    setRedoStack([]);
    setPipelineSteps((prev) => [...prev, newStep]);
  };

  const handleRemoveStep = (stepId: string) => {
    setUndoStack((prev) => [...prev, pipelineSteps]);
    setRedoStack([]);
    setPipelineSteps((prev) => prev.filter((s) => s.id !== stepId));
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, pipelineSteps]);
    setPipelineSteps(previous);
    setUndoStack((prev) => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, pipelineSteps]);
    setPipelineSteps(next);
    setRedoStack((prev) => prev.slice(0, -1));
  };

  // ── Full client-side cleaning engine ─────────────────────────────────────
  // Used when backend is unavailable or dataset is not in server memory
  const applyPipelineLocally = useCallback((steps: PipelineStep[], baseRows: Record<string, unknown>[]) => {
    let updated = baseRows.map((r) => ({ ...r }));

    for (const step of steps) {
      const { operationType, columnName, parameters = {} } = step;

      // ── REMOVE_DUPLICATES ──────────────────────────────────────────────
      if (operationType === 'REMOVE_DUPLICATES') {
        const seen = new Set<string>();
        updated = updated.filter((r) => {
          const sig = columnName ? String(r[columnName] ?? '') : JSON.stringify(r);
          if (seen.has(sig)) return false;
          seen.add(sig);
          return true;
        });

      // ── IMPUTE_MISSING / FILL_NULLS ───────────────────────────────────
      } else if ((operationType === 'IMPUTE_MISSING' || operationType === 'FILL_NULLS') && columnName) {
        const strategy    = (parameters.strategy as string) || 'mean';
        const customValue = parameters.customValue;

        const isMissing = (v: unknown) =>
          v === null || v === undefined || String(v).trim() === '' || String(v).toLowerCase() === 'null';

        const validNums = updated
          .map((r) => r[columnName])
          .filter((v) => !isMissing(v))
          .map((v) => Number(String(v).replace(/[$,\s]/g, '')))
          .filter((v) => !isNaN(v));

        let replacement: unknown = customValue ?? 'Unknown';

        if (strategy === 'mean' && validNums.length > 0) {
          replacement = Number((validNums.reduce((a, b) => a + b, 0) / validNums.length).toFixed(2));
        } else if (strategy === 'median' && validNums.length > 0) {
          const sorted = [...validNums].sort((a, b) => a - b);
          const mid    = Math.floor(sorted.length / 2);
          replacement  = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        } else if (strategy === 'mode') {
          const freq: Record<string, number> = {};
          updated.forEach((r) => {
            const v = r[columnName];
            if (!isMissing(v)) { const s = String(v).trim(); freq[s] = (freq[s] || 0) + 1; }
          });
          replacement = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Unknown';
        }

        let prevVal: unknown = replacement;
        updated = updated.map((r) => {
          const copy = { ...r };
          const cur  = copy[columnName];
          if (strategy === 'forward_fill') {
            if (!isMissing(cur)) prevVal = cur;
            else copy[columnName] = prevVal;
          } else if (isMissing(cur)) {
            copy[columnName] = replacement;
          }
          return copy;
        });

      // ── STANDARDIZE_TEXT / CATEGORY / TRIM_WHITESPACE ─────────────────
      } else if (
        (operationType === 'STANDARDIZE_TEXT' ||
         operationType === 'STANDARDIZE_CATEGORY' ||
         operationType === 'TRIM_WHITESPACE') && columnName
      ) {
        const casing      = (parameters.casing as string) || 'title';
        const categoryMap = (parameters.categoryMap as Record<string, string>) || {};

        updated = updated.map((r) => {
          const copy = { ...r };
          if (copy[columnName] != null) {
            let str = String(copy[columnName]).trim().replace(/\s+/g, ' ');
            if (categoryMap[str]) {
              str = categoryMap[str];
            } else if (parameters.target && str.toLowerCase() === String(parameters.target).toLowerCase()) {
              str = String(parameters.target);
            } else if (casing === 'lowercase') str = str.toLowerCase();
            else if (casing === 'uppercase') str = str.toUpperCase();
            else if (casing === 'title')
              str = str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
            copy[columnName] = str;
          }
          return copy;
        });

      // ── CAST_TYPE / CONVERT_FORMAT ────────────────────────────────────
      } else if ((operationType === 'CAST_TYPE' || operationType === 'CONVERT_FORMAT') && columnName) {
        const targetType = (parameters.targetType as string) || 'NUMBER';
        updated = updated.map((r) => {
          const copy = { ...r };
          const raw  = copy[columnName];
          if (raw == null) return copy;
          const str  = String(raw).trim();
          if (['NUMBER', 'INTEGER', 'DECIMAL', 'CURRENCY'].includes(targetType)) {
            const n = Number(str.replace(/[$,\s₹€£%]/g, ''));
            if (!isNaN(n)) copy[columnName] = targetType === 'INTEGER' ? Math.round(n) : n;
          } else if (targetType === 'BOOLEAN') {
            if (['true', '1', 'yes', 'y'].includes(str.toLowerCase()))  copy[columnName] = true;
            else if (['false', '0', 'no', 'n'].includes(str.toLowerCase())) copy[columnName] = false;
          } else if (targetType === 'DATE') {
            const ts = Date.parse(str);
            if (!isNaN(ts)) {
              const d  = new Date(ts);
              const yy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              copy[columnName] = `${yy}-${mm}-${dd}`;
            }
          }
          return copy;
        });

      // ── HANDLE_OUTLIERS / REMOVE_OUTLIERS ─────────────────────────────
      } else if ((operationType === 'HANDLE_OUTLIERS' || operationType === 'REMOVE_OUTLIERS') && columnName) {
        const strategy = (parameters.strategy as string) || 'cap';
        const nums     = updated.map((r) => Number(r[columnName])).filter((v) => !isNaN(v)).sort((a, b) => a - b);

        if (nums.length >= 5) {
          const q1  = nums[Math.floor(nums.length * 0.25)];
          const q3  = nums[Math.floor(nums.length * 0.75)];
          const iqr = q3 - q1;
          const lo  = q1 - 1.5 * iqr;
          const hi  = q3 + 1.5 * iqr;
          const med = nums[Math.floor(nums.length / 2)];

          if (strategy === 'remove') {
            updated = updated.filter((r) => {
              const v = Number(r[columnName]);
              return isNaN(v) || (v >= lo && v <= hi);
            });
          } else {
            updated = updated.map((r) => {
              const copy = { ...r };
              const v    = Number(copy[columnName]);
              if (!isNaN(v)) {
                if (v < lo) copy[columnName] = strategy === 'cap' ? lo : med;
                else if (v > hi) copy[columnName] = strategy === 'cap' ? hi : med;
              }
              return copy;
            });
          }
        }

      // ── REMOVE_COLUMN ─────────────────────────────────────────────────
      } else if (operationType === 'REMOVE_COLUMN' && columnName) {
        updated = updated.map((r) => { const copy = { ...r }; delete copy[columnName]; return copy; });
      }
    }

    // Persist cleaned rows to DatasetContext
    const dsMeta = datasets.find((d) => d.id === activeDatasetId);
    const cols   = updated.length > 0
      ? Object.keys(updated[0]).map((k) => ({
          name:        k,
          type:        (typeof updated[0][k] === 'number' ? 'number' : 'string') as any,
          nullCount:   0,
          uniqueCount: new Set(updated.map((r) => r[k])).size,
          sample:      updated.slice(0, 3).map((r) => r[k]) as any[],
        }))
      : [];
    updateDatasetData(activeDatasetId, cols, updated as any[]);

    // Update local state
    setRows(updated);

    const newScan    = profileDatasetClientSide(activeDatasetId, dsMeta?.name || 'Dataset', updated);
    setScanResult(newScan);

    const newVerNum  = versions.length + 1;
    const newVerItem: DatasetVersionItem = {
      id:               `v${newVerNum}_${Date.now()}`,
      datasetId:        activeDatasetId,
      versionNumber:    newVerNum,
      versionLabel:     `v${newVerNum} Cleaned (${steps.length} op${steps.length !== 1 ? 's' : ''})`,
      storagePath:      '',
      rowCount:         updated.length,
      columnCount:      updated.length > 0 ? Object.keys(updated[0]).length : 0,
      dataQualityScore: newScan.scores.overallScore,
      createdAt:        new Date().toISOString(),
    };
    setVersions((prev) => [newVerItem, ...prev]);
    setHistory((prev) => [
      {
        id:               crypto.randomUUID(),
        datasetId:        activeDatasetId,
        datasetVersionId: newVerItem.id,
        operationType:    steps[0]?.operationType || 'PIPELINE',
        columnName:       steps[0]?.columnName,
        parameters:       steps[0]?.parameters || {},
        rowsAffected:     steps.length,
        beforeSample:     [],
        afterSample:      [],
        createdAt:        new Date().toISOString(),
      },
      ...prev,
    ]);
    setPipelineSteps([]);
  }, [activeDatasetId, datasets, versions, updateDatasetData]);

  // ── Preview pipeline ──────────────────────────────────────────────────────
  const handlePreviewPipeline = async () => {
    if (!activeDatasetId || pipelineSteps.length === 0) return;
    try {
      const res = await CleaningApiClient.previewClean(activeDatasetId, pipelineSteps);
      setPreviewData(res);
      setIsPreviewModalOpen(true);
    } catch {
      // Client-side preview
      const beforeSample = rows.slice(0, 15);
      const afterRows    = [...beforeSample.map((r) => ({ ...r }))];
      const diffs: any[] = [];
      let rowsAff        = 0;

      for (const step of pipelineSteps) {
        if (step.operationType === 'REMOVE_DUPLICATES') {
          const seen = new Set<string>();
          const filtered = afterRows.filter((r) => {
            const sig = JSON.stringify(r);
            if (seen.has(sig)) return false;
            seen.add(sig);
            return true;
          });
          rowsAff += afterRows.length - filtered.length;
        } else if (step.operationType === 'IMPUTE_MISSING' && step.columnName) {
          afterRows.forEach((r, i) => {
            const v = r[step.columnName!];
            if (v === null || v === undefined || String(v).trim() === '') {
              const rep = step.parameters?.customValue ?? (step.parameters?.strategy === 'median' ? 0 : 'Unknown');
              diffs.push({ rowIndex: i, columnName: step.columnName!, before: v, after: rep });
              r[step.columnName!] = rep;
              rowsAff++;
            }
          });
        }
      }

      setPreviewData({
        beforeRows: beforeSample,
        afterRows,
        rowsAffected: Math.max(1, rowsAff),
        columnsAffected: 1,
        sampleDiffs: diffs.slice(0, 10),
      });
      setIsPreviewModalOpen(true);
    }
  };

  // ── Execute pipeline (from pipeline visualizer or modal confirm) ──────────
  const handleExecutePipeline = async () => {
    if (!activeDatasetId || pipelineSteps.length === 0) return;
    setIsExecutingPipeline(true);
    try {
      await CleaningApiClient.cleanDataset(activeDatasetId, pipelineSteps);
      setIsPreviewModalOpen(false);
      setPipelineSteps([]);
      loadDatasetDetails(activeDatasetId);
    } catch {
      // API failed — fall back to client-side full engine
      applyPipelineLocally(pipelineSteps, rows);
      setIsPreviewModalOpen(false);
    } finally {
      setIsExecutingPipeline(false);
    }
  };

  // ── Apply all AI suggestions — executes immediately ───────────────────────
  const handleApplyAllAISuggestions = async (sugList: AICleaningSuggestion[]) => {
    if (sugList.length === 0) return;

    const newSteps: PipelineStep[] = sugList.map((sug) => ({
      id:            crypto.randomUUID(),
      operationType: sug.actionParams.operationType,
      columnName:    sug.columnName,
      label:         sug.recommendation,
      parameters:    sug.actionParams.parameters,
    }));

    // Show steps in pipeline UI
    setUndoStack((prev) => [...prev, pipelineSteps]);
    setRedoStack([]);
    setPipelineSteps(newSteps);

    // Execute immediately
    setIsExecutingPipeline(true);
    try {
      await CleaningApiClient.cleanDataset(
        activeDatasetId,
        newSteps.map((s) => ({
          operationType: s.operationType,
          columnName:    s.columnName,
          parameters:    s.parameters,
        })),
        `AI Recommended (${newSteps.length} fixes)`
      );
      setPipelineSteps([]);
      loadDatasetDetails(activeDatasetId);
    } catch {
      // API unavailable — apply locally
      applyPipelineLocally(newSteps, rows);
    } finally {
      setIsExecutingPipeline(false);
    }
  };

  // ── Single issue quick-fix ────────────────────────────────────────────────
  const handleApplySingleFix = (issue: DataQualityIssueItem, params?: Record<string, unknown>) => {
    addStepToPipeline({
      operationType: issue.recommendedAction.actionType,
      columnName:    issue.columnName,
      label:         issue.recommendedAction.label,
      parameters:    { ...(issue.recommendedAction.parameters || {}), ...(params || {}) },
    });
  };

  // ── Rollback version ──────────────────────────────────────────────────────
  const handleRollbackVersion = async (vId: string) => {
    if (!activeDatasetId) return;
    try {
      await CleaningApiClient.rollbackVersion(activeDatasetId, vId);
      loadDatasetDetails(activeDatasetId);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  // ── Custom rule ───────────────────────────────────────────────────────────
  const handleSaveCustomRule = async (rule: any) => {
    if (!activeDatasetId) return;
    try {
      await CleaningApiClient.addCustomRule(activeDatasetId, rule);
      await loadDatasetDetails(activeDatasetId);
    } catch {
      if (scanResult) setScanResult(applyCustomRuleClientSide(scanResult, rule, rows));
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (!activeDatasetId) return;
    window.open(`/api/v1/datasets/${activeDatasetId}/export?format=${format}`, '_blank');
  };

  const handleSendToAIAnalysis = () => {
    navigate('/ai-insights', {
      state: {
        datasetId:        activeDatasetId,
        datasetVersionId: scanResult?.version?.id,
        versionLabel:     scanResult?.version?.versionLabel || 'v2 Cleaned',
      },
    });
  };

  const currentDataset = datasets.find((d) => d.id === activeDatasetId) || datasets[0];
  const headers        = rows.length > 0 ? Object.keys(rows[0]) : [];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#0b1120] text-slate-100">
      <Header
        title="DATA CLEANING STUDIO"
        subtitle="Detect, fix, validate, and improve the quality of your datasets."
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Top Control Bar */}
        <div className="card p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold">
              <Database size={15} className="text-blue-400" />
              <select
                value={activeDatasetId}
                onChange={(e) => setActiveDatasetId(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                    {d.name} ({d.rows?.toLocaleString()} rows)
                  </option>
                ))}
              </select>
            </div>

            {scanResult && (
              <DatasetVersionSelector
                versions={versions}
                activeVersionId={scanResult.version.id}
                onSelectVersion={(v) => {
                  CleaningApiClient.runQualityScan(activeDatasetId, v.id).then(setScanResult);
                }}
              />
            )}

            <button
              onClick={() => navigate('/app/datasets')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
            >
              <Upload size={14} /> Upload Dataset
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button disabled={undoStack.length === 0} onClick={handleUndo} className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30" title="Undo"><RotateCcw size={14} /></button>
              <button disabled={redoStack.length === 0} onClick={handleRedo} className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30" title="Redo"><RotateCw size={14} /></button>
            </div>

            <button onClick={() => setIsRuleModalOpen(true)} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5">
              <PlusCircle size={14} /> Custom Rule
            </button>

            <button onClick={() => loadDatasetDetails(activeDatasetId)} disabled={isLoadingScan} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20">
              <RefreshCw size={14} className={isLoadingScan ? 'animate-spin' : ''} /> Run Scan
            </button>

            <button onClick={() => setIsReportModalOpen(true)} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5">
              <FileSpreadsheet size={14} /> Quality Report
            </button>

            <button onClick={handleSendToAIAnalysis} className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/30 transition-all flex items-center gap-1.5">
              <Sparkles size={14} /> Analyze with AI →
            </button>
          </div>
        </div>

        {/* Empty state */}
        {!currentDataset ? (
          <div className="card p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4 max-w-lg mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/30">
              <Database size={32} />
            </div>
            <h3 className="text-xl font-bold text-white">🧹 Ready to Clean Your Data?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload a CSV, XLSX or JSON dataset to automatically profile columns and detect data quality issues.
            </p>
            <button onClick={() => navigate('/app/datasets')} className="px-6 py-3 rounded-2xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all inline-flex items-center gap-2">
              <Upload size={16} /> Upload Dataset
            </button>
          </div>
        ) : (
          <>
            {scanResult && <DataQualityScoreCard scores={scanResult.scores} versionLabel={scanResult.version.versionLabel} />}

            {scanResult && (
              <QualityMetricCards
                counts={scanResult.counts}
                selectedFilter={selectedIssueFilter}
                onSelectFilter={setSelectedIssueFilter}
              />
            )}

            <AICleaningAssistantPanel
              suggestions={aiSuggestions}
              isLoading={isLoadingAi || isExecutingPipeline}
              onApplyAll={handleApplyAllAISuggestions}
              onReviewSuggestion={(sug) =>
                addStepToPipeline({
                  operationType: sug.actionParams.operationType,
                  columnName:    sug.columnName,
                  label:         sug.recommendation,
                  parameters:    sug.actionParams.parameters,
                })
              }
            />

            <DatasetSpreadsheetPreview headers={headers} rows={rows} profiles={scanResult?.profiles || []} />

            <CleaningPipelineVisualizer
              steps={pipelineSteps}
              onRemoveStep={handleRemoveStep}
              onPreviewPipeline={handlePreviewPipeline}
              onExecutePipeline={handleExecutePipeline}
              isExecuting={isExecutingPipeline}
            />

            {scanResult && (
              <IssueListPanel
                issues={scanResult.issues}
                selectedFilter={selectedIssueFilter}
                onApplySingleFix={handleApplySingleFix}
              />
            )}

            <CleaningHistoryTable history={history} onRollbackVersion={handleRollbackVersion} />
          </>
        )}
      </div>

      {/* Modals */}
      <BeforeAfterComparisonModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        preview={previewData}
        onConfirmApply={handleExecutePipeline}
        isExecuting={isExecutingPipeline}
      />

      <CustomRuleBuilderModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        headers={headers}
        onSaveRule={handleSaveCustomRule}
      />

      <DataQualityReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        datasetName={currentDataset?.name || 'Dataset'}
        scanResult={scanResult}
        validation={validation}
        history={history}
        onExport={handleExport}
      />
    </div>
  );
}
