'use client';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

export function EmptyState({ icon = '📭', title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-5xl">{icon}</div>
      <h3 className="mt-4 text-lg font-medium text-white">{title}</h3>
      {description && <p className="mt-2 text-sm text-slate-400">{description}</p>}
    </div>
  );
}

