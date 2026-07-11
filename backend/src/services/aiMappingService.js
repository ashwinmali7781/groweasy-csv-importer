'use strict';

const { CRM_FIELDS, CRM_STATUS_VALUES, DATA_SOURCE_VALUES, DEFAULTS } = require('../config/constants');

const MODEL = process.env.GEMINI_MODEL || DEFAULTS.GEMINI_MODEL;
const MAX_RETRIES_PER_BATCH = 3;

// @google/genai is ESM-first and its CJS `require()` entrypoint can resolve
// to an empty module under some Node/bundler setups. Dynamic import() is the
// reliable way to load it from CommonJS, so we cache the loaded module.
let genaiModulePromise = null;
function loadGenAI() {
  if (!genaiModulePromise) {
    genaiModulePromise = import('@google/genai');
  }
  return genaiModulePromise;
}

let clientPromise = null;
function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    const err = new Error(
      'GEMINI_API_KEY is not set. Add it to backend/.env — see .env.example.'
    );
    err.statusCode = 500;
    throw err;
  }
  if (!clientPromise) {
    clientPromise = loadGenAI().then(({ GoogleGenAI }) => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));
  }
  return clientPromise;
}

function buildResponseSchema(Type) {
  return {
    type: Type.OBJECT,
    properties: {
      records: {
        type: Type.ARRAY,
        description: 'One entry per input row, in the same order, identified by row_index.',
        items: {
          type: Type.OBJECT,
          properties: {
            row_index: { type: Type.INTEGER, description: 'The row_index from the corresponding input row.' },
            skip: {
              type: Type.BOOLEAN,
              description: 'true if this row has neither an email nor a mobile number and must be skipped.',
            },
            skip_reason: { type: Type.STRING, description: 'Short reason why the row was skipped (only when skip=true).' },
            created_at: { type: Type.STRING, description: 'ISO-8601 or JS Date-parsable timestamp, or "" if unknown.' },
            name: { type: Type.STRING },
            email: { type: Type.STRING },
            country_code: { type: Type.STRING },
            mobile_without_country_code: { type: Type.STRING },
            company: { type: Type.STRING },
            city: { type: Type.STRING },
            state: { type: Type.STRING },
            country: { type: Type.STRING },
            lead_owner: { type: Type.STRING },
            crm_status: { type: Type.STRING, enum: [...CRM_STATUS_VALUES] },
            crm_note: { type: Type.STRING },
            data_source: { type: Type.STRING, enum: [...DATA_SOURCE_VALUES] },
            possession_time: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ['row_index', 'skip'],
        },
      },
    },
    required: ['records'],
  };
}

function buildSystemPrompt() {
  return `You are a data-mapping engine for GrowEasy, a real-estate CRM. You will be given raw CSV rows exported from arbitrary sources (Facebook Lead Ads, Google Ads, spreadsheets, other CRMs, hand-built sheets). Column names and layouts vary between uploads and are NOT fixed. Your job is to map each row's fields, however they are labeled, onto GrowEasy's CRM schema and return the results as JSON matching the given schema.

Target CRM fields:
${CRM_FIELDS.map((f) => `- ${f}`).join('\n')}

Rules you must follow exactly:

1. Allowed crm_status values — use one if it clearly fits. If nothing fits, OMIT the crm_status field entirely from your output for that record (do not invent a value and do not output an empty string):
   ${CRM_STATUS_VALUES.join(', ')}

2. Allowed data_source values — use one only if confidently determinable. If unsure, OMIT the data_source field entirely from your output for that record (never guess, never output an empty string):
   ${DATA_SOURCE_VALUES.join(', ')}

3. created_at must be a value JavaScript's \`new Date(created_at)\` can parse (e.g. "2026-05-13 14:20:48" or full ISO-8601). If no usable date exists, return "".

4. Use crm_note for: remarks, follow-up notes, extra comments, any additional email addresses or phone numbers beyond the primary ones, and any useful information that does not fit another field.

5. Multiple emails or mobile numbers in a single row:
   - Use the FIRST email as "email" and the FIRST mobile as "mobile_without_country_code".
   - Append every remaining email/number into crm_note (e.g. "Alt email: a@b.com; Alt phone: 98765xxxxx").

6. Keep every text field a single logical line. If the source text contains a real line break, replace it with a literal "\\n" escape sequence rather than an actual newline, so the record stays a valid single CSV row downstream.

7. Skip a row (skip=true, and fill skip_reason) only if it has NEITHER an email NOR a mobile number anywhere in the row. Otherwise process it normally, filling in as many fields as you can and leaving the rest as "".

8. country_code should be a phone country calling code like "+91" if determinable from the data (e.g. from a phone format or country field); otherwise "".

9. Never invent data. If a field cannot be determined from the row, leave it as an empty string "" — do not guess names, statuses, or sources.

Return one entry per input row, preserving row_index, as the "records" array.`;
}

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) {
    out.push(array.slice(i, i + size));
  }
  return out;
}

async function extractBatch(ai, responseSchema, batch) {
  const userPayload = batch.map((row) => ({ row_index: row.row_index, fields: row.fields }));

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES_PER_BATCH; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: `Map these ${batch.length} raw CSV rows to the GrowEasy CRM schema:\n\n${JSON.stringify(
          userPayload,
          null,
          2
        )}`,
        config: {
          systemInstruction: buildSystemPrompt(),
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.1,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Empty response from Gemini.');
      }

      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed.records)) {
        throw new Error('Model response did not include a valid "records" array.');
      }
      return parsed.records;
    } catch (err) {
      lastError = err;
      // Exponential-ish backoff before retrying a transient failure (rate limit, timeout, etc.)
      if (attempt < MAX_RETRIES_PER_BATCH) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }

  throw new Error(
    `AI extraction failed for a batch of ${batch.length} rows after ${MAX_RETRIES_PER_BATCH} attempts: ${lastError.message}`
  );
}

/**
 * Sends parsed CSV rows to Gemini in batches and returns the raw, unvalidated
 * mapping results keyed back to their original row index.
 *
 * @param {Record<string, string>[]} rows - parsed CSV rows (arbitrary columns)
 * @param {{ batchSize?: number, onProgress?: (done:number, total:number) => void }} [options]
 * @returns {Promise<Map<number, object>>} row_index -> extracted record
 */
async function mapRowsToCrm(rows, options = {}) {
  const batchSize = options.batchSize || Number(process.env.BATCH_SIZE) || DEFAULTS.BATCH_SIZE;
  const [ai, { Type }] = await Promise.all([getClient(), loadGenAI()]);
  const responseSchema = buildResponseSchema(Type);

  const indexed = rows.map((fields, row_index) => ({ row_index, fields }));
  const batches = chunk(indexed, batchSize);

  const results = new Map();
  let done = 0;

  for (const batch of batches) {
    const batchResults = await extractBatch(ai, responseSchema, batch);
    for (const record of batchResults) {
      results.set(record.row_index, record);
    }
    done += batch.length;
    if (options.onProgress) options.onProgress(done, rows.length);
  }

  return results;
}

module.exports = { mapRowsToCrm, buildSystemPrompt, buildResponseSchema };
