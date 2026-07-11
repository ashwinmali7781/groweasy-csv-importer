'use client';

import { useCallback, useState } from 'react';
import Papa from 'papaparse';
import { Loader2 } from 'lucide-react';
import StepIndicator from './components/StepIndicator';
import FileDropzone from './components/FileDropzone';
import CsvPreviewTable from './components/CsvPreviewTable';
import MappingPreview from './components/MappingPreview';
import ResultsTable from './components/ResultsTable';
import { importCsv, ApiRequestError } from '@/lib/api';
import type { ParsedCsv, ImportResult, Step } from '@/lib/types';

export default function HomePage() {
  const [step, setStep] = useState<Step>('upload');
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelected = useCallback((file: File) => {
    setError(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          setError('Could not read that CSV. Double-check the file and try again.');
          return;
        }
        const headers = results.meta.fields || [];
        setParsed({ file, headers, rows: results.data });
        setStep('preview');
      },
      error: () => setError('Could not read that CSV. Double-check the file and try again.'),
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!parsed) return;
    setIsSubmitting(true);
    setError(null);
    setStep('processing');
    try {
      const res = await importCsv(parsed.file);
      setResult(res);
      setStep('results');
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : 'Something went wrong during import.';
      setError(message);
      setStep('preview');
    } finally {
      setIsSubmitting(false);
    }
  }, [parsed]);

  const handleReset = useCallback(() => {
    setParsed(null);
    setResult(null);
    setError(null);
    setStep('upload');
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10 flex flex-col gap-6 rounded-xl border border-line bg-white/70 px-5 py-6 backdrop-blur sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full border border-grow-400/40 bg-grow-50 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-widest text-grow-600">
            GrowEasy
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            CSV Lead Importer
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
            Upload a CSV in any layout. The AI figures out which columns are which and maps them
            into GrowEasy&apos;s CRM format for you.
          </p>
        </div>
        <StepIndicator current={step} />
      </header>

      {step === 'upload' && (
        <section className="animate-[riseIn_0.35s_ease-out]">
          <FileDropzone onFileSelected={handleFileSelected} error={error} />
        </section>
      )}

      {step === 'preview' && parsed && (
        <section className="flex animate-[riseIn_0.35s_ease-out] flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white px-4 py-3.5">
            <div>
              <p className="font-display text-lg font-medium text-ink">{parsed.file.name}</p>
              <p className="text-sm text-muted">
                {parsed.rows.length} rows · {parsed.headers.length} columns detected
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-panel"
              >
                Choose a different file
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="rounded-md bg-grow-500 px-4 py-2 text-sm font-medium text-paper shadow-sm transition-all hover:bg-grow-600 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
              >
                Confirm &amp; run AI import
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded border border-rust-500/30 bg-rust-100 px-3 py-2 text-sm text-rust-500">
              {error}
            </p>
          )}

          <MappingPreview headers={parsed.headers} />
          <CsvPreviewTable headers={parsed.headers} rows={parsed.rows} />
        </section>
      )}

      {step === 'processing' && (
        <section className="flex animate-[riseIn_0.35s_ease-out] flex-col items-center justify-center gap-5 rounded-xl border border-line bg-white px-6 py-24 text-center">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-grow-200 opacity-60" />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-grow-50">
              <Loader2 size={24} className="animate-spin text-grow-500" />
            </span>
          </div>
          <p className="font-display text-lg font-medium text-ink">
            Mapping your columns to GrowEasy fields…
          </p>
          <p className="max-w-sm text-sm text-muted">
            The AI is reading each row in batches and extracting name, contact info, status, and
            notes. This can take a moment for larger files.
          </p>
        </section>
      )}

      {step === 'results' && result && (
        <section className="flex animate-[riseIn_0.35s_ease-out] flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white px-4 py-3.5">
            <div>
              <p className="font-display text-lg font-medium text-ink">Import complete</p>
              <p className="text-sm text-muted">
                {result.totalImported} of {result.totalRows} rows were mapped into CRM records.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-panel"
            >
              Import another file
            </button>
          </div>
          <ResultsTable result={result} />
        </section>
      )}

      <style>{`
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
