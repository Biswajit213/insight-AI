import fs from 'fs';
import Papa from 'papaparse';

export interface ParsedDataResult {
  headers: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
}

export const parseCSVFile = async (filePath: string, maxPreviewRows?: number): Promise<ParsedDataResult> => {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rows: Record<string, unknown>[] = [];
    let headers: string[] = [];

    Papa.parse<Record<string, unknown>>(fileStream, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      step: (results) => {
        if (headers.length === 0 && results.meta.fields) {
          headers = results.meta.fields;
        }
        if (!maxPreviewRows || rows.length < maxPreviewRows) {
          rows.push(results.data);
        }
      },
      complete: () => {
        resolve({
          headers,
          rows,
          totalRows: rows.length,
        });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};
