'use strict';

const { parse } = require('csv-parse/sync');

class CsvParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CsvParseError';
    this.statusCode = 400;
  }
}

/**
 * Parses a raw CSV buffer/string into an array of row objects keyed by
 * whatever headers the file actually contains. We deliberately do NOT
 * assume any fixed column names here — that's the whole point of the
 * assignment. Header names are trimmed but otherwise left as-is so the
 * AI mapping step can see the original wording (e.g. "Phone", "Mobile No.",
 * "Contact Number" all need to survive to that stage).
 *
 * @param {Buffer|string} raw
 * @returns {{ headers: string[], rows: Record<string, string>[] }}
 */
function parseCsv(raw) {
  const input = Buffer.isBuffer(raw) ? raw.toString('utf8') : raw;

  if (!input || !input.trim()) {
    throw new CsvParseError('The uploaded file is empty.');
  }

  let records;
  try {
    records = parse(input, {
      columns: (headerRow) => headerRow.map((h) => (h || '').trim()),
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true, // real-world exports are rarely perfectly square
      bom: true,
    });
  } catch (err) {
    throw new CsvParseError(`Could not parse CSV: ${err.message}`);
  }

  if (!records.length) {
    throw new CsvParseError('The CSV file has no data rows.');
  }

  const headers = Object.keys(records[0]);
  if (!headers.length || headers.every((h) => !h)) {
    throw new CsvParseError('The CSV file has no recognizable header row.');
  }

  return { headers, rows: records };
}

module.exports = { parseCsv, CsvParseError };
