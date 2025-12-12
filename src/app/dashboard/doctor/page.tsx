'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AppointmentCard } from '@/components/cards/AppointmentCard';
import { DiagnosisForm } from '@/components/forms/DiagnosisForm';
import { NurseAssignmentForm } from '@/components/forms/NurseAssignmentForm';
import {
  Button,
  Modal,
  EmptyState,
  LoadingSpinner,
} from '@/components/ui';
import { useAppointments } from '@/hooks/useAppointments';
import { useUsers } from '@/hooks/useUsers';
import { useAuthStore } from '@/store/auth';
import type { Appointment } from '@/lib/db/types';
import { useToast } from '@/components/providers/ToastProvider';
import {
  Users,
  Plus,
  Calendar,
  FileText,
} from 'lucide-react';

export default function DoctorDashboardPage() {
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [diagnosisModalOpen, setDiagnosisModalOpen] = useState(false);
  const [assignNurseModalOpen, setAssignNurseModalOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const toast = useToast();
  const { appointmentsQuery, respondAppointmentMutation } = useAppointments();
  const { patientsQuery, nursesQuery, unassignNurseMutation } = useUsers();

  const patientsMap = useMemo(() => {
    const map = new Map<number, string>();
    patientsQuery.data?.forEach((patient) => map.set(patient.id, patient.name));
    return map;
  }, [patientsQuery.data]);

  const myNurses = useMemo(() => {
    if (!user?.id || !nursesQuery.data) return [];
    return nursesQuery.data.filter((nurse) => nurse.doctorId === user.id);
  }, [nursesQuery.data, user]);

  const handleRespond = (appointmentId: number, action: 'confirm' | 'deny') => {
    respondAppointmentMutation.mutate(
      { id: appointmentId, data: { action } },
      {
        onSuccess: () => {
          toast.success(
            action === 'confirm' ? 'Appointment confirmed' : 'Appointment denied',
            `Appointment #${appointmentId}`
          );
        },
      }
    );
  };

  const openDiagnosisModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDiagnosisModalOpen(true);
  };

  const pendingAppointments = appointmentsQuery.data?.filter(
    (apt) => apt.status === 'pending'
  );
  const confirmedAppointments = appointmentsQuery.data?.filter(
    (apt) => apt.status === 'confirmed'
  );
  const completedAppointments = appointmentsQuery.data?.filter(
    (apt) => apt.status === 'completed'
  );

  const uniquePatientHistory = useMemo(() => {
    if (!completedAppointments) return [];
    const patientMap = new Map<
      number,
      { patientId: number; name: string; lastAppointment: Appointment }
    >();
    completedAppointments.forEach((apt) => {
      const existing = patientMap.get(apt.patientId);
      if (
        !existing ||
        new Date(apt.date) > new Date(existing.lastAppointment.date)
      ) {
        patientMap.set(apt.patientId, {
          patientId: apt.patientId,
          name: patientsMap.get(apt.patientId) ?? `Patient #${apt.patientId}`,
          lastAppointment: apt,
        });
      }
    });
    return Array.from(patientMap.values());
  }, [completedAppointments, patientsMap]);

  return (
    <DashboardLayout allowedRoles={['doctor']}>
      <div className="grid gap-9">
        <div className="flex flex-col gap-6 border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="border-l-4 border-teal-600 pl-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Doctor
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
                Appointment board
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Confirm requests, complete visits, and keep patient notes current.
              </p>
            </div>
            <Button onClick={() => setAssignNurseModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Assign nurse
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-6 border-t border-slate-200 pt-6">
            <div className="border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Pending
              </p>
              <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
                {pendingAppointments?.length ?? 0}
              </p>
            </div>
            <div className="border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Confirmed
              </p>
              <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
                {confirmedAppointments?.length ?? 0}
              </p>
            </div>
            <div className="border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Nurses
              </p>
              <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
                {myNurses.length}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-9 xl:grid-cols-3">
          <section className="grid gap-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <p className="text-sm font-semibold text-slate-950">Requests</p>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Pending
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
            ) : pendingAppointments?.length === 0 ? (
              <EmptyState
                icon={<Calendar className="h-5 w-5" />}
                title="No pending requests"
                description="New appointment requests will appear here."
              />
            ) : (
              <div className="grid gap-6">
                {pendingAppointments?.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    showPatient
                    patientName={
                      patientsMap.get(appointment.patientId) ??
                      `Patient #${appointment.patientId}`
                    }
                    actions={
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleRespond(appointment.id, 'confirm')}
                          disabled={respondAppointmentMutation.isPending}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRespond(appointment.id, 'deny')}
                          disabled={respondAppointmentMutation.isPending}
                        >
                          Deny
                        </Button>
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-6 xl:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <p className="text-sm font-semibold text-slate-950">
                Confirmed visits
              </p>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Complete with diagnosis
              </span>
            </div>

            {appointmentsQuery.isPending ? (
              <div className="grid place-items-center border border-slate-200 bg-white p-6">
                <LoadingSpinner />
              </div>
            ) : confirmedAppointments?.length === 0 ? (
              <EmptyState
                icon={<Calendar className="h-5 w-5" />}
                title="No confirmed visits"
                description="Confirmed appointments appear here."
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {confirmedAppointments?.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    showPatient
                    patientName={
                      patientsMap.get(appointment.patientId) ??
                      `Patient #${appointment.patientId}`
                    }
                    actions={
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openDiagnosisModal(appointment)}
                      >
                        Complete
                      </Button>
                    }
                  />
                ))}
              </div>
            )}

            <div className="mt-6 border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-950">My nurses</p>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {myNurses.length}
                </span>
              </div>

              {nursesQuery.isPending ? (
                <div className="mt-6 grid place-items-center border border-slate-200 bg-white p-6">
                  <LoadingSpinner />
                </div>
              ) : myNurses.length === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    icon={<Users className="h-5 w-5" />}
                    title="No nurses assigned"
                    description="Assign a nurse to support patient work."
                  />
                </div>
              ) : (
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {myNurses.map((nurse) => (
                    <div
                      key={nurse.id}
                      className="flex items-center justify-between border border-slate-200 bg-white p-6"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {nurse.name}
                        </p>
                        <p className="truncate text-sm text-slate-700">
                          {nurse.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() =>
                            unassignNurseMutation.mutate(nurse.id, {
                              onSuccess: () => {
                                toast.success(
                                  'Nurse unassigned',
                                  `${nurse.name} is now unassigned.`
                                );
                              },
                            })
                          }
                          disabled={unassignNurseMutation.isPending}
                        >
                          Unassign
                        </Button>
                        <span className="grid h-9 w-9 place-items-center border border-slate-300 bg-white text-sm font-semibold text-teal-800">
                          {nurse.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="grid gap-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <p className="text-sm font-semibold text-slate-950">Patient history</p>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Completed
            </span>
          </div>

          {appointmentsQuery.isPending ? (
            <div className="grid place-items-center border border-slate-200 bg-white p-6">
              <LoadingSpinner />
            </div>
          ) : uniquePatientHistory.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-5 w-5" />}
              title="No history yet"
              description="Completed appointments with diagnoses appear here."
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {uniquePatientHistory.map((patient) => (
                <div key={patient.patientId} className="border border-slate-200 bg-white p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {patient.name}
                      </p>
                      <p className="text-sm text-slate-700">
                        Last visit {new Date(patient.lastAppointment.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="grid h-9 w-9 place-items-center border border-slate-300 bg-white text-sm font-semibold text-teal-800">
                      {patient.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {patient.lastAppointment.diagnosis && (
                    <div className="mt-6 border-l-4 border-teal-600 bg-slate-50 p-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Latest diagnosis
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-900">
                        {patient.lastAppointment.diagnosis}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <Modal
          isOpen={diagnosisModalOpen}
          onClose={() => setDiagnosisModalOpen(false)}
          title="Complete appointment"
        >
          {selectedAppointment && (
            <div className="grid gap-6">
              <p className="text-sm leading-6 text-slate-700">
                Adding a diagnosis will mark this appointment as completed.
              </p>
              <DiagnosisForm
                appointmentId={selectedAppointment.id}
                currentDiagnosis={selectedAppointment.diagnosis}
                onSuccess={() => setDiagnosisModalOpen(false)}
              />
            </div>
          )}
        </Modal>

        <Modal
          isOpen={assignNurseModalOpen}
          onClose={() => setAssignNurseModalOpen(false)}
          title="Assign nurse"
        >
          <NurseAssignmentForm onSuccess={() => setAssignNurseModalOpen(false)} />
        </Modal>
      </div>
    </DashboardLayout>
  );
}
