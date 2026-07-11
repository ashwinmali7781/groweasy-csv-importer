'use strict';

const { parseCsv } = require('../services/csvParserService');
const { mapRowsToCrm } = require('../services/aiMappingService');
const { validateAll } = require('../services/validationService');
const { DEFAULTS } = require('../config/constants');

const MAX_ROWS = Number(process.env.MAX_ROWS) || DEFAULTS.MAX_ROWS;

/**
 * POST /api/csv/preview
 * Parses the CSV and returns headers + rows only. No AI calls — this backs
 * Step 2 (preview) if the client wants server-side parsing instead of doing
 * it in the browser.
 */
async function preview(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Attach a CSV under field "file".' });
    }

    const { headers, rows } = parseCsv(req.file.buffer);

    if (rows.length > MAX_ROWS) {
      return res.status(400).json({
        error: `This file has ${rows.length} rows, which exceeds the ${MAX_ROWS}-row limit for a single import.`,
      });
    }

    res.json({ headers, rowCount: rows.length, rows });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/csv/import
 * Full pipeline: parse -> batch -> AI field mapping -> validate -> respond.
 * This is the only endpoint that talks to the AI, and it only runs after
 * the user has confirmed the import on the frontend.
 */
async function importCsv(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Attach a CSV under field "file".' });
    }

    const { rows } = parseCsv(req.file.buffer);

    if (rows.length > MAX_ROWS) {
      return res.status(400).json({
        error: `This file has ${rows.length} rows, which exceeds the ${MAX_ROWS}-row limit for a single import.`,
      });
    }

    const aiResults = await mapRowsToCrm(rows);
    const result = validateAll(aiResults, rows.length);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { preview, importCsv };
