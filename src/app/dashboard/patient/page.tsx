'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AppointmentCard } from '@/components/cards/AppointmentCard';
import { MedicationCard } from '@/components/cards/MedicationCard';
import { BookAppointmentForm } from '@/components/forms/BookAppointmentForm';
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
import { useMedications } from '@/hooks/useMedications';
import { useUsers } from '@/hooks/useUsers';
import { Calendar, Pill, Plus } from 'lucide-react';

export default function PatientDashboardPage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const { appointmentsQuery } = useAppointments();
  const { medicationsQuery } = useMedications();
  const { doctorsQuery } = useUsers();

  const doctorsMap = useMemo(() => {
    const map = new Map<number, string>();
    doctorsQuery.data?.forEach((doc) => map.set(doc.id, doc.name));
    return map;
  }, [doctorsQuery.data]);

  return (
    <DashboardLayout allowedRoles={['patient']}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              Patient Dashboard
            </h1>
            <p className="mt-1 text-slate-500">
              Manage your appointments and medications
            </p>
          </div>
          <Button onClick={() => setIsBookingOpen(true)}>
            <Plus className="h-4 w-4" />
            Book Appointment
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Appointments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {appointmentsQuery.isPending ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : appointmentsQuery.isError ? (
                <div className="py-8 text-center text-red-600">
                  Failed to load appointments
                </div>
              ) : appointmentsQuery.data?.length === 0 ? (
                <EmptyState
                  icon={<Calendar className="h-6 w-6" />}
                  title="No appointments yet"
                  description="Book your first appointment to get started"
                />
              ) : (
                <div className="space-y-4">
                  {appointmentsQuery.data?.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      showDoctor
                      doctorName={
                        doctorsMap.get(appointment.doctorId) ??
                        `Doctor #${appointment.doctorId}`
                      }
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Medications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {medicationsQuery.isPending ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : medicationsQuery.isError ? (
                <div className="py-8 text-center text-red-600">
                  Failed to load medications
                </div>
              ) : medicationsQuery.data?.length === 0 ? (
                <EmptyState
                  icon={<Pill className="h-6 w-6" />}
                  title="No medications"
                  description="Your prescribed medications will appear here"
                />
              ) : (
                <div className="space-y-4">
                  {medicationsQuery.data?.map((medication) => (
                    <MedicationCard key={medication.id} medication={medication} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Modal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          title="Book New Appointment"
        >
          <BookAppointmentForm onSuccess={() => setIsBookingOpen(false)} />
        </Modal>
      </div>
    </DashboardLayout>
  );
}
