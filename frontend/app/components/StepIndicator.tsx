'use client';

import { Check } from 'lucide-react';
import type { Step } from '@/lib/types';

const STEPS: { key: Step; label: string }[] = [
  { key: 'upload', label: 'Upload' },
  { key: 'preview', label: 'Preview' },
  { key: 'processing', label: 'Confirm' },
  { key: 'results', label: 'Result' },
];

export default function StepIndicator({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <ol className="flex items-center">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <li key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 ${
                  isActive
                    ? 'border-grow-500 bg-grow-500 text-paper shadow-[0_0_0_4px] shadow-grow-100'
                    : isDone
                    ? 'border-grow-400 bg-grow-500 text-paper'
                    : 'border-line bg-white text-muted'
                }`}
              >
                {isDone ? (
                  <Check size={14} strokeWidth={2.5} />
                ) : (
                  <span className="font-mono text-[11px] tabular-nums">{i + 1}</span>
                )}
              </div>
              <span
                className={`hidden text-[11px] font-medium sm:block ${
                  isActive ? 'text-grow-600' : isDone ? 'text-ink' : 'text-muted'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="mx-1.5 h-px w-6 shrink-0 overflow-hidden bg-line sm:w-10">
                <div
                  className="h-full bg-grow-400 transition-all duration-500"
                  style={{ width: isDone ? '100%' : '0%' }}
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
