'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AppointmentCard } from '@/components/cards/AppointmentCard';
import { MedicationCard } from '@/components/cards/MedicationCard';
import { BookAppointmentForm } from '@/components/forms/BookAppointmentForm';
import { Button, Modal, EmptyState, LoadingSpinner } from '@/components/ui';
import { useAppointments } from '@/hooks/useAppointments';
import { useMedications } from '@/hooks/useMedications';
import { useUsers } from '@/hooks/useUsers';
import { Calendar, Pill, Plus } from 'lucide-react';
import type { AppointmentStatus } from '@/lib/db/types';

export default function PatientDashboardPage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const { appointmentsQuery } = useAppointments();
  const { medicationsQuery } = useMedications();


  const sortedAppointments = useMemo(() => {
    const appointments = appointmentsQuery.data ?? [];

    const statusPriority: Record<AppointmentStatus, number> = {
      pending: 0,
      confirmed: 1,
      completed: 2,
      denied: 3,
    };

    return [...appointments].sort((a, b) => {
      const byStatus = statusPriority[a.status] - statusPriority[b.status];
      if (byStatus !== 0) return byStatus;

      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [appointmentsQuery.data]);

  return (
    <DashboardLayout allowedRoles={['patient']}>
      <div className="grid gap-9">
        <div className="grid gap-6 border border-slate-200 bg-white p-6 md:grid-cols-[1fr_320px]">
          <div className="border-l-4 border-teal-600 pl-6">
            <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
              Patient
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
              My care
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Request appointments and review medications tied to completed
              visits.
            </p>
          </div>

          <div className="grid gap-3 border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
              Actions
            </p>
            <Button onClick={() => setIsBookingOpen(true)}>
              <Plus className="h-4 w-4" />
              Book appointment
            </Button>
            <p className="text-sm text-slate-700">
              Choose a doctor and time. You&apos;ll see confirmation status
              below.
            </p>
          </div>
        </div>

        <div className="grid gap-9 lg:grid-cols-[1fr_420px]">
          <section className="grid gap-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <p className="text-sm font-semibold text-slate-950">
                Appointments
              </p>
              <span className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                Status
              </span>
            </div>

            {appointmentsQuery.isPending ? (
              <div className="grid place-items-center border border-slate-200 bg-white p-6">
                <LoadingSpinner />
              </div>
            ) : appointmentsQuery.isError ? (
              <div className="border border-red-300 bg-red-50 p-6 text-sm font-semibold text-red-800">
                Failed to load appointments
              </div>
            ) : appointmentsQuery.data?.length === 0 ? (
              <EmptyState
                icon={<Calendar className="h-5 w-5" />}
                title="No appointments"
                description="Book an appointment to get started."
              />
            ) : (
              <div className="grid gap-6">
                {sortedAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    showDoctor
                    doctorName={
                      appointment.doctorName ?? `Doctor #${appointment.doctorId}`
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <p className="text-sm font-semibold text-slate-950">
                Medications
              </p>
              <span className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                Prescriptions
              </span>
            </div>

            {medicationsQuery.isPending ? (
              <div className="grid place-items-center border border-slate-200 bg-white p-6">
                <LoadingSpinner />
              </div>
            ) : medicationsQuery.isError ? (
              <div className="border border-red-300 bg-red-50 p-6 text-sm font-semibold text-red-800">
                Failed to load medications
              </div>
            ) : medicationsQuery.data?.length === 0 ? (
              <EmptyState
                icon={<Pill className="h-5 w-5" />}
                title="No medications"
                description="Medications appear here after being added by staff."
              />
            ) : (
              <div className="grid gap-6">
                {medicationsQuery.data?.map((medication) => (
                  <MedicationCard key={medication.id} medication={medication} />
                ))}
              </div>
            )}
          </section>
        </div>

        <Modal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          title="Book appointment"
        >
          <BookAppointmentForm onSuccess={() => setIsBookingOpen(false)} />
        </Modal>
      </div>
    </DashboardLayout>
  );
}
