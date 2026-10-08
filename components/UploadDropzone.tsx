// components/UploadDropzone.tsx
'use client';

import { useRef, useState } from 'react';
import { CloudUpload, Folder } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function UploadDropzone({ onUploaded }: { onUploaded?: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;

    setBusy(true);
    setStatusMsg(null);

    const supabase = createClient();
    let ok = 0;
    let failed = 0;

    for (const file of list) {
      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${Date.now()}-${safeName}`;

        const { error: upErr } = await supabase.storage
          .from('invoices')
          .upload(path, file, { upsert: false });

        if (upErr) throw upErr;

        const { data: urlData } = supabase.storage
          .from('invoices')
          .getPublicUrl(path);

        const { error: insErr } = await supabase.from('invoices').insert({
          file_name: file.name,
          file_url: urlData.publicUrl,
          storage_path: path,
          mime_type: file.type || 'application/octet-stream',
          file_size_bytes: file.size,
          source: 'upload',
          status: 'review_required',
        });

        if (insErr) throw insErr;
        ok++;
      } catch (err) {
        console.error('[upload] file failed:', file.name, err);
        failed++;
      }
    }

    setBusy(false);
    if (failed === 0) {
      setStatusMsg(`Uploaded ${ok} file${ok === 1 ? '' : 's'}`);
    } else {
      setStatusMsg(`Uploaded ${ok}, failed ${failed}`);
    }
    onUploaded?.();
  }

  return (
    <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-4">
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
        className={`flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
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

      {statusMsg && (
        <p className="mt-3 text-center text-xs text-neutral-500">{statusMsg}</p>
      )}
    </div>
  );
}