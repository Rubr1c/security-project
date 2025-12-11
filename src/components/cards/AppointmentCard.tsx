'use client';

import type { Appointment } from '@/lib/db/types';
import { StatusBadge, Card, CardContent } from '@/components/ui';
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
  const formattedDate = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-slate-500">
              Appointment #{appointment.id}
            </p>
            <div className="flex items-center gap-2 text-slate-800">
              <Calendar className="h-4 w-4 text-slate-400" />
              <p className="font-medium">{formattedDate}</p>
            </div>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {showDoctor && doctorName && (
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <Stethoscope className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-xs text-slate-500">Doctor</p>
                <p className="text-sm font-medium text-slate-800">
                  {doctorName}
                </p>
              </div>
            </div>
          )}
          {showPatient && patientName && (
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <User className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-xs text-slate-500">Patient</p>
                <p className="text-sm font-medium text-slate-800">
                  {patientName}
                </p>
              </div>
            </div>
          )}
        </div>

        {appointment.diagnosis && (
          <div className="rounded-lg bg-emerald-50 p-3">
            <p className="text-xs font-medium text-emerald-700">Diagnosis</p>
            <p className="mt-1 text-sm text-slate-700">
              {appointment.diagnosis}
            </p>
          </div>
        )}

        {actions && <div className="flex flex-wrap gap-2 pt-2">{actions}</div>}
      </CardContent>
    </Card>
  );
}
