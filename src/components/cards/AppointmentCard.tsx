'use client';

import type { Appointment } from '@/lib/db/types';
import { StatusBadge, Card, CardContent } from '@/components/ui';

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
  const formattedDate = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card className="transition hover:border-slate-700">
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-slate-400">Appointment #{appointment.id}</p>
            <p className="font-medium text-white">{formattedDate}</p>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {showDoctor && doctorName && (
            <div className="rounded-lg bg-slate-800/50 p-3">
              <p className="text-xs text-slate-500">Doctor</p>
              <p className="mt-0.5 text-sm font-medium text-white">{doctorName}</p>
            </div>
          )}
          {showPatient && patientName && (
            <div className="rounded-lg bg-slate-800/50 p-3">
              <p className="text-xs text-slate-500">Patient</p>
              <p className="mt-0.5 text-sm font-medium text-white">{patientName}</p>
            </div>
          )}
        </div>

        {appointment.diagnosis && (
          <div className="rounded-lg bg-emerald-500/5 p-3">
            <p className="text-xs text-emerald-400">Diagnosis</p>
            <p className="mt-1 text-sm text-slate-300">{appointment.diagnosis}</p>
          </div>
        )}

        {actions && <div className="flex flex-wrap gap-2 pt-2">{actions}</div>}
      </CardContent>
    </Card>
  );
}

