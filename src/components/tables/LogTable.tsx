'use client';

import { useState } from 'react';
import { LogLevelBadge, Modal } from '@/components/ui';
import { Eye } from 'lucide-react';

interface Log {
  id: number;
  timestamp: string;
  message: string;
  meta: string | null;
  error: string | null;
  level: 'debug' | 'info' | 'warn' | 'error';
}

interface LogTableProps {
  logs: Log[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

function formatMeta(meta: string | null): Record<string, unknown> | null {
  if (!meta) return null;
  try {
    return JSON.parse(meta);
  } catch {
    return { raw: meta };
  }
}

function readString(obj: Record<string, unknown>, key: string): string | null {
  const value = obj[key];
  if (typeof value === 'string') return value;
  return null;
}

function readRecord(
  obj: Record<string, unknown>,
  key: string
): Record<string, unknown> | null {
  const value = obj[key];
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function toDisplayValue(value: unknown): string {
  if (value === null) return '—';
  if (value === undefined) return '—';
  if (typeof value === 'string') return value.length ? value : '—';
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (Array.isArray(value))
    return value.length ? value.map((v) => toDisplayValue(v)).join(', ') : '—';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function metaPreview(meta: string | null): string {
  const parsed = formatMeta(meta);
  if (!parsed) return '-';

  const method = readString(parsed, 'method');
  const pathname = readString(parsed, 'pathname');
  const host = readString(parsed, 'host');
  const protocol = readString(parsed, 'protocol');

  if (method && pathname) {
    const left = `${method} ${pathname}`;
    const rightParts = [host, protocol].filter((v): v is string => !!v);
    const right = rightParts.length ? ` — ${rightParts.join(' ')}` : '';
    const base = `${left}${right}`;
    return base.length > 160 ? `${base.slice(0, 157)}…` : base;
  }

  const raw = readString(parsed, 'raw');
  if (raw) return raw.length > 160 ? `${raw.slice(0, 157)}…` : raw;

  const keys = Object.keys(parsed).slice(0, 3);
  const base = keys
    .map((k) => `${k}: ${toDisplayValue(parsed[k])}`)
    .join(' · ');
  return base.length > 160 ? `${base.slice(0, 157)}…` : base;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 border-t border-slate-200 py-3 first:border-t-0 first:pt-0 last:pb-0">
      <p className="text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
        {label}
      </p>
      <p className="min-w-0 text-sm break-words text-slate-900">{value}</p>
    </div>
  );
}

function MetaSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-3">
        <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
          {title}
        </p>
      </div>
      <div className="px-6 py-3">{children}</div>
    </section>
  );
}

function MetaDetails({ meta }: { meta: string }) {
  const parsed = formatMeta(meta);
  if (!parsed) return null;

  const requestHeaders = readRecord(parsed, 'headers');
  const queryParams = readRecord(parsed, 'queryParams');

  const auditItems: Array<{ label: string; value: string }> = [
    { label: 'Event', value: toDisplayValue(parsed.event) },
    { label: 'Actor ID', value: toDisplayValue(parsed.actorId) },
    { label: 'Patient ID', value: toDisplayValue(parsed.patientId) },
    { label: 'Resource', value: toDisplayValue(parsed.resource) },
    { label: 'Target User', value: toDisplayValue(parsed.targetUserId) },
    { label: 'Reason', value: toDisplayValue(parsed.reason) },
  ].filter((item) => item.value !== '—');

  const requestItems: Array<{ label: string; value: string }> = [
    { label: 'Method', value: toDisplayValue(parsed.method) },
    { label: 'Path', value: toDisplayValue(parsed.pathname) },
    { label: 'Protocol', value: toDisplayValue(parsed.protocol) },
    { label: 'Host', value: toDisplayValue(parsed.host) },
  ];

  const clientItems: Array<{ label: string; value: string }> = [
    { label: 'IP', value: toDisplayValue(parsed.ip) },
    { label: 'User agent', value: toDisplayValue(parsed.userAgent) },
    { label: 'Referer', value: toDisplayValue(parsed.referer) },
    { label: 'Content type', value: toDisplayValue(parsed.contentType) },
  ];

  return (
    <div className="grid gap-6">
      {auditItems.length > 0 && (
        <MetaSection title="Audit Context">
          <div>
            {auditItems.map((item) => (
              <MetaRow key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        </MetaSection>
      )}

      <MetaSection title="Request">
        <div>
          {requestItems.map((item) => (
            <MetaRow key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      </MetaSection>

      <MetaSection title="Client">
        <div>
          {clientItems.map((item) => (
            <MetaRow key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      </MetaSection>

      <MetaSection title="Query params">
        {!queryParams || Object.keys(queryParams).length === 0 ? (
          <p className="text-sm text-slate-700">—</p>
        ) : (
          <div>
            {Object.entries(queryParams).map(([k, v]) => (
              <MetaRow key={k} label={k} value={toDisplayValue(v)} />
            ))}
          </div>
        )}
      </MetaSection>

      <MetaSection title="Headers">
        {!requestHeaders || Object.keys(requestHeaders).length === 0 ? (
          <p className="text-sm text-slate-700">—</p>
        ) : (
          <div>
            {Object.entries(requestHeaders).map(([k, v]) => (
              <MetaRow key={k} label={k} value={toDisplayValue(v)} />
            ))}
          </div>
        )}
      </MetaSection>

      {'raw' in parsed && typeof parsed.raw === 'string' && (
        <MetaSection title="Raw">
          <p className="text-sm break-words whitespace-pre-wrap text-slate-900">
            {parsed.raw}
          </p>
        </MetaSection>
      )}
    </div>
  );
}

export function LogTable({
  logs,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: LogTableProps) {
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  return (
    <>
      <div className="overflow-x-auto border border-slate-200 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
                Timestamp
              </th>
              <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
                Level
              </th>
              <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
                Message
              </th>
              <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
                Meta
              </th>
              <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-3 py-3 text-sm whitespace-nowrap text-slate-700">
                  <div className="flex flex-col">
                    <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <LogLevelBadge level={log.level} />
                </td>
                <td className="max-w-xs px-3 py-3 text-sm text-slate-900">
                  <span className="line-clamp-2">{log.message}</span>
                </td>
                <td className="px-3 py-3 text-sm text-slate-700">
                  <span className="text-slate-700">
                    {metaPreview(log.meta)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="inline-flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-xs font-semibold tracking-wide text-slate-700 uppercase hover:bg-slate-50"
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && onLoadMore && (
        <div className="flex justify-center border border-t-0 border-slate-200 bg-white p-4">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {isLoadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Log Entry Details"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                  Timestamp
                </p>
                <p className="mt-1 text-sm text-slate-800">
                  {new Date(selectedLog.timestamp).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                  Level
                </p>
                <div className="mt-1">
                  <LogLevelBadge level={selectedLog.level} />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Message
              </p>
              <p className="mt-1 text-sm text-slate-800">
                {selectedLog.message}
              </p>
            </div>

            {selectedLog.meta && (
              <div>
                <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                  Metadata
                </p>
                <div className="mt-3">
                  <MetaDetails meta={selectedLog.meta} />
                </div>
              </div>
            )}

            {selectedLog.error && (
              <div>
                <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                  Error
                </p>
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-4">
                  <pre className="overflow-auto text-sm">
                    <code className="text-red-700">{selectedLog.error}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
