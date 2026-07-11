'use client';

import { useCallback, useRef, useState } from 'react';
import { UploadCloud, AlertCircle } from 'lucide-react';

interface Props {
  onFileSelected: (file: File) => void;
  error?: string | null;
}

export default function FileDropzone({ onFileSelected, error }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith('.csv')) return;
      onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed px-6 py-20 text-center transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-grow-500 ${
          isDragging
            ? 'scale-[1.01] border-grow-500 bg-grow-50'
            : 'border-line bg-white hover:border-grow-400 hover:bg-grow-50/40'
        }`}
      >
        <div
          className={`mb-5 flex h-14 w-14 items-center justify-center rounded-full border transition-all duration-300 ${
            isDragging
              ? 'border-grow-500 bg-grow-500 text-paper'
              : 'border-line bg-panel text-muted group-hover:border-grow-400 group-hover:text-grow-500'
          }`}
        >
          <UploadCloud size={22} strokeWidth={1.75} />
        </div>
        <p className="font-display text-xl font-semibold text-ink">
          Drop a CSV here, or click to choose a file
        </p>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Facebook exports, Google Ads, spreadsheets, other CRMs — any column layout works.
        </p>
        <span className="mt-6 rounded-full border border-line bg-panel px-3 py-1 font-mono text-[11px] text-muted">
          .csv only
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && (
        <p className="mt-3 flex items-start gap-2 rounded border border-rust-500/30 bg-rust-100 px-3 py-2 text-sm text-rust-500">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
