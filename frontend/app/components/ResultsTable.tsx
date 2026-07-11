'use client';

import { useState } from 'react';
import { ListChecks, CheckCircle2, XCircle, Percent, type LucideIcon } from 'lucide-react';
import { CRM_FIELDS, type ImportResult } from '@/lib/types';

export default function ResultsTable({ result }: { result: ImportResult }) {
  const [tab, setTab] = useState<'imported' | 'skipped'>('imported');

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard icon={ListChecks} label="Total rows" value={result.totalRows} tone="neutral" />
        <SummaryCard icon={CheckCircle2} label="Imported" value={result.totalImported} tone="grow" />
        <SummaryCard icon={XCircle} label="Skipped" value={result.totalSkipped} tone="amber" />
        <SummaryCard
          icon={Percent}
          label="Success rate"
          value={
            result.totalRows > 0
              ? `${Math.round((result.totalImported / result.totalRows) * 100)}%`
              : '—'
          }
          tone="neutral"
        />
      </div>

      <div className="mb-3 flex gap-1 border-b border-line">
        <TabButton active={tab === 'imported'} onClick={() => setTab('imported')}>
          Imported ({result.totalImported})
        </TabButton>
        <TabButton active={tab === 'skipped'} onClick={() => setTab('skipped')}>
          Skipped ({result.totalSkipped})
        </TabButton>
      </div>

      {tab === 'imported' ? (
        <ImportedTable records={result.imported} />
      ) : (
        <SkippedTable rows={result.skipped} />
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone: 'grow' | 'amber' | 'neutral';
}) {
  const toneClasses =
    tone === 'grow'
      ? 'border-grow-400 bg-grow-50 text-grow-600'
      : tone === 'amber'
      ? 'border-amber-500/40 bg-amber-100 text-amber-700'
      : 'border-line bg-white text-ink';

  return (
    <div className={`rounded-lg border px-3.5 py-3.5 transition-transform hover:-translate-y-0.5 ${toneClasses}`}>
      <Icon size={16} strokeWidth={2} className="mb-2 opacity-70" />
      <p className="font-mono text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
        active ? 'border-grow-500 text-grow-600' : 'border-transparent text-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

function ImportedTable({ records }: { records: ImportResult['imported'] }) {
  if (records.length === 0) {
    return <EmptyState message="No records were successfully imported." />;
  }
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="scrollbar-thin max-h-[480px] overflow-auto">
        <table className="w-full min-w-max border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-panel/95 backdrop-blur">
            <tr>
              {CRM_FIELDS.map((f) => (
                <th
                  key={f}
                  className="whitespace-nowrap border-b border-line px-3 py-2.5 font-mono text-[11px] font-medium uppercase tracking-wide text-muted"
                >
                  {f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((rec, i) => (
              <tr key={i} className="odd:bg-white even:bg-paper/60 transition-colors hover:bg-grow-50/60">
                {CRM_FIELDS.map((f) => (
                  <td
                    key={f}
                    className="max-w-[220px] truncate whitespace-nowrap border-b border-line px-3 py-2 text-ink"
                    title={rec[f]}
                  >
                    {f === 'crm_status' && rec[f] ? (
                      <span className="rounded-full bg-grow-100 px-2 py-0.5 text-xs font-medium text-grow-600">
                        {rec[f]}
                      </span>
                    ) : (
                      rec[f] || <span className="text-muted">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SkippedTable({ rows }: { rows: ImportResult['skipped'] }) {
  if (rows.length === 0) {
    return <EmptyState message="Nothing was skipped — every row had an email or mobile number." />;
  }
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-panel">
          <tr>
            <th className="border-b border-line px-3 py-2.5 font-mono text-[11px] font-medium uppercase tracking-wide text-muted">
              Row
            </th>
            <th className="border-b border-line px-3 py-2.5 font-mono text-[11px] font-medium uppercase tracking-wide text-muted">
              Reason
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.row_index} className="odd:bg-white even:bg-paper/60">
              <td className="whitespace-nowrap border-b border-line px-3 py-2 font-mono text-xs text-muted">
                {row.row_index + 1}
              </td>
              <td className="border-b border-line px-3 py-2 text-amber-700">{row.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-line px-6 py-14 text-center text-sm text-muted">
      {message}
    </div>
  );
}
