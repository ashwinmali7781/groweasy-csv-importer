export type Step = 'upload' | 'preview' | 'processing' | 'results';

export type CsvRow = Record<string, string>;

export interface ParsedCsv {
  file: File;
  headers: string[];
  rows: CsvRow[];
}

export const CRM_FIELDS = [
  'created_at',
  'name',
  'email',
  'country_code',
  'mobile_without_country_code',
  'company',
  'city',
  'state',
  'country',
  'lead_owner',
  'crm_status',
  'crm_note',
  'data_source',
  'possession_time',
  'description',
] as const;

export type CrmField = (typeof CRM_FIELDS)[number];

export type CrmRecord = Record<CrmField, string>;

export interface SkippedRow {
  row_index: number;
  reason: string;
}

export interface ImportResult {
  imported: CrmRecord[];
  skipped: SkippedRow[];
  totalImported: number;
  totalSkipped: number;
  totalRows: number;
}

export interface ApiError {
  error: string;
}
