// app/api/intake/route.ts
import { NextRequest, NextResponse } from 'next/server';

const N8N_INTAKE_URL =
  process.env.N8N_INTAKE_URL ||
  'https://6luwcmb3.rcld.app/webhook/ledger/intake';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const incoming = await req.formData();
    const file = incoming.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Missing "file" field' },
        { status: 400 },
      );
    }

    // Send raw binary — n8n's webhook writes it to binary[binaryPropertyName]
    // which is set to "file" in the P1 Webhook Upload node.
    const buffer = Buffer.from(await file.arrayBuffer());

    const res = await fetch(N8N_INTAKE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        // Preserve the original filename so P1 can restore it
        'X-File-Name': encodeURIComponent(file.name),
        'X-File-Type': file.type || 'application/octet-stream',
      },
      body: buffer,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json(
        {
          error: `n8n responded ${res.status} ${res.statusText}`,
          body: text.slice(0, 500),
        },
        { status: 502 },
      );
    }

    const text = await res.text().catch(() => '');
    return NextResponse.json({ ok: true, n8n: text.slice(0, 500) });
  } catch (err: any) {
    console.error('[api/intake] proxy failed:', err);
    return NextResponse.json(
      { error: err?.message || 'Proxy failed' },
      { status: 500 },
    );
  }
}