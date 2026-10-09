// app/notifications/NotificationsContent.tsx
'use client';

import { useEffect, useState } from 'react';
import { Info, ChevronDown, Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { ToggleSwitch } from '@/components/ToggleSwitch';
import { ChannelDropdown } from '@/components/ChannelDropdown';
import { TierRoutingRow } from '@/components/TierRoutingRow';
import { SlackChannelRow } from '@/components/SlackChannelRow';
import { createClient } from '@/lib/supabase/client';

const CHANNEL_OPTIONS = [
  'ledger-notifications',
  'ledger-ops',
  'ledger-alerts',
  'general',
];

const TIMEZONE_OPTIONS = [
  'America/New_York (EST / UTC-5)',
  'America/Los_Angeles (PST / UTC-8)',
  'Europe/London (GMT / UTC+0)',
  'Europe/Berlin (CET / UTC+1)',
  'Asia/Singapore (SGT / UTC+8)',
];

const DEFAULTS = {
  tierRouting: {
    reconciled: { channel: 'ledger-notifications', enabled: false },
    review: { channel: 'ledger-notifications', enabled: true },
    exception: { channel: 'ledger-notifications', enabled: true },
  },
  slackChannels: {
    notifications: 'ledger-notifications',
    errors: 'ledger-ops',
  },
  dailySummary: {
    enabled: true,
    deliveryTime: '09:00',
    timezone: TIMEZONE_OPTIONS[0],
  },
};

export function NotificationsContent() {
  const [reconciledChannel, setReconciledChannel] = useState(
    DEFAULTS.tierRouting.reconciled.channel,
  );
  const [reconciledEnabled, setReconciledEnabled] = useState(
    DEFAULTS.tierRouting.reconciled.enabled,
  );

  const [reviewChannel, setReviewChannel] = useState(
    DEFAULTS.tierRouting.review.channel,
  );
  const [reviewEnabled, setReviewEnabled] = useState(
    DEFAULTS.tierRouting.review.enabled,
  );

  const [exceptionChannel, setExceptionChannel] = useState(
    DEFAULTS.tierRouting.exception.channel,
  );
  const [exceptionEnabled, setExceptionEnabled] = useState(
    DEFAULTS.tierRouting.exception.enabled,
  );

  const [notificationsChannel, setNotificationsChannel] = useState(
    DEFAULTS.slackChannels.notifications,
  );
  const [errorsChannel, setErrorsChannel] = useState(
    DEFAULTS.slackChannels.errors,
  );

  const [dailySummaryEnabled, setDailySummaryEnabled] = useState(
    DEFAULTS.dailySummary.enabled,
  );
  const [deliveryTime, setDeliveryTime] = useState(
    DEFAULTS.dailySummary.deliveryTime,
  );
  const [timezone, setTimezone] = useState(DEFAULTS.dailySummary.timezone);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Load settings on mount ─────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');

      if (cancelled) return;

      if (error) {
        console.error('[notifications] load failed:', error);
        setErrorMsg('Failed to load settings');
        setLoading(false);
        return;
      }

      const map: Record<string, any> = {};
      for (const row of data ?? []) map[row.key] = row.value;

      const tier = map['notifications.tier_routing'] ?? DEFAULTS.tierRouting;
      setReconciledChannel(tier.reconciled?.channel ?? DEFAULTS.tierRouting.reconciled.channel);
      setReconciledEnabled(tier.reconciled?.enabled ?? DEFAULTS.tierRouting.reconciled.enabled);
      setReviewChannel(tier.review?.channel ?? DEFAULTS.tierRouting.review.channel);
      setReviewEnabled(tier.review?.enabled ?? DEFAULTS.tierRouting.review.enabled);
      setExceptionChannel(tier.exception?.channel ?? DEFAULTS.tierRouting.exception.channel);
      setExceptionEnabled(tier.exception?.enabled ?? DEFAULTS.tierRouting.exception.enabled);

      const slack = map['notifications.slack_channels'] ?? DEFAULTS.slackChannels;
      setNotificationsChannel(slack.notifications ?? DEFAULTS.slackChannels.notifications);
      setErrorsChannel(slack.errors ?? DEFAULTS.slackChannels.errors);

      const daily = map['notifications.daily_summary'] ?? DEFAULTS.dailySummary;
      setDailySummaryEnabled(daily.enabled ?? DEFAULTS.dailySummary.enabled);
      setDeliveryTime(daily.deliveryTime ?? DEFAULTS.dailySummary.deliveryTime);
      setTimezone(daily.timezone ?? DEFAULTS.dailySummary.timezone);

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Save ───────────────────────────────────────────────
  async function saveChanges() {
    setSaving(true);
    setErrorMsg(null);

    const supabase = createClient();
    const now = new Date().toISOString();

    const { error } = await supabase.from('settings').upsert([
      {
        key: 'notifications.tier_routing',
        value: {
          reconciled: { channel: reconciledChannel, enabled: reconciledEnabled },
          review: { channel: reviewChannel, enabled: reviewEnabled },
          exception: { channel: exceptionChannel, enabled: exceptionEnabled },
        },
        updated_at: now,
      },
      {
        key: 'notifications.slack_channels',
        value: {
          notifications: notificationsChannel,
          errors: errorsChannel,
        },
        updated_at: now,
      },
      {
        key: 'notifications.daily_summary',
        value: {
          enabled: dailySummaryEnabled,
          deliveryTime,
          timezone,
        },
        updated_at: now,
      },
    ]);

    if (error) {
      console.error('[notifications] save failed:', error);
      setErrorMsg(error.message || 'Save failed');
      setSaving(false);
      return;
    }

    setSaving(false);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-[#FCFCFA]">
        <Sidebar />
        <main className="flex flex-1 items-center justify-center text-sm text-neutral-400">
          Loading notifications…
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FCFCFA] text-neutral-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="border-b border-neutral-200 px-8 pt-6 pb-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                Notifications
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                Where we send alerts and summaries
              </p>
            </div>

            <div className="flex items-center gap-3">
              {savedAt && !saving && (
                <span className="text-xs text-emerald-600">Saved</span>
              )}
              <button
                type="button"
                onClick={saveChanges}
                disabled={saving}
                className="inline-flex items-center rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-8 py-6">
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <strong>Error:</strong> {errorMsg}
            </div>
          )}

          {/* Card 1: Tier routing */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6">
            <header className="mb-6">
              <h2 className="text-base font-semibold text-neutral-900">
                Tier routing
              </h2>
              <p className="mt-0.5 text-sm text-neutral-500">
                Where each tier of invoice goes
              </p>
            </header>

            <div className="divide-y divide-neutral-100">
              <TierRoutingRow
                tier="Reconciled"
                title="Straight-through matches with confidence ≥ 0.90"
                subtitle="Automated ledger posting; notifications silenced by default"
                channel={reconciledChannel}
                onChannelChange={setReconciledChannel}
                mode="Digest"
                enabled={reconciledEnabled}
                onToggle={setReconciledEnabled}
                channelOptions={CHANNEL_OPTIONS}
                muted
              />
              <TierRoutingRow
                tier="Review"
                title="Invoices needing human inspection (confidence 0.60–0.89)"
                subtitle="Line item ambiguity or minor date discrepancy"
                channel={reviewChannel}
                onChannelChange={setReviewChannel}
                mode="Instant"
                enabled={reviewEnabled}
                onToggle={setReviewEnabled}
                channelOptions={CHANNEL_OPTIONS}
              />
              <TierRoutingRow
                tier="Exception"
                title="Missing PO, duplicate, amount variance > 5%"
                subtitle="Immediate notification with ledger payout snapshot"
                badge="Email finance lead"
                channel={exceptionChannel}
                onChannelChange={setExceptionChannel}
                mode="Instant"
                enabled={exceptionEnabled}
                onToggle={setExceptionEnabled}
                channelOptions={CHANNEL_OPTIONS}
              />
            </div>
          </section>

          {/* Card 2: Slack channels */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6">
            <header className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-neutral-900">
                  Slack channels
                </h2>
                <p className="mt-0.5 text-sm text-neutral-500">
                  One channel per tier, or use the same for all
                </p>
              </div>

              <div className="flex items-center gap-2.5 rounded-full bg-[#F0F1F0] px-3.5 py-1.5 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-neutral-700">
                  Connected to Acme Corp Slack
                </span>
                <span className="font-mono text-[11px] font-semibold text-neutral-900">
                  #WK-902
                </span>
              </div>
            </header>

            <div className="divide-y divide-neutral-100">
              <SlackChannelRow
                title="Notifications channel"
                subtitle="General review queue alerts, weekly digests, and tier assignments"
                value={notificationsChannel}
                onChange={setNotificationsChannel}
                options={CHANNEL_OPTIONS}
              />
              <SlackChannelRow
                title="Errors channel"
                subtitle="Pipeline failures, parser timeouts, and severe OCR extraction errors"
                value={errorsChannel}
                onChange={setErrorsChannel}
                options={CHANNEL_OPTIONS}
              />
            </div>
          </section>

          {/* Card 3: Daily summary */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6">
            <header className="mb-6">
              <h2 className="text-base font-semibold text-neutral-900">
                Daily summary
              </h2>
              <p className="mt-0.5 text-sm text-neutral-500">
                A digest of yesterday&apos;s activity
              </p>
            </header>

            <div className="space-y-6">
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900">
                    Send daily summary
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    Includes total reconciled, pending exceptions, and pipeline
                    health statistics
                  </p>
                </div>
                <ToggleSwitch
                  checked={dailySummaryEnabled}
                  onChange={setDailySummaryEnabled}
                />
              </div>

              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900">
                    Delivery time &amp; timezone
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    Select when your reconciliation batch report publishes
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <div className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-3.5 py-2">
                    <input
                      type="time"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="w-[96px] bg-transparent text-sm font-medium text-neutral-800 focus:outline-none"
                    />
                  </div>

                  <div className="relative">
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="appearance-none rounded-xl border border-neutral-200 bg-white py-2 pl-3.5 pr-9 text-sm font-medium text-neutral-800 focus:border-neutral-400 focus:outline-none"
                    >
                      {TIMEZONE_OPTIONS.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                <span>
                  Summary will be posted to{' '}
                  <span className="font-medium text-neutral-700">
                    #{notificationsChannel}
                  </span>{' '}
                  at{' '}
                  <span className="font-medium text-neutral-700">
                    {formatTime12h(deliveryTime)}
                  </span>{' '}
                  {timezoneAbbrev(timezone)} every business day.
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h)) return hhmm;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${String(m ?? 0).padStart(2, '0')} ${suffix}`;
}

function timezoneAbbrev(tz: string): string {
  const match = tz.match(/\(([^)]+)\)/);
  if (!match) return '';
  return match[1].split('/')[0].trim();
}