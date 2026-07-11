'use strict';

const { CRM_FIELDS, CRM_STATUS_VALUES, DATA_SOURCE_VALUES } = require('../config/constants');

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

/** Replace real newlines with a literal "\n" so the value stays a single CSV row. */
function sanitizeText(value) {
  if (isBlank(value)) return '';
  return String(value).trim().replace(/\r\n|\r|\n/g, '\\n');
}

function isValidDate(value) {
  if (isBlank(value)) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

/**
 * Applies GrowEasy's business rules as a safety net on top of whatever the AI
 * returned, so a single bad model output can't produce data that violates
 * the enums or required-field rules. Never trusts the model's `skip` flag
 * blindly — re-derives it from the actual email/mobile presence.
 *
 * @param {object} raw - one record as returned by the AI (may be partial)
 * @returns {{ status: 'imported' | 'skipped', record?: object, reason?: string, row_index: number }}
 */
function validateRecord(raw) {
  const row_index = raw.row_index;

  const email = sanitizeText(raw.email);
  const mobile = sanitizeText(raw.mobile_without_country_code);

  if (!email && !mobile) {
    return {
      row_index,
      status: 'skipped',
      reason: raw.skip_reason || 'No email or mobile number found in this row.',
    };
  }

  const record = {};
  for (const field of CRM_FIELDS) {
    record[field] = sanitizeText(raw[field]);
  }
  record.email = email;
  record.mobile_without_country_code = mobile;

  // Enum guards — never let an invalid value leak into the CRM.
  if (record.crm_status && !CRM_STATUS_VALUES.includes(record.crm_status)) {
    record.crm_status = '';
  }
  if (record.data_source && !DATA_SOURCE_VALUES.includes(record.data_source)) {
    record.data_source = '';
  }

  // created_at must survive `new Date(created_at)` downstream, or we blank it
  // rather than ship a value that breaks the consuming app.
  if (record.created_at && !isValidDate(record.created_at)) {
    record.created_at = '';
  }

  return { row_index, status: 'imported', record };
}

/**
 * @param {Map<number, object>} aiResults - row_index -> AI record
 * @param {number} totalRows
 */
function validateAll(aiResults, totalRows) {
  const imported = [];
  const skipped = [];

  for (let row_index = 0; row_index < totalRows; row_index++) {
    const raw = aiResults.get(row_index);

    if (!raw) {
      skipped.push({ row_index, reason: 'AI did not return a result for this row.' });
      continue;
    }

    const result = validateRecord(raw);
    if (result.status === 'imported') {
      imported.push(result.record);
    } else {
      skipped.push({ row_index: result.row_index, reason: result.reason });
    }
  }

  return {
    imported,
    skipped,
    totalImported: imported.length,
    totalSkipped: skipped.length,
    totalRows,
  };
}

module.exports = { validateAll, validateRecord, sanitizeText, isValidDate };
