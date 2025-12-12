'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MedicationCard } from '@/components/cards/MedicationCard';
import { AddMedicationForm } from '@/components/forms/AddMedicationForm';
import { Button, Modal, EmptyState, LoadingSpinner } from '@/components/ui';
import {
  useAppointments,
  useAppointmentMedications,
} from '@/hooks/useAppointments';
import { useUsers } from '@/hooks/useUsers';
import { useAuthStore } from '@/store/auth';
import type { Appointment } from '@/lib/db/types';
import { Stethoscope, Plus, Eye, Pill } from 'lucide-react';

export default function NurseDashboardPage() {
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [addMedicationModalOpen, setAddMedicationModalOpen] = useState(false);
  const [viewMedicationsModalOpen, setViewMedicationsModalOpen] =
    useState(false);

  const user = useAuthStore((state) => state.user);
  const { appointmentsQuery } = useAppointments();
  const { patientsQuery, doctorsQuery } = useUsers();

  const patientsMap = useMemo(() => {
    const map = new Map<number, string>();
    patientsQuery.data?.forEach((patient) => map.set(patient.id, patient.name));
    return map;
  }, [patientsQuery.data]);

  const assignedDoctor = useMemo(() => {
    if (!user?.doctorId || !doctorsQuery.data) return null;
    return doctorsQuery.data.find((doc) => doc.id === user.doctorId);
  }, [doctorsQuery.data, user]);

  const doctorAppointments = useMemo(() => {
    if (!user?.doctorId || !appointmentsQuery.data) return [];
    return appointmentsQuery.data.filter(
      (apt) => apt.doctorId === user.doctorId && apt.status === 'completed'
    );
  }, [appointmentsQuery.data, user]);

  const openAddMedicationModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setAddMedicationModalOpen(true);
  };

  const openViewMedicationsModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setViewMedicationsModalOpen(true);
  };

  return (
    <DashboardLayout allowedRoles={['nurse']}>
      <div className="grid gap-9">
        <div className="border-l-4 border-teal-600 pl-6">
          <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
            Nurse
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
            Medication queue
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Add medications to completed appointments for your assigned doctor.
          </p>
        </div>

        <div className="grid gap-6 border border-slate-200 bg-white p-6 md:grid-cols-2">
          <div className="border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
              Assigned doctor
            </p>
            <div className="mt-3 flex items-center justify-between gap-6">
              <p className="truncate text-sm font-extrabold tracking-tight text-slate-950">
                {assignedDoctor?.name ?? 'Not assigned'}
              </p>
              <span className="grid h-9 w-9 place-items-center border border-slate-300 bg-white text-teal-700">
                <Stethoscope className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-700">
              {assignedDoctor?.email ?? 'Ask an admin to assign you.'}
            </p>
          </div>

          <div className="border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
              Completed appointments
            </p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
              {doctorAppointments.length}
            </p>
            <p className="mt-3 text-sm text-slate-700">
              These are eligible for medication entries.
            </p>
          </div>
        </div>

        {!user?.doctorId ? (
          <EmptyState
            icon={<Stethoscope className="h-5 w-5" />}
            title="No doctor assignment"
            description="You need an assigned doctor before managing medications."
          />
        ) : (
          <section className="grid gap-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <p className="text-sm font-semibold text-slate-950">
                Completed appointments
              </p>
              <span className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                Add / review meds
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
            ) : doctorAppointments.length === 0 ? (
              <EmptyState
                icon={<Pill className="h-5 w-5" />}
                title="No completed appointments"
                description="Once completed, appointments show up here."
              />
            ) : (
              <div className="grid gap-6">
                {doctorAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="border border-slate-200 bg-white p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-6">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                          Patient
                        </p>
                        <p className="mt-2 truncate text-sm font-extrabold tracking-tight text-slate-950">
                          {patientsMap.get(appointment.patientId) ??
                            `Patient #${appointment.patientId}`}
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          {new Date(appointment.date).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openViewMedicationsModal(appointment)}
                        >
                          <Eye className="h-4 w-4" />
                          View meds
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openAddMedicationModal(appointment)}
                        >
                          <Plus className="h-4 w-4" />
                          Add medication
                        </Button>
                      </div>
                    </div>

                    {appointment.diagnosis && (
                      <div className="mt-6 border-l-4 border-teal-600 bg-slate-50 p-6">
                        <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                          Diagnosis
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-900">
                          {appointment.diagnosis}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <Modal
          isOpen={addMedicationModalOpen}
          onClose={() => setAddMedicationModalOpen(false)}
          title="Add medication"
        >
          {selectedAppointment && (
            <div className="grid gap-6">
              <div className="border border-slate-200 bg-slate-50 p-6">
                <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                  Patient
                </p>
                <p className="mt-2 text-sm font-extrabold tracking-tight text-slate-950">
                  {patientsMap.get(selectedAppointment.patientId) ??
                    `Patient #${selectedAppointment.patientId}`}
                </p>
              </div>
              <AddMedicationForm
                appointmentId={selectedAppointment.id}
                onSuccess={() => setAddMedicationModalOpen(false)}
              />
            </div>
          )}
        </Modal>

        <Modal
          isOpen={viewMedicationsModalOpen}
          onClose={() => setViewMedicationsModalOpen(false)}
          title="Medications"
        >
          {selectedAppointment && (
            <MedicationsListModal appointmentId={selectedAppointment.id} />
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}

function MedicationsListModal({ appointmentId }: { appointmentId: number }) {
  const medicationsQuery = useAppointmentMedications(appointmentId);

  if (medicationsQuery.isPending) {
    return (
      <div className="grid place-items-center border border-slate-200 bg-white p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (medicationsQuery.isError) {
    return (
      <div className="border border-red-300 bg-red-50 p-6 text-sm font-semibold text-red-800">
        Failed to load medications
      </div>
    );
  }

  if (!medicationsQuery.data?.length) {
    return (
      <EmptyState
        icon={<Pill className="h-5 w-5" />}
        title="No medications"
        description="Nothing added for this appointment yet."
      />
    );
  }

  return (
    <div className="grid gap-6">
      {medicationsQuery.data.map((medication) => (
        <MedicationCard key={medication.id} medication={medication} />
      ))}
    </div>
  );
}
