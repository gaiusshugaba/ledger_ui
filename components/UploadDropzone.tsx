// components/UploadDropzone.tsx
'use client';

import { useRef, useState } from 'react';
import { CloudUpload, Folder, CheckCircle2, AlertCircle } from 'lucide-react';

const INTAKE_ENDPOINT = '/api/intake';

type UploadResult = {
  fileName: string;
  ok: boolean;
  error?: string;
};

export function UploadDropzone({ onUploaded }: { onUploaded?: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;

    setBusy(true);
    setResults([]);

    const out: UploadResult[] = [];

    for (const file of list) {
      try {
        // Post through our Next.js API route — it forwards to n8n server-side,
        // avoiding browser CORS restrictions.
        const form = new FormData();
        form.append('file', file, file.name);

        const res = await fetch(INTAKE_ENDPOINT, {
          method: 'POST',
          body: form,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body?.error ||
              `Intake failed: ${res.status} ${res.statusText}`,
          );
        }

        out.push({ fileName: file.name, ok: true });
      } catch (err: any) {
        console.error('[upload] file failed:', file.name, err);
        out.push({
          fileName: file.name,
          ok: false,
          error: err?.message || 'Upload failed',
        });
      }
    }

    setResults(out);
    setBusy(false);
    onUploaded?.();
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          dragging
            ? 'border-neutral-400 bg-neutral-100'
            : 'border-neutral-200 bg-[#FAFAFA]'
        }`}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white ring-1 ring-neutral-200">
          <CloudUpload className="h-5 w-5 text-neutral-500" strokeWidth={2} />
        </div>

        <p className="mt-4 text-lg font-semibold tracking-tight text-neutral-900">
          {busy ? 'Uploading…' : 'Drag and drop invoices here'}
        </p>
        <p className="mt-1.5 text-sm text-neutral-500">
          PDF, XML, CSV, JSON or images up to 10mb each
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
          disabled={busy}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 disabled:opacity-60"
        >
          <Folder className="h-4 w-4 text-neutral-700" />
          Browse files
        </button>

        <p className="mt-5 text-sm text-neutral-400">
          Bulk upload supported - drop multiple files at once
        </p>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.xml,.csv,.json,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {results.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {results.map((r, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                r.ok
                  ? 'bg-[#DEF7EC] text-[#03543F]'
                  : 'bg-[#FDE8E8] text-[#9B1C1C]'
              }`}
            >
              {r.ok ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate font-medium">{r.fileName}</span>
              {!r.ok && (
                <span className="ml-auto shrink-0 truncate text-[11px] opacity-80">
                  {r.error}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}