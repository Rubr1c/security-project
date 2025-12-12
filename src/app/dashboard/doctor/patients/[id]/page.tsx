'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingSpinner, Button } from '@/components/ui';
import { apiClient } from '@/services/api/client';
import { notFound, useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, FileText, Pill } from 'lucide-react';
import type { User as AppUser, Appointment, Medication } from '@/lib/db/types';

interface PatientDetails extends AppUser {
  appointments: Appointment[];
  medications: Medication[];
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const {
    data: patient,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const res = await apiClient.get<PatientDetails>(`/patients/${id}`);
      return res.data;
    },
    retry: false,
  });

  if (isPending) {
    return (
      <DashboardLayout allowedRoles={['doctor']}>
        <div className="grid h-96 place-items-center">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout allowedRoles={['doctor']}>
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-red-600">Failed to load patient details.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) return notFound();

  return (
    <DashboardLayout allowedRoles={['doctor']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {patient.name}
            </h1>
            <p className="text-sm text-slate-500">{patient.email}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Patient Info Card */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-teal-50 text-teal-600">
                <User className="h-5 w-5" />
              </div>
              <h2 className="font-semibold text-slate-900">
                Patient Information
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between border-b border-slate-50 py-2">
                <span className="text-sm text-slate-500">ID</span>
                <span className="text-sm font-medium text-slate-900">
                  {patient.id}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-50 py-2">
                <span className="text-sm text-slate-500">Role</span>
                <span className="text-sm font-medium text-slate-900 capitalize">
                  {patient.role}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-sm text-slate-500">Joined</span>
                <span className="text-sm font-medium text-slate-900">
                  {new Date(patient.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500 uppercase">
                  Appointments
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {patient.appointments.length}
                </p>
              </div>
              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500 uppercase">
                  Medications
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {patient.medications.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Lists */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Appointment History */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-400" />
              <h3 className="font-semibold text-slate-900">
                Appointment History
              </h3>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              {patient.appointments.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No appointments recorded.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {patient.appointments.map((apt) => (
                    <div key={apt.id} className="p-4 hover:bg-slate-50">
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-900">
                          {new Date(apt.date).toLocaleDateString()}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${
                            apt.status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : apt.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {apt.diagnosis || 'No diagnosis yet'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Medications */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-slate-400" />
              <h3 className="font-semibold text-slate-900">Medications</h3>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              {patient.medications.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No medications recorded.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {patient.medications.map((med) => (
                    <div key={med.id} className="p-4 hover:bg-slate-50">
                      <p className="font-medium text-slate-900">{med.name}</p>
                      <p className="text-sm text-slate-600">
                        {med.dosage} - {med.instructions}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
