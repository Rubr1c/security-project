'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MedicationCard } from '@/components/cards/MedicationCard';
import { AddMedicationForm } from '@/components/forms/AddMedicationForm';
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
import {
  useAppointments,
  useAppointmentMedications,
} from '@/hooks/useAppointments';
import { useUsers } from '@/hooks/useUsers';
import { useAuthStore } from '@/store/auth';
import type { Appointment } from '@/lib/db/types';
import { Stethoscope, ClipboardList, Plus, Eye, Pill } from 'lucide-react';

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
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Nurse Dashboard
          </h1>
          <p className="mt-1 text-slate-500">
            Manage medications for your assigned doctor&apos;s patients
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50">
                <Stethoscope className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-800">
                  {assignedDoctor?.name ?? 'Not Assigned'}
                </p>
                <p className="text-sm text-slate-500">Assigned Doctor</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-800">
                  {doctorAppointments.length}
                </p>
                <p className="text-sm text-slate-500">Completed Appointments</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {!user?.doctorId ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<Stethoscope className="h-6 w-6" />}
                title="Not assigned to a doctor"
                description="You need to be assigned to a doctor before you can manage patient medications"
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Completed Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              {appointmentsQuery.isPending ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : appointmentsQuery.isError ? (
                <div className="py-8 text-center text-red-600">
                  Failed to load appointments
                </div>
              ) : doctorAppointments.length === 0 ? (
                <EmptyState
                  icon={<ClipboardList className="h-6 w-6" />}
                  title="No completed appointments"
                  description="Completed appointments from your assigned doctor will appear here"
                />
              ) : (
                <div className="space-y-4">
                  {doctorAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-slate-800">
                            {patientsMap.get(appointment.patientId) ??
                              `Patient #${appointment.patientId}`}
                          </p>
                          <p className="text-sm text-slate-500">
                            {new Date(appointment.date).toLocaleDateString()} at{' '}
                            {new Date(appointment.date).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              openViewMedicationsModal(appointment)
                            }
                          >
                            <Eye className="h-4 w-4" />
                            View Meds
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openAddMedicationModal(appointment)}
                          >
                            <Plus className="h-4 w-4" />
                            Add Medication
                          </Button>
                        </div>
                      </div>
                      {appointment.diagnosis && (
                        <div className="mt-3 rounded-md bg-gray-50 p-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Diagnosis
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            {appointment.diagnosis}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Modal
          isOpen={addMedicationModalOpen}
          onClose={() => setAddMedicationModalOpen(false)}
          title="Add Medication"
        >
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="rounded-md bg-gray-50 p-3">
                <p className="text-sm text-slate-500">
                  Patient:{' '}
                  <span className="font-medium text-slate-800">
                    {patientsMap.get(selectedAppointment.patientId) ??
                      `Patient #${selectedAppointment.patientId}`}
                  </span>
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
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (medicationsQuery.isError) {
    return (
      <div className="py-8 text-center text-red-600">
        Failed to load medications
      </div>
    );
  }

  if (!medicationsQuery.data?.length) {
    return (
      <EmptyState
        icon={<Pill className="h-6 w-6" />}
        title="No medications"
        description="No medications have been added to this appointment"
      />
    );
  }

  return (
    <div className="space-y-3">
      {medicationsQuery.data.map((medication) => (
        <MedicationCard key={medication.id} medication={medication} />
      ))}
    </div>
  );
}
