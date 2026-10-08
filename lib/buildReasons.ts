// lib/buildReasons.ts

/**
 * Single source of truth for the "why is this flagged" reasons.
 * Used by the queue cards, dashboard table, and review screen so the
 * reason is identical everywhere it's displayed.
 *
 * Priority:
 *  1. Vendor name / PO mismatch — fraud signal, surfaced first
 *  2. Duplicate invoice number
 *  3. Match engine's own tier_reason
 *  4. Extraction anomalies the AI flagged
 *  5. Fallback message
 */
export function buildReasons(ex: any, match: any): string[] {
  const out: string[] = [];
  const poVendorScore = match?.field_scores?.vendor;

  // PRIORITY 1: Vendor-name vs PO mismatch (fraud signal)
  if (
    ex?.po_number &&
    poVendorScore != null &&
    poVendorScore < 0.7 &&
    match?.match_method !== 'no_match'
  ) {
    out.push(
      `Vendor name does not match authorized vendor on PO ${ex.po_number}`,
    );
  }

  // PRIORITY 2: Duplicate
  if (match?.is_duplicate === true) {
    out.push(
      `Duplicate invoice number — already seen as ${match.duplicate_of || 'unknown'}`,
    );
  }

  // PRIORITY 3: Match engine's own reason
  if (match?.tier_reason && !out.includes(String(match.tier_reason))) {
    out.push(String(match.tier_reason));
  }

  // PRIORITY 4: Extraction anomalies
  if (Array.isArray(ex?.extraction_notes)) {
    for (const note of ex.extraction_notes) {
      if (note && !out.includes(String(note))) {
        out.push(String(note));
      }
    }
  }

  // Fallback
  if (out.length === 0) {
    const conf = match?.confidence ?? 0;
    if (conf > 0 && conf < 0.5) {
      out.push(
        `Low match confidence (${Math.round(conf * 100)}%) — manual review required`,
      );
    } else {
      out.push('Flagged for manual review');
    }
  }

  return out;
}