import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Heuristics to auto-map spreadsheet column headers to standard ID Card fields.
 */
const FIELD_MATCH_PATTERNS = {
  fullName: [/^(full\s*name|name|student\s*name|employee\s*name|staff\s*name)$/i, /name/i],
  idNumber: [/^(id|id\s*no|id\s*number|student\s*id|emp\s*id|employee\s*id|roll|roll\s*no|badge\s*no)$/i, /id/i],
  photoUrl: [/^(photo|image|picture|avatar|photo\s*url|image\s*url)$/i, /(photo|image)/i],
  department: [/^(dept|department|division|faculty|stream)$/i, /dept/i],
  designation: [/^(designation|title|job\s*title|role|position|class|grade)$/i, /(title|role|class)/i],
  bloodGroup: [/^(blood|blood\s*group|blood\s*type|bg)$/i, /blood/i],
  phone: [/^(phone|mobile|contact|tel|phone\s*no|mobile\s*no)$/i, /(phone|mobile)/i],
  email: [/^(email|e-mail|mail)$/i, /email/i],
  validThru: [/^(expiry|valid\s*thru|valid\s*until|expiry\s*date|validity)$/i, /(valid|expir)/i],
  emergencyContact: [/^(emergency|emergency\s*contact|guardian\s*phone)$/i, /emergency/i]
};

export function autoMapColumns(headers) {
  const mapping = {};
  const usedHeaders = new Set();

  for (const [standardKey, patterns] of Object.entries(FIELD_MATCH_PATTERNS)) {
    for (const pattern of patterns) {
      const match = headers.find((h) => !usedHeaders.has(h) && pattern.test(h.trim()));
      if (match) {
        mapping[standardKey] = match;
        usedHeaders.add(match);
        break;
      }
    }
  }

  return mapping;
}

/**
 * Parse any CSV or Excel (.xlsx, .xls) file in the browser client-side.
 * @param {File} file
 * @returns {Promise<{ headers: string[], rows: object[], suggestedMapping: object }>}
 */
export async function parseSpreadsheet(file) {
  const extension = file.name.split('.').pop().toLowerCase();

  if (extension === 'csv' || extension === 'tsv' || extension === 'txt') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: 'greedy',
        complete: (results) => {
          const headers = results.meta.fields ? results.meta.fields.filter(Boolean) : [];
          const rows = results.data;
          const suggestedMapping = autoMapColumns(headers);
          resolve({ headers, rows, suggestedMapping });
        },
        error: (err) => reject(err),
      });
    });
  } else if (['xlsx', 'xls', 'ods'].includes(extension)) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    const suggestedMapping = autoMapColumns(headers);
    return { headers, rows, suggestedMapping };
  } else {
    throw new Error(`Unsupported file format (.${extension}). Please upload .csv or .xlsx`);
  }
}
