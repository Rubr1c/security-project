'use client';

import type { Appointment } from '@/lib/db/types';
import { StatusBadge } from '@/components/ui';
import { Calendar, User, Stethoscope } from 'lucide-react';

interface AppointmentCardProps {
  appointment: Appointment;
  showPatient?: boolean;
  showDoctor?: boolean;
  actions?: React.ReactNode;
  patientName?: string;
  doctorName?: string;
}

export function AppointmentCard({
  appointment,
  showPatient = false,
  showDoctor = false,
  actions,
  patientName,
  doctorName,
}: AppointmentCardProps) {
  const formattedDate = new Date(appointment.date).toLocaleString();

  return (
    <div className="border border-slate-200 bg-white">
      <div className="grid gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Appointment {appointment.id}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-700" />
              <p className="text-sm font-semibold text-slate-950">
                {formattedDate}
              </p>
            </div>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {showDoctor && doctorName && (
            <div className="flex items-center gap-3 border border-slate-200 bg-slate-50 p-3">
              <Stethoscope className="h-4 w-4 text-teal-700" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Doctor
                </p>
                <p className="truncate text-sm font-semibold text-slate-950">
                  {doctorName}
                </p>
              </div>
            </div>
          )}
          {showPatient && patientName && (
            <div className="flex items-center gap-3 border border-slate-200 bg-slate-50 p-3">
              <User className="h-4 w-4 text-teal-700" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Patient
                </p>
                <p className="truncate text-sm font-semibold text-slate-950">
                  {patientName}
                </p>
              </div>
            </div>
          )}
        </div>

        {appointment.diagnosis && (
          <div className="border-l-4 border-teal-600 bg-slate-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Diagnosis
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-900">
              {appointment.diagnosis}
            </p>
          </div>
        )}

        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </div>
  );
}
