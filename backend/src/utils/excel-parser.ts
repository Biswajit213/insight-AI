import XLSX from 'xlsx';
import { ParsedDataResult } from './csv-parser';

export const parseExcelFile = async (filePath: string, maxPreviewRows?: number): Promise<ParsedDataResult> => {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  const sheet = workbook.Sheets[firstSheetName];
  const allRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  
  if (allRows.length === 0) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  const headers = Object.keys(allRows[0]);
  const rows = maxPreviewRows ? allRows.slice(0, maxPreviewRows) : allRows;

  return {
    headers,
    rows,
    totalRows: allRows.length,
  };
};
