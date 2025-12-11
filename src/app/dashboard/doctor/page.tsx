'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AppointmentCard } from '@/components/cards/AppointmentCard';
import { DiagnosisForm } from '@/components/forms/DiagnosisForm';
import { NurseAssignmentForm } from '@/components/forms/NurseAssignmentForm';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  Button,
  Modal,
  EmptyState,
  LoadingSpinner,
} from '@/components/ui';
import { useAppointments } from '@/hooks/useAppointments';
import { useUsers } from '@/hooks/useUsers';
import { useAuthStore } from '@/store/auth';
import type { Appointment } from '@/lib/db/types';

export default function DoctorDashboardPage() {
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [diagnosisModalOpen, setDiagnosisModalOpen] = useState(false);
  const [assignNurseModalOpen, setAssignNurseModalOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const { appointmentsQuery, respondAppointmentMutation } = useAppointments();
  const { patientsQuery, nursesQuery } = useUsers();

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
    respondAppointmentMutation.mutate({ id: appointmentId, data: { action } });
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
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Doctor Dashboard</h1>
          <p className="mt-1 text-slate-400">
            Manage appointments and patient care
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
                <span className="text-2xl">⏳</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {pendingAppointments?.length ?? 0}
                </p>
                <p className="text-sm text-slate-400">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                <span className="text-2xl">✓</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {confirmedAppointments?.length ?? 0}
                </p>
                <p className="text-sm text-slate-400">Confirmed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {completedAppointments?.length ?? 0}
                </p>
                <p className="text-sm text-slate-400">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10">
                <span className="text-2xl">👩‍⚕️</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {myNurses.length}
                </p>
                <p className="text-sm text-slate-400">My Nurses</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pending Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              {appointmentsQuery.isPending ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : appointmentsQuery.isError ? (
                <div className="py-8 text-center text-red-400">
                  Failed to load appointments
                </div>
              ) : pendingAppointments?.length === 0 ? (
                <EmptyState
                  icon="✨"
                  title="No pending appointments"
                  description="All caught up!"
                />
              ) : (
                <div className="space-y-4">
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
                            onClick={() =>
                              handleRespond(appointment.id, 'confirm')
                            }
                            disabled={respondAppointmentMutation.isPending}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              handleRespond(appointment.id, 'deny')
                            }
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Confirmed Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              {appointmentsQuery.isPending ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : confirmedAppointments?.length === 0 ? (
                <EmptyState
                  icon="📅"
                  title="No confirmed appointments"
                  description="Confirm pending appointments to see them here"
                />
              ) : (
                <div className="space-y-4">
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
                          Complete & Add Diagnosis
                        </Button>
                      }
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Nurses</CardTitle>
            <Button size="sm" onClick={() => setAssignNurseModalOpen(true)}>
              Assign Nurse
            </Button>
          </CardHeader>
          <CardContent>
            {nursesQuery.isPending ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : myNurses.length === 0 ? (
              <EmptyState
                icon="👩‍⚕️"
                title="No nurses assigned"
                description="Assign nurses to help manage your patients"
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myNurses.map((nurse) => (
                  <div
                    key={nurse.id}
                    className="flex items-center gap-3 rounded-lg bg-slate-800/50 p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-semibold text-white">
                      {nurse.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white">{nurse.name}</p>
                      <p className="text-sm text-slate-400">{nurse.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Patient History</CardTitle>
          </CardHeader>
          <CardContent>
            {appointmentsQuery.isPending ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : uniquePatientHistory.length === 0 ? (
              <EmptyState
                icon="📋"
                title="No patient history"
                description="Completed appointments with diagnoses will appear here"
              />
            ) : (
              <div className="space-y-4">
                {uniquePatientHistory.map((patient) => (
                  <div
                    key={patient.patientId}
                    className="rounded-lg border border-slate-700 bg-slate-800/30 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-lg font-semibold text-white">
                          {patient.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {patient.name}
                          </p>
                          <p className="text-sm text-slate-400">
                            Last visit:{' '}
                            {new Date(
                              patient.lastAppointment.date
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    {patient.lastAppointment.diagnosis && (
                      <div className="mt-3 rounded-md bg-slate-900/50 p-3">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                          Latest Diagnosis
                        </p>
                        <p className="mt-1 text-sm text-slate-300">
                          {patient.lastAppointment.diagnosis}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Modal
          isOpen={diagnosisModalOpen}
          onClose={() => setDiagnosisModalOpen(false)}
          title="Complete Appointment"
        >
          {selectedAppointment && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
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
          title="Assign Nurse"
        >
          <NurseAssignmentForm
            onSuccess={() => setAssignNurseModalOpen(false)}
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
}
