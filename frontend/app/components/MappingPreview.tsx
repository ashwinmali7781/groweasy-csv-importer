'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import { CRM_FIELDS, type CrmField } from '@/lib/types';

interface Props {
  headers: string[];
}

const HINTS: Array<{ test: RegExp; field: CrmField }> = [
  { test: /e-?mail/i, field: 'email' },
  { test: /(phone|mobile|contact\s*no|cell)/i, field: 'mobile_without_country_code' },
  { test: /^name$|full\s*name|lead\s*name/i, field: 'name' },
  { test: /company|organi[sz]ation|firm/i, field: 'company' },
  { test: /city|town/i, field: 'city' },
  { test: /state|province/i, field: 'state' },
  { test: /country/i, field: 'country' },
  { test: /status|stage/i, field: 'crm_status' },
  { test: /source|campaign|channel/i, field: 'data_source' },
  { test: /note|remark|comment/i, field: 'crm_note' },
  { test: /date|created|timestamp/i, field: 'created_at' },
  { test: /owner|assigned/i, field: 'lead_owner' },
  { test: /possession/i, field: 'possession_time' },
  { test: /desc/i, field: 'description' },
];

function guessField(header: string): CrmField | null {
  for (const { test, field } of HINTS) {
    if (test.test(header)) return field;
  }
  return null;
}

export default function MappingPreview({ headers }: Props) {
  const guesses = headers
    .map((h) => ({ header: h, field: guessField(h) }))
    .filter((g): g is { header: string; field: CrmField } => g.field !== null);

  const matchedFields = new Set(guesses.map((g) => g.field));
  const unmatchedCrmFields = CRM_FIELDS.filter((f) => !matchedFields.has(f)).slice(0, 6);

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="flex items-center gap-2 border-b border-line bg-panel/70 px-4 py-2.5 sm:px-5">
        <Sparkles size={14} className="text-grow-500" />
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
          How the AI will read your columns
        </p>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-2">
          {guesses.slice(0, 7).map(({ header, field }, i) => (
            <div
              key={header}
              className="flex items-center gap-2.5 text-sm opacity-0 animate-[fadeIn_0.4s_ease-out_forwards]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="min-w-0 flex-1 truncate rounded-md border border-line bg-panel px-2.5 py-1.5 font-mono text-xs text-ink">
                {header}
              </span>
              <ArrowRight size={14} className="shrink-0 text-grow-400" />
              <span className="min-w-0 flex-1 truncate rounded-md border border-grow-400 bg-grow-50 px-2.5 py-1.5 font-mono text-xs font-medium text-grow-600">
                {field}
              </span>
            </div>
          ))}
          {guesses.length === 0 && (
            <p className="text-sm text-muted">
              No obvious keyword matches in your headers — that&apos;s fine, the AI reads row
              content too, not just column names.
            </p>
          )}
        </div>

        {unmatchedCrmFields.length > 0 && (
          <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
            Still watching for:{' '}
            {unmatchedCrmFields.map((f, i) => (
              <span key={f} className="font-mono text-ink/70">
                {f}
                {i < unmatchedCrmFields.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-2px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
