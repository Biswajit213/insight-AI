import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Download,
  Plus,
  Trash2,
  Undo2,
  Redo2,
  Search,
  Check,
  Edit2,
  X,
  FileSpreadsheet
} from 'lucide-react';
import Papa from 'papaparse';
import { Button } from '../components/common/Button';
import { useDatasets } from '../context/DatasetContext';
import { cn, formatBytes, formatNumber } from '../lib/utils';
import type { DataColumn, DataRow } from '../types';

// Convert zero-indexed column number to Excel letter (0 -> A, 1 -> B, 25 -> Z, 26 -> AA)
function getColumnLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

export default function ExcelEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { datasets, getDataset, getDatasetData, updateDatasetData } = useDatasets();

  const dataset = (id ? getDataset(id) : undefined) || datasets[0];

  // Grid Data State
  const [columns, setColumns] = useState<DataColumn[]>([]);
  const [rows, setRows] = useState<DataRow[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Undo / Redo stacks
  const [history, setHistory] = useState<{ columns: DataColumn[]; rows: DataRow[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ columns: DataColumn[]; rows: DataRow[] }[]>([]);

  // Selection & Editing State
  const [activeCell, setActiveCell] = useState<{ r: number; c: number } | null>({ r: 0, c: 0 });
  const [editingCell, setEditingCell] = useState<{ r: number; c: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [formulaValue, setFormulaValue] = useState<string>('');

  // Column renaming modal/inline
  const [renamingColIndex, setRenamingColIndex] = useState<number | null>(null);
  const [newColName, setNewColName] = useState<string>('');
  const [newColType, setNewColType] = useState<'string' | 'number' | 'date' | 'boolean'>('string');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const cellInputRef = useRef<HTMLInputElement>(null);
  const formulaInputRef = useRef<HTMLInputElement>(null);

  // Initialize columns and rows from context
  useEffect(() => {
    if (dataset) {
      const data = getDatasetData(dataset.id);
      let loadedRows = data.rows || [];
      let loadedCols = data.columns || [];

      if ((!loadedCols || loadedCols.length === 0) && loadedRows.length > 0) {
        const fields = Object.keys(loadedRows[0]);
        loadedCols = fields.map((f) => ({
          name: f,
          type: typeof loadedRows[0][f] === 'number' ? 'number' : 'string',
          nullCount: 0,
          uniqueCount: new Set(loadedRows.map((r) => r[f])).size,
          sample: loadedRows.slice(0, 3).map((r) => r[f] as any),
        }));
      }

      setColumns(loadedCols);
      setRows(loadedRows);
      setHistory([]);
      setRedoStack([]);
      setHasUnsavedChanges(false);
    }
  }, [dataset?.id]);

  // Helper to record history before mutating state
  const recordHistory = useCallback(() => {
    setHistory((prev) => [...prev, { columns: [...columns], rows: rows.map((r) => ({ ...r })) }]);
    setRedoStack([]);
    setHasUnsavedChanges(true);
  }, [columns, rows]);

  // Handle cell edit save
  const commitCellEdit = useCallback(() => {
    if (!editingCell) return;
    const { r, c } = editingCell;
    const col = columns[c];
    if (!col) return;

    recordHistory();

    const updatedRows = [...rows];
    let val: any = editValue;

    // Evaluate simple formulas if starting with '='
    if (typeof editValue === 'string' && editValue.startsWith('=')) {
      const formulaUpper = editValue.toUpperCase().trim();
      if (formulaUpper.startsWith('=SUM(')) {
        const colTarget = formulaUpper.replace('=SUM(', '').replace(')', '').trim();
        const numericCol = columns.find((cn) => cn.name.toUpperCase() === colTarget);
        if (numericCol) {
          const sum = rows.reduce((acc, row) => acc + (Number(row[numericCol.name]) || 0), 0);
          val = sum;
        }
      } else if (formulaUpper.startsWith('=AVG(') || formulaUpper.startsWith('=AVERAGE(')) {
        const colTarget = formulaUpper.replace(/=AVG\(|=AVERAGE\(/, '').replace(')', '').trim();
        const numericCol = columns.find((cn) => cn.name.toUpperCase() === colTarget);
        if (numericCol && rows.length > 0) {
          const sum = rows.reduce((acc, row) => acc + (Number(row[numericCol.name]) || 0), 0);
          val = Math.round((sum / rows.length) * 100) / 100;
        }
      } else if (formulaUpper.startsWith('=UPPER(')) {
        const innerText = editValue.slice(7, editValue.length - 1);
        val = innerText.toUpperCase();
      } else if (formulaUpper.startsWith('=LOWER(')) {
        const innerText = editValue.slice(7, editValue.length - 1);
        val = innerText.toLowerCase();
      }
    } else if (col.type === 'number') {
      const num = Number(editValue);
      val = editValue === '' ? null : isNaN(num) ? editValue : num;
    }

    updatedRows[r] = {
      ...updatedRows[r],
      [col.name]: val,
    };

    setRows(updatedRows);
    setEditingCell(null);
  }, [editingCell, editValue, columns, rows, recordHistory]);

  // Sync formula bar input when active cell changes
  useEffect(() => {
    if (activeCell && rows[activeCell.r] && columns[activeCell.c]) {
      const colName = columns[activeCell.c].name;
      const rawVal = rows[activeCell.r][colName];
      setFormulaValue(rawVal === null || rawVal === undefined ? '' : String(rawVal));
    }
  }, [activeCell, rows, columns]);

  // Undo action
  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setRedoStack((prev) => [...prev, { columns, rows }]);
    setColumns(last.columns);
    setRows(last.rows);
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setHasUnsavedChanges(true);
  };

  // Redo action
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((prev) => [...prev, { columns, rows }]);
    setColumns(next.columns);
    setRows(next.rows);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setHasUnsavedChanges(true);
  };

  // Add Row
  const handleAddRow = (index?: number) => {
    recordHistory();
    const newRow: DataRow = {};
    columns.forEach((col) => {
      newRow[col.name] = col.type === 'number' ? 0 : '';
    });

    const targetIdx = index !== undefined ? index : rows.length;
    const nextRows = [...rows];
    nextRows.splice(targetIdx, 0, newRow);
    setRows(nextRows);
    setActiveCell({ r: targetIdx, c: 0 });
  };

  // Delete Row
  const handleDeleteRow = (index: number) => {
    if (rows.length <= 1) return;
    recordHistory();
    const nextRows = rows.filter((_, idx) => idx !== index);
    setRows(nextRows);
    if (activeCell && activeCell.r >= nextRows.length) {
      setActiveCell({ r: Math.max(0, nextRows.length - 1), c: activeCell.c });
    }
  };

  // Add Column
  const handleAddColumn = () => {
    recordHistory();
    const newColNum = columns.length + 1;
    let colName = `New_Column_${newColNum}`;
    let counter = 1;
    while (columns.some((c) => c.name === colName)) {
      colName = `New_Column_${newColNum}_${counter++}`;
    }

    const newCol: DataColumn = {
      name: colName,
      type: 'string',
      nullCount: rows.length,
      uniqueCount: 0,
      sample: [],
    };

    setColumns([...columns, newCol]);
    setRows(rows.map((r) => ({ ...r, [colName]: '' })));
  };

  // Delete Column
  const handleDeleteColumn = (colIndex: number) => {
    if (columns.length <= 1) return;
    recordHistory();
    const colToDelete = columns[colIndex];
    const nextCols = columns.filter((_, idx) => idx !== colIndex);
    const nextRows = rows.map((r) => {
      const clone = { ...r };
      delete clone[colToDelete.name];
      return clone;
    });

    setColumns(nextCols);
    setRows(nextRows);
    if (activeCell && activeCell.c >= nextCols.length) {
      setActiveCell({ r: activeCell.r, c: Math.max(0, nextCols.length - 1) });
    }
  };

  // Rename Column
  const handleRenameColumnSave = () => {
    if (renamingColIndex === null || !newColName.trim()) return;
    const oldCol = columns[renamingColIndex];
    const trimmedNewName = newColName.trim();

    if (oldCol.name === trimmedNewName && oldCol.type === newColType) {
      setRenamingColIndex(null);
      return;
    }

    recordHistory();

    const nextCols = columns.map((col, idx) => {
      if (idx === renamingColIndex) {
        return { ...col, name: trimmedNewName, type: newColType };
      }
      return col;
    });

    const nextRows = rows.map((r) => {
      const clone: DataRow = {};
      Object.keys(r).forEach((k) => {
        if (k === oldCol.name) {
          clone[trimmedNewName] = r[k];
        } else {
          clone[k] = r[k];
        }
      });
      return clone;
    });

    setColumns(nextCols);
    setRows(nextRows);
    setRenamingColIndex(null);
  };

  // Save to context
  const handleSaveChanges = () => {
    if (!dataset) return;
    updateDatasetData(dataset.id, columns, rows);
    setHasUnsavedChanges(false);
    setSaveSuccessMessage('Dataset changes saved successfully!');
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!rows || rows.length === 0) return;
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', dataset?.fileName || `${dataset?.name || 'dataset'}_edited.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Keyboard navigation inside grid
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!activeCell) return;

    if (editingCell) {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitCellEdit();
        if (activeCell.r < rows.length - 1) {
          setActiveCell({ r: activeCell.r + 1, c: activeCell.c });
        }
      } else if (e.key === 'Escape') {
        setEditingCell(null);
      }
      return;
    }

    // Hotkeys outside edit mode
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      handleSaveChanges();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      handleUndo();
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeCell.r > 0) setActiveCell({ r: activeCell.r - 1, c: activeCell.c });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeCell.r < rows.length - 1) setActiveCell({ r: activeCell.r + 1, c: activeCell.c });
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (activeCell.c > 0) setActiveCell({ r: activeCell.r, c: activeCell.c - 1 });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (activeCell.c < columns.length - 1) setActiveCell({ r: activeCell.r, c: activeCell.c + 1 });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const colName = columns[activeCell.c].name;
      setEditValue(String(rows[activeCell.r][colName] ?? ''));
      setEditingCell(activeCell);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        if (activeCell.c > 0) setActiveCell({ r: activeCell.r, c: activeCell.c - 1 });
      } else {
        if (activeCell.c < columns.length - 1) setActiveCell({ r: activeCell.r, c: activeCell.c + 1 });
      }
    }
  };

  // Filtered rows for search
  const filteredRows = useMemo(() => {
    if (!searchTerm) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some((val) => String(val ?? '').toLowerCase().includes(term))
    );
  }, [rows, searchTerm]);

  // Paginated Rows
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  // Active cell reference string (e.g., A1, B4)
  const activeCellRef = useMemo(() => {
    if (!activeCell) return 'A1';
    const colLetter = getColumnLetter(activeCell.c);
    const rowNum = activeCell.r + 1;
    return `${colLetter}${rowNum}`;
  }, [activeCell]);

  // Active cell calculated statistics
  const activeColStats = useMemo(() => {
    if (!activeCell || !columns[activeCell.c]) return null;
    const colName = columns[activeCell.c].name;
    const numericVals = rows
      .map((r) => Number(r[colName]))
      .filter((v) => !isNaN(v) && v !== null && v !== undefined);

    if (numericVals.length === 0) return null;
    const sum = numericVals.reduce((a, b) => a + b, 0);
    const avg = sum / numericVals.length;
    return {
      sum: formatNumber(Math.round(sum * 100) / 100),
      avg: formatNumber(Math.round(avg * 100) / 100),
      count: numericVals.length,
    };
  }, [activeCell, columns, rows]);

  if (!dataset) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Dataset not found.</p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/data-sources')}>
          Back to Data Sources
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Top Navigation Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/data-sources/${dataset.id}`)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Back to Dataset"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white leading-tight">{dataset.name}</h1>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Excel View Mode
                </span>
                {hasUnsavedChanges && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Unsaved changes
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{dataset.fileName} · {formatBytes(dataset.sizeBytes)}</p>
            </div>
          </div>
        </div>

        {/* Save / Export buttons */}
        <div className="flex items-center gap-3">
          {saveSuccessMessage && (
            <div className="flex items-center gap-1.5 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg animate-fadeIn">
              <Check size={14} />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            icon={<Download size={14} />}
            onClick={handleExportCSV}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Save size={14} />}
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges}
            className={cn(
              'shadow-lg transition-all',
              hasUnsavedChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                : 'bg-slate-800 text-slate-500 border-slate-800 cursor-not-allowed'
            )}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Excel Ribbon Toolbar */}
      <div className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/60 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center bg-slate-900/80 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="p-1.5 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={14} />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={14} />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Add / Delete Row */}
          <button
            onClick={() => handleAddRow()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/50 transition-colors font-medium"
          >
            <Plus size={13} className="text-emerald-400" />
            <span>Add Row</span>
          </button>

          {activeCell && (
            <button
              onClick={() => handleDeleteRow(activeCell.r)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-red-500/20 hover:text-red-300 text-slate-300 border border-slate-600/50 transition-colors"
              title="Delete Active Row"
            >
              <Trash2 size={13} className="text-red-400" />
              <span>Delete Row</span>
            </button>
          )}

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Add / Delete Column */}
          <button
            onClick={handleAddColumn}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/50 transition-colors font-medium"
          >
            <Plus size={13} className="text-blue-400" />
            <span>Add Column</span>
          </button>

          {activeCell && columns[activeCell.c] && (
            <>
              <button
                onClick={() => {
                  setRenamingColIndex(activeCell.c);
                  setNewColName(columns[activeCell.c].name);
                  setNewColType(columns[activeCell.c].type);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/50 transition-colors"
              >
                <Edit2 size={13} className="text-amber-400" />
                <span>Rename Column</span>
              </button>

              <button
                onClick={() => handleDeleteColumn(activeCell.c)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-red-500/20 hover:text-red-300 text-slate-300 border border-slate-600/50 transition-colors"
              >
                <Trash2 size={13} className="text-red-400" />
                <span>Delete Col</span>
              </button>
            </>
          )}
        </div>

        {/* Search Input */}
        <div className="relative flex items-center min-w-[200px]">
          <Search size={14} className="absolute left-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search spreadsheet cells..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900/90 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 text-slate-400 hover:text-white"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Formula Bar (`fx`) */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-1.5 flex items-center gap-3">
        {/* Cell Reference indicator */}
        <div className="w-16 bg-slate-800 border border-slate-700 text-center py-1 rounded text-xs font-mono font-semibold text-emerald-400 select-none">
          {activeCellRef}
        </div>

        <div className="text-slate-500 font-serif italic text-sm font-semibold select-none">
          fx
        </div>

        <div className="flex-1 relative">
          <input
            ref={formulaInputRef}
            type="text"
            value={editingCell ? editValue : formulaValue}
            onChange={(e) => {
              if (editingCell) {
                setEditValue(e.target.value);
              } else if (activeCell) {
                setEditValue(e.target.value);
                setEditingCell(activeCell);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitCellEdit();
              }
            }}
            placeholder="Enter value or formula (e.g. =SUM(Sales), =AVG(Quantity), =UPPER(text))"
            className="w-full bg-slate-950 border border-slate-700/80 rounded px-3 py-1 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 overflow-auto bg-slate-950 relative select-none">
        <table className="w-full border-collapse text-xs font-sans">
          <thead>
            {/* Row 1: Excel Column Letters Header */}
            <tr className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
              <th className="w-12 bg-slate-900 border-r border-b border-slate-800 text-center py-1 text-[11px] font-mono text-slate-500 font-semibold sticky left-0 z-30">
                #
              </th>
              {columns.map((col, cIdx) => {
                const isActive = activeCell?.c === cIdx;
                return (
                  <th
                    key={`letter_${cIdx}`}
                    onClick={() => setActiveCell({ r: activeCell?.r || 0, c: cIdx })}
                    className={cn(
                      'min-w-[130px] border-r border-slate-800 text-center py-1 font-mono text-[11px] font-bold cursor-pointer transition-colors',
                      isActive ? 'bg-blue-900/40 text-blue-400 border-b-2 border-b-blue-500' : 'text-slate-400 hover:bg-slate-800'
                    )}
                  >
                    {getColumnLetter(cIdx)}
                  </th>
                );
              })}
            </tr>

            {/* Row 2: Field Name & Data Type Header */}
            <tr className="bg-slate-900/90 border-b border-slate-700 sticky top-[25px] z-20">
              <th className="w-12 bg-slate-900 border-r border-b border-slate-700 text-center py-2 text-[10px] text-slate-500 font-mono sticky left-0 z-30">
                FIELD
              </th>
              {columns.map((col, cIdx) => {
                const isActive = activeCell?.c === cIdx;
                return (
                  <th
                    key={col.name}
                    onDoubleClick={() => {
                      setRenamingColIndex(cIdx);
                      setNewColName(col.name);
                      setNewColType(col.type);
                    }}
                    className={cn(
                      'px-3 py-2 text-left border-r border-slate-800 transition-colors cursor-pointer group',
                      isActive ? 'bg-blue-950/60 text-white' : 'text-slate-300 hover:bg-slate-800/80'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-slate-200 truncate max-w-[110px]" title={col.name}>
                        {col.name}
                      </span>
                      <span
                        className={cn(
                          'text-[9px] px-1.5 py-0.2 rounded font-mono uppercase tracking-wider',
                          col.type === 'number'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                            : col.type === 'date'
                            ? 'bg-purple-950 text-purple-400 border border-purple-800/50'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        )}
                      >
                        {col.type}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60">
            {paginatedRows.map((row, rIdx) => {
              const actualRowIdx = (page - 1) * pageSize + rIdx;
              const isRowActive = activeCell?.r === actualRowIdx;

              return (
                <tr
                  key={`row_${actualRowIdx}`}
                  className={cn(
                    'hover:bg-slate-900/40 transition-colors',
                    isRowActive ? 'bg-slate-900/30' : ''
                  )}
                >
                  {/* Row Number Column */}
                  <td
                    onClick={() => setActiveCell({ r: actualRowIdx, c: activeCell?.c || 0 })}
                    className={cn(
                      'w-12 bg-slate-900/90 border-r border-slate-800 text-center py-1.5 font-mono text-[11px] cursor-pointer sticky left-0 z-10 transition-colors',
                      isRowActive ? 'bg-blue-900/40 text-blue-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                    )}
                  >
                    {actualRowIdx + 1}
                  </td>

                  {/* Table Cells */}
                  {columns.map((col, cIdx) => {
                    const isSelected = activeCell?.r === actualRowIdx && activeCell?.c === cIdx;
                    const isEditing = editingCell?.r === actualRowIdx && editingCell?.c === cIdx;
                    const cellVal = row[col.name];
                    const displayVal = cellVal === null || cellVal === undefined ? '' : String(cellVal);

                    return (
                      <td
                        key={`cell_${actualRowIdx}_${cIdx}`}
                        onClick={() => {
                          setActiveCell({ r: actualRowIdx, c: cIdx });
                        }}
                        onDoubleClick={() => {
                          setActiveCell({ r: actualRowIdx, c: cIdx });
                          setEditingCell({ r: actualRowIdx, c: cIdx });
                          setEditValue(displayVal);
                        }}
                        className={cn(
                          'px-3 py-1.5 border-r border-slate-800/80 relative text-xs font-mono transition-all',
                          col.type === 'number' ? 'text-right' : 'text-left',
                          isSelected && !isEditing ? 'outline outline-2 outline-blue-500 -outline-offset-1 bg-blue-950/40 z-10' : '',
                          cellVal === null || cellVal === '' ? 'text-slate-600 italic' : 'text-slate-200'
                        )}
                      >
                        {isEditing ? (
                          <input
                            ref={cellInputRef}
                            type="text"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitCellEdit}
                            className="w-full bg-blue-950 text-white font-mono text-xs px-1 py-0.5 border border-blue-400 focus:outline-none rounded"
                          />
                        ) : (
                          <span className="truncate block">
                            {cellVal === null || cellVal === '' ? '(empty)' : displayVal}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Status Bar */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 rounded font-medium text-slate-300">
            <span>Sheet1</span>
          </div>

          <div>Total Rows: <strong className="text-slate-200 font-mono">{formatNumber(rows.length)}</strong></div>
          <div>Columns: <strong className="text-slate-200 font-mono">{columns.length}</strong></div>

          {searchTerm && (
            <div className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Matching search: {filteredRows.length} rows
            </div>
          )}
        </div>

        {/* Selected Cell Stat summary */}
        {activeColStats && (
          <div className="flex items-center gap-3 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700 font-mono text-[11px]">
            <div><span className="text-slate-500">SUM:</span> <strong className="text-emerald-400">{activeColStats.sum}</strong></div>
            <div><span className="text-slate-500 font-normal">AVG:</span> <strong className="text-blue-400">{activeColStats.avg}</strong></div>
            <div><span className="text-slate-500 font-normal">COUNT:</span> <strong className="text-slate-200">{activeColStats.count}</strong></div>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded"
            >
              Prev Page
            </button>
            <span className="font-mono text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded"
            >
              Next Page
            </button>
          </div>
        )}
      </div>

      {/* Rename Column Modal */}
      {renamingColIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Rename Column & Data Type</h3>
              <button
                onClick={() => setRenamingColIndex(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Column Name</label>
                <input
                  type="text"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Data Type</label>
                <select
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="string">Text (String)</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="boolean">Boolean</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRenamingColIndex(null)}
                className="bg-slate-800 text-slate-300 border-slate-700"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRenameColumnSave}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                Save Column
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
