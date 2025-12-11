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
}

function formatMeta(meta: string | null): Record<string, unknown> | null {
  if (!meta) return null;
  try {
    return JSON.parse(meta);
  } catch {
    return { raw: meta };
  }
}

function MetaDisplay({ meta }: { meta: string | null }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const parsed = formatMeta(meta);

  if (!parsed) return <span className="text-slate-400">-</span>;

  const entries = Object.entries(parsed);
  const preview = entries.slice(0, 2);
  const hasMore = entries.length > 2;

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1.5">
        {preview.map(([key, value]) => (
          <span
            key={key}
            className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs"
          >
            <span className="text-slate-500">{key}:</span>
            <span className="max-w-[120px] truncate text-slate-700">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </span>
          </span>
        ))}
        {hasMore && (
          <button
            onClick={() => setIsExpanded(true)}
            className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 transition hover:bg-emerald-100"
          >
            +{entries.length - 2} more
          </button>
        )}
      </div>

      <Modal
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        title="Log Details"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <pre className="overflow-auto text-sm">
              <code className="text-slate-700">
                {JSON.stringify(parsed, null, 2)}
              </code>
            </pre>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function LogTable({ logs }: LogTableProps) {
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Level
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Message
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Meta
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log.id} className="transition hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                  <div className="flex flex-col">
                    <span>
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <LogLevelBadge level={log.level} />
                </td>
                <td className="max-w-xs px-4 py-3 text-sm text-slate-800">
                  <span className="line-clamp-2">{log.message}</span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <MetaDisplay meta={log.meta} />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-slate-600 transition hover:bg-gray-200"
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

      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Log Entry Details"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Timestamp
                </p>
                <p className="mt-1 text-sm text-slate-800">
                  {new Date(selectedLog.timestamp).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Level
                </p>
                <div className="mt-1">
                  <LogLevelBadge level={selectedLog.level} />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Message
              </p>
              <p className="mt-1 text-sm text-slate-800">{selectedLog.message}</p>
            </div>

            {selectedLog.meta && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Metadata
                </p>
                <div className="mt-2 rounded-lg bg-gray-50 p-4">
                  <pre className="overflow-auto text-sm">
                    <code className="text-slate-700">
                      {JSON.stringify(formatMeta(selectedLog.meta), null, 2)}
                    </code>
                  </pre>
                </div>
              </div>
            )}

            {selectedLog.error && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Error
                </p>
                <div className="mt-2 rounded-lg bg-red-50 p-4">
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
