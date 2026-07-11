import type { ImportResult } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export class ApiRequestError extends Error {}

/**
 * Sends the original CSV file to the backend for full AI-powered import.
 * The backend re-parses the file itself (never trusts client-side parsing
 * for the fields that actually get stored) and returns the final result.
 */
export async function importCsv(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/csv/import`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let message = `Import failed with status ${response.status}.`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // response wasn't JSON — keep the generic message
    }
    throw new ApiRequestError(message);
  }

  return response.json();
}
