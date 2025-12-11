'use client';

import type { Medication } from '@/lib/db/types';
import { Card, CardContent } from '@/components/ui';
import { Pill } from 'lucide-react';

interface MedicationCardProps {
  medication: Medication;
}

export function MedicationCard({ medication }: MedicationCardProps) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
            <Pill className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-slate-800">{medication.name}</h4>
            <p className="text-sm text-emerald-600">{medication.dosage}</p>
            <p className="mt-2 text-sm text-slate-500">
              {medication.instructions}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
