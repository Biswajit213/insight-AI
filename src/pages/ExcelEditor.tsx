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
  FileSpreadsheet,
  Copy,
  ClipboardPaste,
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface SelectionRange {
  anchor: { r: number; c: number };
  focus: { r: number; c: number };
}

interface FillDrag {
  startR: number;
  startC: number;
  endR: number;
  endC: number;
  direction: 'down' | 'right' | null;
}

interface ColResizeDrag {
  colIdx: number;
  startX: number;
  startWidth: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rangeMinMax(a: number, b: number) {
  return { min: Math.min(a, b), max: Math.max(a, b) };
}

function cellInSelection(r: number, c: number, sel: SelectionRange | null): boolean {
  if (!sel) return false;
  const rows = rangeMinMax(sel.anchor.r, sel.focus.r);
  const cols = rangeMinMax(sel.anchor.c, sel.focus.c);
  return r >= rows.min && r <= rows.max && c >= cols.min && c <= cols.max;
}

function cellInFillRange(r: number, c: number, fill: FillDrag | null): boolean {
  if (!fill) return false;
  if (fill.direction === 'down') {
    return (
      c === fill.startC &&
      r > fill.startR &&
      r <= fill.endR
    );
  }
  if (fill.direction === 'right') {
    return (
      r === fill.startR &&
      c > fill.startC &&
      c <= fill.endC
    );
  }
  return false;
}

// ─── Default column width ─────────────────────────────────────────────────────
const DEFAULT_COL_WIDTH = 140;

export default function ExcelEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { datasets, getDataset, getDatasetData, updateDatasetData } = useDatasets();

  const dataset = (id ? getDataset(id) : undefined) || datasets[0];

  // ── Grid Data State ─────────────────────────────────────────────────────────
  const [columns, setColumns] = useState<DataColumn[]>([]);
  const [rows, setRows] = useState<DataRow[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // ── Undo / Redo stacks ───────────────────────────────────────────────────────
  const [history, setHistory] = useState<{ columns: DataColumn[]; rows: DataRow[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ columns: DataColumn[]; rows: DataRow[] }[]>([]);

  // ── Selection & Editing State ────────────────────────────────────────────────
  const [activeCell, setActiveCell] = useState<{ r: number; c: number } | null>({ r: 0, c: 0 });
  const [editingCell, setEditingCell] = useState<{ r: number; c: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [formulaValue, setFormulaValue] = useState<string>('');

  // ── Multi-cell drag selection ────────────────────────────────────────────────
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const selectionAnchorRef = useRef<{ r: number; c: number } | null>(null);

  // ── Fill handle drag ─────────────────────────────────────────────────────────
  const [fillDrag, setFillDrag] = useState<FillDrag | null>(null);
  const [isDraggingFill, setIsDraggingFill] = useState(false);
  const fillStartRef = useRef<{ r: number; c: number } | null>(null);

  // ── Column width resize ──────────────────────────────────────────────────────
  const [colWidths, setColWidths] = useState<Record<number, number>>({});
  const [colResizeDrag, setColResizeDrag] = useState<ColResizeDrag | null>(null);

  // ── Clipboard ────────────────────────────────────────────────────────────────
  const [clipboard, setClipboard] = useState<{ values: (string | number | boolean | null)[][]; rows: number; cols: number } | null>(null);

  // ── Column rename modal ──────────────────────────────────────────────────────
  const [renamingColIndex, setRenamingColIndex] = useState<number | null>(null);
  const [newColName, setNewColName] = useState<string>('');
  const [newColType, setNewColType] = useState<'string' | 'number' | 'date' | 'boolean'>('string');

  // ── Search & Pagination ──────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const cellInputRef = useRef<HTMLInputElement>(null);
  const formulaInputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // ── Initialize from context ──────────────────────────────────────────────────
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
      setColWidths({});
      setSelectionRange(null);
    }
  }, [dataset, getDatasetData]);

  // ── Column width helper ──────────────────────────────────────────────────────
  const getColWidth = useCallback((cIdx: number) => colWidths[cIdx] ?? DEFAULT_COL_WIDTH, [colWidths]);

  // ── Record history (functional updater — no stale closure) ───────────────────
  const recordHistory = useCallback(() => {
    setRows((currentRows) => {
      setHistory((prev) => [
        ...prev,
        { columns: [...columns], rows: currentRows.map((r) => ({ ...r })) },
      ]);
      return currentRows;
    });
    setRedoStack([]);
    setHasUnsavedChanges(true);
  }, [columns]);

  // ── Commit cell edit ─────────────────────────────────────────────────────────
  const commitCellEdit = useCallback(() => {
    if (!editingCell) return;
    const { r, c } = editingCell;
    const col = columns[c];
    if (!col) return;

    const currentEditValue = editValue;
    recordHistory();

    setRows((currentRows) => {
      let val: any = currentEditValue;

      if (typeof currentEditValue === 'string' && currentEditValue.startsWith('=')) {
        const formulaUpper = currentEditValue.toUpperCase().trim();
        if (formulaUpper.startsWith('=SUM(')) {
          const colTarget = formulaUpper.replace('=SUM(', '').replace(')', '').trim();
          const numericCol = columns.find((cn) => cn.name.toUpperCase() === colTarget);
          if (numericCol) {
            val = currentRows.reduce((acc, row) => acc + (Number(row[numericCol.name]) || 0), 0);
          }
        } else if (formulaUpper.startsWith('=AVG(') || formulaUpper.startsWith('=AVERAGE(')) {
          const colTarget = formulaUpper.replace(/=AVG\(|=AVERAGE\(/, '').replace(')', '').trim();
          const numericCol = columns.find((cn) => cn.name.toUpperCase() === colTarget);
          if (numericCol && currentRows.length > 0) {
            const sum = currentRows.reduce((acc, row) => acc + (Number(row[numericCol.name]) || 0), 0);
            val = Math.round((sum / currentRows.length) * 100) / 100;
          }
        } else if (formulaUpper.startsWith('=UPPER(')) {
          val = currentEditValue.slice(7, currentEditValue.length - 1).toUpperCase();
        } else if (formulaUpper.startsWith('=LOWER(')) {
          val = currentEditValue.slice(7, currentEditValue.length - 1).toLowerCase();
        }
      } else if (col.type === 'number') {
        const num = Number(currentEditValue);
        val = currentEditValue === '' ? null : isNaN(num) ? currentEditValue : num;
      }

      const updatedRows = [...currentRows];
      updatedRows[r] = { ...updatedRows[r], [col.name]: val };
      return updatedRows;
    });

    setHasUnsavedChanges(true);
    setEditingCell(null);
  }, [editingCell, editValue, columns, recordHistory]);

  // ── Formula bar sync ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeCell && rows[activeCell.r] && columns[activeCell.c]) {
      const colName = columns[activeCell.c].name;
      const rawVal = rows[activeCell.r][colName];
      setFormulaValue(rawVal === null || rawVal === undefined ? '' : String(rawVal));
    }
  }, [activeCell, rows, columns]);

  // ── Undo ─────────────────────────────────────────────────────────────────────
  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setRedoStack((prev) => [...prev, { columns, rows }]);
    setColumns(last.columns);
    setRows(last.rows);
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setHasUnsavedChanges(true);
  };

  // ── Redo ─────────────────────────────────────────────────────────────────────
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((prev) => [...prev, { columns, rows }]);
    setColumns(next.columns);
    setRows(next.rows);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setHasUnsavedChanges(true);
  };

  // ── Add Row ───────────────────────────────────────────────────────────────────
  const handleAddRow = (index?: number) => {
    recordHistory();
    const newRow: DataRow = {};
    columns.forEach((col) => { newRow[col.name] = col.type === 'number' ? 0 : ''; });
    const targetIdx = index !== undefined ? index : rows.length;
    const nextRows = [...rows];
    nextRows.splice(targetIdx, 0, newRow);
    setRows(nextRows);
    setActiveCell({ r: targetIdx, c: 0 });
  };

  // ── Delete Row ────────────────────────────────────────────────────────────────
  const handleDeleteRow = (index: number) => {
    if (rows.length <= 1) return;
    recordHistory();
    const nextRows = rows.filter((_, idx) => idx !== index);
    setRows(nextRows);
    if (activeCell && activeCell.r >= nextRows.length) {
      setActiveCell({ r: Math.max(0, nextRows.length - 1), c: activeCell.c });
    }
  };

  // ── Add Column ────────────────────────────────────────────────────────────────
  const handleAddColumn = () => {
    recordHistory();
    const newColNum = columns.length + 1;
    let colName = `New_Column_${newColNum}`;
    let counter = 1;
    while (columns.some((c) => c.name === colName)) {
      colName = `New_Column_${newColNum}_${counter++}`;
    }
    const newCol: DataColumn = { name: colName, type: 'string', nullCount: rows.length, uniqueCount: 0, sample: [] };
    setColumns([...columns, newCol]);
    setRows(rows.map((r) => ({ ...r, [colName]: '' })));
  };

  // ── Delete Column ─────────────────────────────────────────────────────────────
  const handleDeleteColumn = (colIndex: number) => {
    if (columns.length <= 1) return;
    recordHistory();
    const colToDelete = columns[colIndex];
    const nextCols = columns.filter((_, idx) => idx !== colIndex);
    const nextRows = rows.map((r) => { const clone = { ...r }; delete clone[colToDelete.name]; return clone; });
    setColumns(nextCols);
    setRows(nextRows);
    if (activeCell && activeCell.c >= nextCols.length) {
      setActiveCell({ r: activeCell.r, c: Math.max(0, nextCols.length - 1) });
    }
  };

  // ── Rename Column ─────────────────────────────────────────────────────────────
  const handleRenameColumnSave = () => {
    if (renamingColIndex === null || !newColName.trim()) return;
    const oldCol = columns[renamingColIndex];
    const trimmedNewName = newColName.trim();
    if (oldCol.name === trimmedNewName && oldCol.type === newColType) { setRenamingColIndex(null); return; }
    recordHistory();
    const nextCols = columns.map((col, idx) => idx === renamingColIndex ? { ...col, name: trimmedNewName, type: newColType } : col);
    const nextRows = rows.map((r) => {
      const clone: DataRow = {};
      Object.keys(r).forEach((k) => { clone[k === oldCol.name ? trimmedNewName : k] = r[k]; });
      return clone;
    });
    setColumns(nextCols);
    setRows(nextRows);
    setRenamingColIndex(null);
  };

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSaveChanges = () => {
    if (!dataset) return;
    updateDatasetData(dataset.id, columns, rows);
    setHasUnsavedChanges(false);
    setSaveSuccessMessage('Dataset changes saved successfully!');
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  // ── Export CSV ────────────────────────────────────────────────────────────────
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

  // ────────────────────────────────────────────────────────────────────────────
  // DRAG FEATURE 1: Multi-cell selection
  // ────────────────────────────────────────────────────────────────────────────
  const handleCellMouseDown = useCallback((e: React.MouseEvent, r: number, c: number) => {
    if (e.button !== 0) return;
    if (editingCell) return; // don't start selection while editing

    // Stop if clicking fill handle
    const target = e.target as HTMLElement;
    if (target.dataset.fillHandle) return;

    selectionAnchorRef.current = { r, c };
    setIsDraggingSelection(true);
    setSelectionRange({ anchor: { r, c }, focus: { r, c } });
    setActiveCell({ r, c });
    setFillDrag(null);
    e.preventDefault();
  }, [editingCell]);

  const handleCellMouseEnter = useCallback((r: number, c: number) => {
    if (!isDraggingSelection || !selectionAnchorRef.current) return;
    const anchor = selectionAnchorRef.current;
    setSelectionRange({ anchor, focus: { r, c } });
    setActiveCell(anchor);
  }, [isDraggingSelection]);

  // ────────────────────────────────────────────────────────────────────────────
  // DRAG FEATURE 2: Fill Handle
  // ────────────────────────────────────────────────────────────────────────────
  const handleFillHandleMouseDown = useCallback((e: React.MouseEvent, r: number, c: number) => {
    e.stopPropagation();
    e.preventDefault();
    fillStartRef.current = { r, c };
    setIsDraggingFill(true);
    setFillDrag({ startR: r, startC: c, endR: r, endC: c, direction: null });
  }, []);

  // ── Commit fill drag ──────────────────────────────────────────────────────────
  const commitFillDrag = useCallback(() => {
    if (!fillDrag || !fillStartRef.current) return;
    const { startR, startC, endR, endC, direction } = fillDrag;
    if (!direction || (endR === startR && endC === startC)) return;

    recordHistory();

    setRows((currentRows) => {
      const sourceVal = currentRows[startR]?.[columns[startC]?.name];
      const updatedRows = currentRows.map((row) => ({ ...row }));

      if (direction === 'down') {
        const minR = Math.min(startR, endR);
        const maxR = Math.max(startR, endR);
        const colName = columns[startC]?.name;
        if (!colName) return currentRows;

        // Detect numeric series step (look back 1 row)
        const prevVal = startR > 0 ? Number(currentRows[startR - 1]?.[colName]) : NaN;
        const curNum = Number(sourceVal);
        const step = !isNaN(prevVal) && !isNaN(curNum) ? curNum - prevVal : NaN;

        for (let r = minR + 1; r <= maxR; r++) {
          if (!updatedRows[r]) continue;
          if (!isNaN(step) && step !== 0) {
            updatedRows[r][colName] = curNum + step * (r - startR);
          } else {
            updatedRows[r][colName] = sourceVal;
          }
        }
      } else if (direction === 'right') {
        const minC = Math.min(startC, endC);
        const maxC = Math.max(startC, endC);
        if (!updatedRows[startR]) return currentRows;

        for (let c = minC + 1; c <= maxC; c++) {
          const colName = columns[c]?.name;
          if (!colName) continue;
          updatedRows[startR][colName] = sourceVal;
        }
      }

      return updatedRows;
    });

    setHasUnsavedChanges(true);
  }, [fillDrag, columns, recordHistory]);

  // ────────────────────────────────────────────────────────────────────────────
  // DRAG FEATURE 3: Column resize
  // ────────────────────────────────────────────────────────────────────────────
  const handleColResizeMouseDown = useCallback((e: React.MouseEvent, colIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const startWidth = getColWidth(colIdx);
    setColResizeDrag({ colIdx, startX: e.clientX, startWidth });
  }, [getColWidth]);

  const handleColResizeDblClick = useCallback((colIdx: number) => {
    // Auto-fit: measure longest content in this column
    const col = columns[colIdx];
    if (!col) return;
    let maxLen = col.name.length;
    rows.slice(0, 200).forEach((row) => {
      const val = String(row[col.name] ?? '');
      if (val.length > maxLen) maxLen = val.length;
    });
    // Approximate px width: 8px per char, min 80, max 400
    const autoWidth = Math.min(400, Math.max(80, maxLen * 8 + 24));
    setColWidths((prev) => ({ ...prev, [colIdx]: autoWidth }));
  }, [columns, rows]);

  // ────────────────────────────────────────────────────────────────────────────
  // Global mouse move / up handlers (attached to window)
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      // Column resize
      if (colResizeDrag) {
        const delta = e.clientX - colResizeDrag.startX;
        const newWidth = Math.max(60, colResizeDrag.startWidth + delta);
        setColWidths((prev) => ({ ...prev, [colResizeDrag.colIdx]: newWidth }));
      }
    };

    const onMouseUp = () => {
      if (isDraggingSelection) {
        setIsDraggingSelection(false);
      }
      if (isDraggingFill) {
        commitFillDrag();
        setIsDraggingFill(false);
        setFillDrag(null);
        fillStartRef.current = null;
      }
      if (colResizeDrag) {
        setColResizeDrag(null);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDraggingSelection, isDraggingFill, colResizeDrag, commitFillDrag]);

  // Fill handle: update endR/endC when hovering cells
  const handleCellMouseEnterFill = useCallback((r: number, c: number) => {
    if (!isDraggingFill || !fillStartRef.current) return;
    const { r: startR, c: startC } = fillStartRef.current;
    const dR = Math.abs(r - startR);
    const dC = Math.abs(c - startC);
    // Primary direction = whichever axis moved more
    const direction: 'down' | 'right' = dR >= dC ? 'down' : 'right';
    setFillDrag({
      startR,
      startC,
      endR: direction === 'down' ? r : startR,
      endC: direction === 'right' ? c : startC,
      direction,
    });
  }, [isDraggingFill]);

  // ────────────────────────────────────────────────────────────────────────────
  // Copy / Paste range
  // ────────────────────────────────────────────────────────────────────────────
  const handleCopyRange = useCallback(() => {
    const sel = selectionRange ?? (activeCell ? { anchor: activeCell, focus: activeCell } : null);
    if (!sel) return;
    const rowRange = rangeMinMax(sel.anchor.r, sel.focus.r);
    const colRange = rangeMinMax(sel.anchor.c, sel.focus.c);

    const values: (string | number | boolean | null)[][] = [];
    for (let r = rowRange.min; r <= rowRange.max; r++) {
      const rowVals: (string | number | boolean | null)[] = [];
      for (let c = colRange.min; c <= colRange.max; c++) {
        const colName = columns[c]?.name;
        rowVals.push(colName ? (rows[r]?.[colName] ?? null) : null);
      }
      values.push(rowVals);
    }
    setClipboard({ values, rows: rowRange.max - rowRange.min + 1, cols: colRange.max - colRange.min + 1 });

    // Also write plain text to system clipboard
    const text = values.map((row) => row.join('\t')).join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  }, [selectionRange, activeCell, columns, rows]);

  const handlePasteRange = useCallback(() => {
    if (!clipboard || !activeCell) return;
    recordHistory();
    setRows((currentRows) => {
      const updatedRows = currentRows.map((r) => ({ ...r }));
      for (let ri = 0; ri < clipboard.rows; ri++) {
        const targetR = activeCell.r + ri;
        if (targetR >= updatedRows.length) break;
        for (let ci = 0; ci < clipboard.cols; ci++) {
          const targetC = activeCell.c + ci;
          if (targetC >= columns.length) break;
          const colName = columns[targetC]?.name;
          if (!colName) continue;
          updatedRows[targetR][colName] = clipboard.values[ri]?.[ci] ?? null;
        }
      }
      return updatedRows;
    });
    setHasUnsavedChanges(true);
  }, [clipboard, activeCell, columns, recordHistory]);

  // ── Clear selection (Delete/Backspace) ────────────────────────────────────────
  const handleClearSelection = useCallback(() => {
    const sel = selectionRange ?? (activeCell ? { anchor: activeCell, focus: activeCell } : null);
    if (!sel) return;
    recordHistory();
    const rowRange = rangeMinMax(sel.anchor.r, sel.focus.r);
    const colRange = rangeMinMax(sel.anchor.c, sel.focus.c);

    setRows((currentRows) => {
      const updatedRows = currentRows.map((r) => ({ ...r }));
      for (let r = rowRange.min; r <= rowRange.max; r++) {
        for (let c = colRange.min; c <= colRange.max; c++) {
          const colName = columns[c]?.name;
          if (colName && updatedRows[r]) updatedRows[r][colName] = '';
        }
      }
      return updatedRows;
    });
    setHasUnsavedChanges(true);
  }, [selectionRange, activeCell, columns, recordHistory]);

  // ────────────────────────────────────────────────────────────────────────────
  // Keyboard navigation
  // ────────────────────────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!activeCell) return;

    if (editingCell) {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitCellEdit();
        if (activeCell.r < rows.length - 1) setActiveCell({ r: activeCell.r + 1, c: activeCell.c });
      } else if (e.key === 'Escape') {
        setEditingCell(null);
      }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); handleSaveChanges(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); handleUndo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); handleRedo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') { e.preventDefault(); handleCopyRange(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') { e.preventDefault(); handlePasteRange(); return; }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      handleClearSelection();
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newR = Math.max(0, activeCell.r - 1);
      setActiveCell({ r: newR, c: activeCell.c });
      if (!e.shiftKey) setSelectionRange(null);
      else setSelectionRange((prev) => prev ? { ...prev, focus: { r: newR, c: activeCell.c } } : { anchor: activeCell, focus: { r: newR, c: activeCell.c } });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newR = Math.min(rows.length - 1, activeCell.r + 1);
      setActiveCell({ r: newR, c: activeCell.c });
      if (!e.shiftKey) setSelectionRange(null);
      else setSelectionRange((prev) => prev ? { ...prev, focus: { r: newR, c: activeCell.c } } : { anchor: activeCell, focus: { r: newR, c: activeCell.c } });
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const newC = Math.max(0, activeCell.c - 1);
      setActiveCell({ r: activeCell.r, c: newC });
      if (!e.shiftKey) setSelectionRange(null);
      else setSelectionRange((prev) => prev ? { ...prev, focus: { r: activeCell.r, c: newC } } : { anchor: activeCell, focus: { r: activeCell.r, c: newC } });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const newC = Math.min(columns.length - 1, activeCell.c + 1);
      setActiveCell({ r: activeCell.r, c: newC });
      if (!e.shiftKey) setSelectionRange(null);
      else setSelectionRange((prev) => prev ? { ...prev, focus: { r: activeCell.r, c: newC } } : { anchor: activeCell, focus: { r: activeCell.r, c: newC } });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const colName = columns[activeCell.c].name;
      setEditValue(String(rows[activeCell.r][colName] ?? ''));
      setEditingCell(activeCell);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) { if (activeCell.c > 0) setActiveCell({ r: activeCell.r, c: activeCell.c - 1 }); }
      else { if (activeCell.c < columns.length - 1) setActiveCell({ r: activeCell.r, c: activeCell.c + 1 }); }
    }
  };

  // ── Derived data ─────────────────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    if (!searchTerm) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter((row) => Object.values(row).some((val) => String(val ?? '').toLowerCase().includes(term)));
  }, [rows, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const activeCellRef = useMemo(() => {
    if (!activeCell) return 'A1';
    return `${getColumnLetter(activeCell.c)}${activeCell.r + 1}`;
  }, [activeCell]);

  // Selection size label
  const selectionLabel = useMemo(() => {
    if (!selectionRange) return null;
    const rRange = rangeMinMax(selectionRange.anchor.r, selectionRange.focus.r);
    const cRange = rangeMinMax(selectionRange.anchor.c, selectionRange.focus.c);
    const rCount = rRange.max - rRange.min + 1;
    const cCount = cRange.max - cRange.min + 1;
    if (rCount === 1 && cCount === 1) return null;
    return `${rCount}R × ${cCount}C`;
  }, [selectionRange]);

  const activeColStats = useMemo(() => {
    if (!activeCell || !columns[activeCell.c]) return null;
    const colName = columns[activeCell.c].name;
    const numericVals = rows.map((r) => Number(r[colName])).filter((v) => !isNaN(v));
    if (numericVals.length === 0) return null;
    const sum = numericVals.reduce((a, b) => a + b, 0);
    return {
      sum: formatNumber(Math.round(sum * 100) / 100),
      avg: formatNumber(Math.round((sum / numericVals.length) * 100) / 100),
      count: numericVals.length,
    };
  }, [activeCell, columns, rows]);

  // ────────────────────────────────────────────────────────────────────────────
  // Cursor style based on active drag
  // ────────────────────────────────────────────────────────────────────────────
  const gridCursor = colResizeDrag ? 'cursor-col-resize' : isDraggingFill ? 'cursor-crosshair' : '';

  if (!dataset) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Dataset not found.</p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/app/datasets')}>
          Back to Data Sources
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn('flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden', gridCursor)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* ── Top Navigation Bar ─────────────────────────────────────────────── */}
      <div className="bg-slate-900 border-b border-slate-800 px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/app/datasets/${dataset.id}`)}
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
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Unsaved changes
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{dataset.fileName} · {formatBytes(dataset.sizeBytes)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccessMessage && (
            <div className="flex items-center gap-1.5 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
              <Check size={14} /><span>{saveSuccessMessage}</span>
            </div>
          )}
          <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={handleExportCSV} className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700">
            Export CSV
          </Button>
          <Button
            variant="primary" size="sm" icon={<Save size={14} />} onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges}
            className={cn('shadow-lg transition-all', hasUnsavedChanges ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30' : 'bg-slate-800 text-slate-500 border-slate-800 cursor-not-allowed')}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* ── Ribbon Toolbar ──────────────────────────────────────────────────── */}
      <div className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/60 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Undo / Redo */}
          <div className="flex items-center bg-slate-900/80 rounded-lg p-0.5 border border-slate-700">
            <button onClick={handleUndo} disabled={history.length === 0} className="p-1.5 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors" title="Undo (Ctrl+Z)"><Undo2 size={14} /></button>
            <button onClick={handleRedo} disabled={redoStack.length === 0} className="p-1.5 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors" title="Redo (Ctrl+Y)"><Redo2 size={14} /></button>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Copy / Paste */}
          <button onClick={handleCopyRange} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/50 transition-colors" title="Copy selection (Ctrl+C)">
            <Copy size={13} className="text-sky-400" /><span>Copy</span>
          </button>
          <button onClick={handlePasteRange} disabled={!clipboard} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/50 transition-colors disabled:opacity-40" title="Paste (Ctrl+V)">
            <ClipboardPaste size={13} className="text-violet-400" /><span>Paste</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Add / Delete Row */}
          <button onClick={() => handleAddRow()} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/50 transition-colors font-medium">
            <Plus size={13} className="text-emerald-400" /><span>Add Row</span>
          </button>
          {activeCell && (
            <button onClick={() => handleDeleteRow(activeCell.r)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-red-500/20 hover:text-red-300 text-slate-300 border border-slate-600/50 transition-colors" title="Delete Active Row">
              <Trash2 size={13} className="text-red-400" /><span>Delete Row</span>
            </button>
          )}

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Add / Delete Column */}
          <button onClick={handleAddColumn} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/50 transition-colors font-medium">
            <Plus size={13} className="text-blue-400" /><span>Add Column</span>
          </button>
          {activeCell && columns[activeCell.c] && (
            <>
              <button
                onClick={() => { setRenamingColIndex(activeCell.c); setNewColName(columns[activeCell.c].name); setNewColType(columns[activeCell.c].type); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/50 transition-colors"
              >
                <Edit2 size={13} className="text-amber-400" /><span>Rename Column</span>
              </button>
              <button onClick={() => handleDeleteColumn(activeCell.c)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-red-500/20 hover:text-red-300 text-slate-300 border border-slate-600/50 transition-colors">
                <Trash2 size={13} className="text-red-400" /><span>Delete Col</span>
              </button>
            </>
          )}

          {/* Selection badge */}
          {selectionLabel && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {selectionLabel}
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative flex items-center min-w-[200px]">
          <Search size={14} className="absolute left-2.5 text-slate-400" />
          <input
            type="text" placeholder="Search spreadsheet cells..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full bg-slate-900/90 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2 text-slate-400 hover:text-white"><X size={12} /></button>
          )}
        </div>
      </div>

      {/* ── Formula Bar ─────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-1.5 flex items-center gap-3">
        <div className="w-20 bg-slate-800 border border-slate-700 text-center py-1 rounded text-xs font-mono font-semibold text-emerald-400 select-none">
          {activeCellRef}
        </div>
        <div className="text-slate-500 font-serif italic text-sm font-semibold select-none">fx</div>
        <div className="flex-1 relative">
          <input
            ref={formulaInputRef}
            type="text"
            value={editingCell ? editValue : formulaValue}
            onChange={(e) => {
              if (editingCell) { setEditValue(e.target.value); }
              else if (activeCell) { setEditValue(e.target.value); setEditingCell(activeCell); }
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitCellEdit(); } }}
            placeholder="Enter value or formula (e.g. =SUM(Sales), =AVG(Quantity), =UPPER(text))"
            className="w-full bg-slate-950 border border-slate-700/80 rounded px-3 py-1 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* ── Drag tips bar ──────────────────────────────────────────────────── */}
      <div className="bg-slate-950/60 border-b border-slate-800/60 px-4 py-1 flex items-center gap-4 text-[10px] text-slate-500 select-none">
        <span><span className="text-slate-400 font-semibold">Drag-fill:</span> Grab <span className="text-blue-400">■</span> at cell corner → fill down/right</span>
        <span className="text-slate-700">|</span>
        <span><span className="text-slate-400 font-semibold">Multi-select:</span> Click + drag cells</span>
        <span className="text-slate-700">|</span>
        <span><span className="text-slate-400 font-semibold">Resize col:</span> Drag header border · Dbl-click to auto-fit</span>
        <span className="text-slate-700">|</span>
        <span><span className="text-slate-400 font-semibold">Shift+Arrow</span> extends selection</span>
      </div>

      {/* ── Main Grid ───────────────────────────────────────────────────────── */}
      <div ref={gridRef} className="flex-1 overflow-auto bg-slate-950 relative select-none">
        <table className="border-collapse text-xs font-sans" style={{ tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}>
          <colgroup>
            <col style={{ width: 48 }} />
            {columns.map((_, cIdx) => (
              <col key={cIdx} style={{ width: getColWidth(cIdx) }} />
            ))}
          </colgroup>

          <thead>
            {/* Row 1: Excel Column Letters + resize handles */}
            <tr className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
              <th className="bg-slate-900 border-r border-b border-slate-800 text-center py-1 text-[11px] font-mono text-slate-500 font-semibold sticky left-0 z-30">#</th>
              {columns.map((col, cIdx) => {
                const isActive = activeCell?.c === cIdx;
                return (
                  <th
                    key={`letter_${cIdx}`}
                    onClick={() => setActiveCell({ r: activeCell?.r || 0, c: cIdx })}
                    className={cn(
                      'border-r border-slate-800 text-center py-1 font-mono text-[11px] font-bold cursor-pointer transition-colors relative',
                      isActive ? 'bg-blue-900/40 text-blue-400 border-b-2 border-b-blue-500' : 'text-slate-400 hover:bg-slate-800'
                    )}
                  >
                    {getColumnLetter(cIdx)}
                    {/* ── Column resize handle ──────────────────────────────── */}
                    <div
                      onMouseDown={(e) => handleColResizeMouseDown(e, cIdx)}
                      onDoubleClick={() => handleColResizeDblClick(cIdx)}
                      className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-400/60 transition-colors group z-10"
                      title="Drag to resize · Double-click to auto-fit"
                    >
                      <div className="absolute right-0 top-1/4 h-1/2 w-px bg-slate-600 group-hover:bg-blue-400 transition-colors" />
                    </div>
                  </th>
                );
              })}
            </tr>

            {/* Row 2: Field Name & Data Type Header */}
            <tr className="bg-slate-900/90 border-b border-slate-700 sticky top-[25px] z-20">
              <th className="bg-slate-900 border-r border-b border-slate-700 text-center py-2 text-[10px] text-slate-500 font-mono sticky left-0 z-30">FIELD</th>
              {columns.map((col, cIdx) => {
                const isActive = activeCell?.c === cIdx;
                return (
                  <th
                    key={col.name}
                    onDoubleClick={() => { setRenamingColIndex(cIdx); setNewColName(col.name); setNewColType(col.type); }}
                    className={cn(
                      'px-3 py-2 text-left border-r border-slate-800 transition-colors cursor-pointer group relative',
                      isActive ? 'bg-blue-950/60 text-white' : 'text-slate-300 hover:bg-slate-800/80'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-slate-200 truncate" title={col.name}>{col.name}</span>
                      <span className={cn('text-[9px] px-1.5 rounded font-mono uppercase tracking-wider shrink-0',
                        col.type === 'number' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                          : col.type === 'date' ? 'bg-purple-950 text-purple-400 border border-purple-800/50'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      )}>{col.type}</span>
                    </div>
                    {/* resize handle on field header too */}
                    <div
                      onMouseDown={(e) => handleColResizeMouseDown(e, cIdx)}
                      onDoubleClick={() => handleColResizeDblClick(cIdx)}
                      className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-400/40 z-10"
                    />
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
                  className={cn('transition-colors', isRowActive ? 'bg-slate-900/30' : 'hover:bg-slate-900/20')}
                >
                  {/* Row number */}
                  <td
                    onClick={() => setActiveCell({ r: actualRowIdx, c: activeCell?.c || 0 })}
                    className={cn(
                      'bg-slate-900/90 border-r border-slate-800 text-center py-1.5 font-mono text-[11px] cursor-pointer sticky left-0 z-10 transition-colors',
                      isRowActive ? 'bg-blue-900/40 text-blue-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                    )}
                  >
                    {actualRowIdx + 1}
                  </td>

                  {/* Data cells */}
                  {columns.map((col, cIdx) => {
                    const isActive = activeCell?.r === actualRowIdx && activeCell?.c === cIdx;
                    const isEditing = editingCell?.r === actualRowIdx && editingCell?.c === cIdx;
                    const isInSelection = !isEditing && cellInSelection(actualRowIdx, cIdx, selectionRange);
                    const isInFill = cellInFillRange(actualRowIdx, cIdx, fillDrag);
                    const cellVal = row[col.name];
                    const displayVal = cellVal === null || cellVal === undefined ? '' : String(cellVal);

                    // Is this the active cell (the fill handle anchor)?
                    const showFillHandle = isActive && !isEditing && !isDraggingSelection;

                    return (
                      <td
                        key={`cell_${actualRowIdx}_${cIdx}`}
                        onMouseDown={(e) => handleCellMouseDown(e, actualRowIdx, cIdx)}
                        onMouseEnter={() => {
                          handleCellMouseEnter(actualRowIdx, cIdx);
                          handleCellMouseEnterFill(actualRowIdx, cIdx);
                        }}
                        onDoubleClick={() => {
                          if (isDraggingFill || isDraggingSelection) return;
                          setSelectionRange(null);
                          setActiveCell({ r: actualRowIdx, c: cIdx });
                          setEditingCell({ r: actualRowIdx, c: cIdx });
                          setEditValue(displayVal);
                        }}
                        className={cn(
                          'border-r border-slate-800/80 relative text-xs font-mono transition-all overflow-hidden',
                          col.type === 'number' ? 'text-right' : 'text-left',
                          isEditing
                            ? 'p-0'
                            : 'px-3 py-1.5',
                          isActive && !isEditing && !isInSelection
                            ? 'outline outline-2 outline-blue-500 -outline-offset-1 bg-blue-950/40 z-10'
                            : '',
                          isInSelection && !isActive
                            ? 'bg-blue-900/30 outline outline-1 outline-blue-700/60 -outline-offset-1'
                            : '',
                          isInFill
                            ? 'bg-emerald-900/30 outline outline-1 outline-emerald-500/60 -outline-offset-1'
                            : '',
                          !isActive && !isInSelection && !isInFill && (cellVal === null || cellVal === '')
                            ? 'text-slate-600 italic'
                            : !isActive && !isInSelection && !isInFill
                            ? 'text-slate-200'
                            : ''
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
                            className="w-full h-full bg-blue-950 text-white font-mono text-xs px-3 py-1.5 border border-blue-400 focus:outline-none"
                          />
                        ) : (
                          <>
                            <span className="truncate block">
                              {cellVal === null || cellVal === '' ? '(empty)' : displayVal}
                            </span>

                            {/* ── Fill Handle ──────────────────────────────── */}
                            {showFillHandle && (
                              <div
                                data-fill-handle="true"
                                onMouseDown={(e) => handleFillHandleMouseDown(e, actualRowIdx, cIdx)}
                                className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border border-slate-900 cursor-crosshair z-20 hover:bg-blue-400 transition-colors"
                                title="Drag to fill down or right"
                                style={{ transform: 'translate(40%, 40%)' }}
                              />
                            )}
                          </>
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

      {/* ── Bottom Status Bar ─────────────────────────────────────────────── */}
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
          {clipboard && (
            <div className="text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20 font-mono">
              Clipboard: {clipboard.rows}R×{clipboard.cols}C
            </div>
          )}
        </div>

        {activeColStats && (
          <div className="flex items-center gap-3 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700 font-mono text-[11px]">
            <div><span className="text-slate-500">SUM:</span> <strong className="text-emerald-400">{activeColStats.sum}</strong></div>
            <div><span className="text-slate-500">AVG:</span> <strong className="text-blue-400">{activeColStats.avg}</strong></div>
            <div><span className="text-slate-500">COUNT:</span> <strong className="text-slate-200">{activeColStats.count}</strong></div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded">Prev</button>
            <span className="font-mono text-slate-300">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded">Next</button>
          </div>
        )}
      </div>

      {/* ── Rename Column Modal ────────────────────────────────────────────── */}
      {renamingColIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Rename Column & Data Type</h3>
              <button onClick={() => setRenamingColIndex(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Column Name</label>
                <input type="text" value={newColName} onChange={(e) => setNewColName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Data Type</label>
                <select value={newColType} onChange={(e) => setNewColType(e.target.value as any)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                  <option value="string">Text (String)</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="boolean">Boolean</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setRenamingColIndex(null)} className="bg-slate-800 text-slate-300 border-slate-700">Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleRenameColumnSave} className="bg-blue-600 hover:bg-blue-500 text-white">Save Column</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
