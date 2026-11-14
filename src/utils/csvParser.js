import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Heuristics to auto-map spreadsheet column headers to standard ID Card fields.
 */
const FIELD_MATCH_PATTERNS = {
  fullName: [/^(full\s*name|name|student\s*name|employee\s*name|staff\s*name)$/i, /name/i],
  nameBangla: [/^(name\s*bangla|bangla\s*name|name_bn|bn_name|নাম|বাংলা\s*নাম)$/i, /(bangla|bn)/i],
  idNumber: [/^(id|id\s*no|id\s*number|student\s*id|emp\s*id|employee\s*id|roll|roll\s*no|badge\s*no|reg\s*no)$/i, /id/i],
  photoUrl: [/^(photo|image|picture|avatar|photo\s*url|image\s*url)$/i, /(photo|image)/i],
  department: [/^(dept|department|division|faculty|stream|branch)$/i, /dept/i],
  designation: [/^(designation|title|job\s*title|role|position|class|grade|section)$/i, /(title|role|class)/i],
  roleType: [/^(employee\s*type|type|role\s*type|category|status)$/i, /type/i],
  bloodGroup: [/^(blood|blood\s*group|blood\s*type|bg)$/i, /blood/i],
  gender: [/^(gender|sex|লিঙ্গ)$/i],
  dateOfBirth: [/^(dob|date\s*of\s*birth|birth\s*date|birthday|জন্ম\s*তারিখ)$/i, /birth/i],
  nationality: [/^(nationality|country|জাতীয়তা)$/i],
  nationalId: [/^(national\s*id|nid|ssn|aadhaar|passport|id\s*card\s*no|জাতীয়\s*পরিচয়পত্র)$/i, /(nid|ssn|aadhaar|passport)/i],
  fatherName: [/^(father\s*name|father|fathers\s*name|পিতার\s*নাম)$/i, /father/i],
  motherName: [/^(mother\s*name|mother|mothers\s*name|মাতার\s*নাম)$/i, /mother/i],
  spouseName: [/^(spouse\s*name|spouse|স্বামী|স্ত্রী)$/i],
  maritalStatus: [/^(marital\s*status|marital|বিবাহিত\s*অবস্থা)$/i],
  religion: [/^(religion|ধর্ম)$/i],
  district: [/^(district|home\s*district|birth\s*place|জেলা|জন্মস্থান)$/i, /district/i],
  joiningDate: [/^(joining\s*date|doj|admission\s*date|hire\s*date|start\s*date)$/i, /(joining|admission)/i],
  validThru: [/^(expiry|valid\s*thru|valid\s*until|expiry\s*date|validity|session)$/i, /(valid|expir)/i],
  reportingManager: [/^(manager|supervisor|reporting\s*to|advisor|principal)$/i, /(manager|supervisor)/i],
  campus: [/^(campus|location|building|office)$/i, /campus/i],
  phone: [/^(phone|mobile|contact|tel|phone\s*no|mobile\s*no|cell|ফোন|মোবাইল)$/i, /(phone|mobile)/i],
  email: [/^(email|e-mail|mail|ইমেইল)$/i, /email/i],
  emergencyContactName: [/^(emergency\s*name|emergency\s*contact|guardian\s*name|parent\s*name)$/i, /guardian/i],
  emergencyContactRelation: [/^(relation|relationship|guardian\s*relation)$/i],
  emergencyPhone: [/^(emergency\s*phone|emergency\s*mobile|guardian\s*phone|parent\s*phone)$/i],
  address: [/^(address|street|home\s*address|residential\s*address|ঠিকানা)$/i, /address/i],
  rfid: [/^(rfid|chip\s*id|nfc|card\s*serial)$/i, /rfid/i],
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
