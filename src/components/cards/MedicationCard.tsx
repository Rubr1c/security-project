'use client';

import type { Medication } from '@/lib/db/types';
import { Card, CardContent } from '@/components/ui';

interface MedicationCardProps {
  medication: Medication;
}

export function MedicationCard({ medication }: MedicationCardProps) {
  return (
    <Card className="transition hover:border-slate-700">
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500">
            <span className="text-lg">💊</span>
          </div>
          <div>
            <h4 className="font-medium text-white">{medication.name}</h4>
            <p className="text-sm text-slate-400">{medication.dosage}</p>
          </div>
        </div>
        <div className="rounded-lg bg-slate-800/50 p-3">
          <p className="text-xs text-slate-500">Instructions</p>
          <p className="mt-1 text-sm text-slate-300">{medication.instructions}</p>
        </div>
      </CardContent>
    </Card>
  );
}

