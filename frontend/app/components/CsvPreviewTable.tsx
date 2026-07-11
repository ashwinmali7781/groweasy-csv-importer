'use client';

import type { CsvRow } from '@/lib/types';

interface Props {
  headers: string[];
  rows: CsvRow[];
  maxPreviewRows?: number;
}

export default function CsvPreviewTable({ headers, rows, maxPreviewRows = 50 }: Props) {
  const shown = rows.slice(0, maxPreviewRows);

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="scrollbar-thin max-h-[420px] overflow-auto">
        <table className="w-full min-w-max border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-panel/95 backdrop-blur">
            <tr>
              <th className="border-b border-line px-3 py-2.5 font-mono text-[11px] font-medium uppercase tracking-wide text-muted">
                #
              </th>
              {headers.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap border-b border-line px-3 py-2.5 font-mono text-[11px] font-medium uppercase tracking-wide text-muted"
                >
                  {h || <span className="italic text-rust-500">(blank)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, i) => (
              <tr key={i} className="odd:bg-white even:bg-paper/60 transition-colors hover:bg-grow-50/60">
                <td className="whitespace-nowrap border-b border-line px-3 py-2 font-mono text-xs text-muted">
                  {i + 1}
                </td>
                {headers.map((h) => (
                  <td key={h} className="whitespace-nowrap border-b border-line px-3 py-2 text-ink">
                    {row[h] || <span className="text-muted">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > maxPreviewRows && (
        <div className="border-t border-line bg-panel px-3 py-2 text-xs text-muted">
          Showing first {maxPreviewRows} of {rows.length} rows. All {rows.length} rows will be
          imported on confirm.
        </div>
      )}
    </div>
  );
}
