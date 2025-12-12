'use client';

import type { Medication } from '@/lib/db/types';
import { Pill } from 'lucide-react';

interface MedicationCardProps {
  medication: Medication;
}

export function MedicationCard({ medication }: MedicationCardProps) {
  return (
    <div className="border border-slate-200 bg-white">
      <div className="grid gap-3 p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
              Medication
            </p>
            <p className="mt-2 truncate text-sm font-extrabold tracking-tight text-slate-950">
              {medication.name}
            </p>
          </div>
          <div className="grid h-9 w-9 place-items-center border border-slate-300 bg-white text-teal-700">
            <Pill className="h-4 w-4" />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center border border-slate-300 bg-white px-3 py-2 text-xs font-semibold tracking-wide text-slate-700 uppercase">
            Appointment #{medication.appointmentId}
          </span>
          <span className="inline-flex items-center border border-teal-300 bg-teal-50 px-3 py-2 text-xs font-semibold tracking-wide text-teal-800 uppercase">
            {medication.dosage}
          </span>
        </div>

        <p className="text-sm leading-6 text-slate-700">
          {medication.instructions}
        </p>
      </div>
    </div>
  );
}
