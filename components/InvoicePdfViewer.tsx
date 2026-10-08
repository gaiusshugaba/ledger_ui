// components/InvoicePdfViewer.tsx
'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Maximize2,
  Download,
  Minus,
  Plus,
  FileText,
} from 'lucide-react';

export function InvoicePdfViewer({
  fileUrl,
  mimeType,
  fileName,
}: {
  fileUrl: string | null;
  mimeType: string | null;
  fileName: string;
}) {
  const [zoom, setZoom] = useState(100);
  const [page] = useState(1);
  const totalPages = 2;

  const isPdf = (mimeType ?? '').includes('pdf') || fileName.endsWith('.pdf');
  const isImage = (mimeType ?? '').startsWith('image/');

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-neutral-200">
        <div className="flex items-center gap-4">
          <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
            {isPdf ? 'PDF' : isImage ? 'IMG' : 'FILE'}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-1 text-xs text-neutral-600">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Search in document"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Fit"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          {fileUrl && (
            <a
              href={fileUrl}
              download={fileName}
              className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
              aria-label="Download"
            >
              <Download className="h-4 w-4" />
            </a>
          )}

          <div className="mx-2 h-4 w-px bg-neutral-200" />

          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-xs text-neutral-600">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Document surface */}
      <div className="mt-4 flex-1 min-h-0 overflow-auto rounded-2xl bg-[#EDEBE6] p-6">
        <div
          className="mx-auto bg-white shadow-md"
          style={{
            width: `${zoom * 6}px`,
            maxWidth: '100%',
            minHeight: '700px',
          }}
        >
          {!fileUrl ? (
            <div className="flex h-full min-h-[700px] flex-col items-center justify-center gap-3 text-neutral-400">
              <FileText className="h-10 w-10" />
              <p className="text-sm">No file attached</p>
            </div>
          ) : isPdf ? (
            <iframe
              src={`${fileUrl}#toolbar=0&navpanes=0&view=FitH`}
              title={fileName}
              className="h-[900px] w-full"
            />
          ) : isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fileUrl}
              alt={fileName}
              className="h-auto w-full object-contain"
            />
          ) : (
            <div className="flex h-full min-h-[700px] flex-col items-center justify-center gap-3 text-neutral-400">
              <FileText className="h-10 w-10" />
              <p className="text-sm">Preview not available</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-neutral-600 underline"
              >
                Open file
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}