import { db } from '@/lib/db/client';
import { appointments, users, medications } from '@/lib/db/schema';
import { eq, and, aliasedTable, getTableColumns, inArray } from 'drizzle-orm';
import { ServiceError } from './errors';
import { encrypt, decrypt } from '@/lib/security/crypto';
import {
  decryptAppointmentRecords,
  decryptAppointmentFields,
  decryptUserFields,
  decryptMedicationRecords,
} from '@/lib/security/fields';

export const appointmentService = {
  async createAppointment(
    patientId: number,
    data: { doctorId: number; date: string }
  ) {
    // Check doctor
    const doctor = db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(and(eq(users.id, data.doctorId), eq(users.role, 'doctor')))
      .all();

    if (doctor.length === 0) {
      throw new ServiceError('Doctor not found', 404);
    }

    const appointmentDate = new Date(data.date);
    if (appointmentDate <= new Date()) {
      throw new ServiceError('Appointment date must be in the future', 400);
    }

    const insertResult = db
      .insert(appointments)
      .values({
        patientId,
        doctorId: data.doctorId,
        date: data.date,
        status: 'pending',
      })
      .run();

    return {
      appointmentId: insertResult.lastInsertRowid,
      patientId,
      doctorId: data.doctorId,
      date: data.date,
    };
  },

  async getAppointments(userId: number, role: string) {
    const doctors = aliasedTable(users, 'doctors');
    const patients = aliasedTable(users, 'patients');

    const baseQuery = db
      .select({
        ...getTableColumns(appointments),
        doctorName: doctors.name,
        patientName: patients.name,
      })
      .from(appointments)
      .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
      .leftJoin(patients, eq(appointments.patientId, patients.id));

    let userAppointments;

    if (role === 'patient') {
      userAppointments = baseQuery
        .where(eq(appointments.patientId, userId))
        .all();
    } else if (role === 'doctor') {
      userAppointments = baseQuery
        .where(eq(appointments.doctorId, userId))
        .all();
    } else {
      // Nurse
      const nurse = db
        .select({ id: users.id, doctorId: users.doctorId })
        .from(users)
        .where(eq(users.id, userId))
        .all();

      if (nurse.length === 0 || nurse[0].doctorId === null) {
        return []; // Nurse not assigned
      }

      userAppointments = baseQuery
        .where(eq(appointments.doctorId, nurse[0].doctorId))
        .all();
    }

    const decryptedAppointments = decryptAppointmentRecords(userAppointments);

    // Manually decrypt the joined name fields
    return decryptedAppointments.map((apt) => ({
      ...apt,
      doctorName: apt.doctorName ? decrypt(apt.doctorName) : undefined,
      patientName: apt.patientName ? decrypt(apt.patientName) : undefined,
    }));
  },

  async getAppointmentById(
    appointmentId: number,
    userId: number,
    role: string
  ) {
    const appointment = db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .all();

    if (appointment.length === 0) {
      throw new ServiceError('Appointment not found', 404);
    }

    if (role === 'patient') {
      if (appointment[0].patientId !== userId) {
        throw new ServiceError('Appointment not found', 404);
      }
    } else if (role === 'doctor') {
      if (appointment[0].doctorId !== userId) {
        throw new ServiceError('Appointment not found', 404);
      }
    } else if (role === 'nurse') {
      const nurse = db
        .select({ doctorId: users.doctorId })
        .from(users)
        .where(eq(users.id, userId))
        .get();

      if (!nurse || nurse.doctorId !== appointment[0].doctorId) {
        throw new ServiceError('Appointment not found', 404);
      }
    }

    const doctor = db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, appointment[0].doctorId))
      .all();

    const patient = db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, appointment[0].patientId))
      .all();

    return {
      ...decryptAppointmentFields(appointment[0]),
      doctor: doctor[0] ? decryptUserFields(doctor[0]) : null,
      patient: patient[0] ? decryptUserFields(patient[0]) : null,
    };
  },

  async respondToAppointment(
    appointmentId: number,
    doctorId: number,
    action: 'confirm' | 'deny'
  ) {
    const appointment = db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.doctorId, doctorId)
        )
      )
      .all();

    if (appointment.length === 0) {
      throw new ServiceError('Appointment not found', 404);
    }

    if (appointment[0].status !== 'pending') {
      throw new ServiceError(
        `Appointment has already been ${appointment[0].status}`,
        400
      );
    }

    const newStatus = action === 'confirm' ? 'confirmed' : 'denied';

    const updateResult = await db
      .update(appointments)
      .set({
        status: newStatus,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.doctorId, doctorId),
          eq(appointments.status, 'pending')
        )
      );

    if (updateResult.changes === 0) {
      // Concurrency check or state change in between
      throw new ServiceError('Failed to update appointment', 500);
    }

    return {
      appointmentId,
      patientId: appointment[0].patientId,
      doctorId,
      status: newStatus,
      action,
    };
  },

  async updateDiagnosis(
    appointmentId: number,
    doctorId: number,
    diagnosis: string
  ) {
    const appointment = db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.doctorId, doctorId)
        )
      )
      .all();

    if (appointment.length === 0) {
      throw new ServiceError('Appointment not found', 404);
    }

    const updateResult = await db
      .update(appointments)
      .set({
        diagnosis: encrypt(diagnosis),
        status: 'completed',
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.doctorId, doctorId)
        )
      );

    if (updateResult.changes === 0) {
      throw new ServiceError('Appointment not found', 404);
    }

    return { appointmentId, doctorId };
  },

  // Adding medication logic here since it's closely related to appointment access control
  async getMedications(appointmentId: number, userId: number, role: string) {
    // First check access logic which is identical to getAppointmentById essentially
    // Reuse getAppointmentById logic? Or simpler check.
    // Re-implementing for decoupling.

    const appointment = db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .all();

    if (appointment.length === 0) {
      throw new ServiceError('Appointment not found', 404);
    }

    if (role === 'patient') {
      if (appointment[0].patientId !== userId) {
        throw new ServiceError('Appointment not found', 404);
      }
    } else if (role === 'doctor') {
      if (appointment[0].doctorId !== userId) {
        throw new ServiceError('Appointment not found', 404);
      }
    } else if (role === 'nurse') {
      const nurse = db
        .select({ id: users.id, doctorId: users.doctorId })
        .from(users)
        .where(eq(users.id, userId))
        .all();

      if (
        nurse.length === 0 ||
        nurse[0].doctorId === null ||
        nurse[0].doctorId !== appointment[0].doctorId
      ) {
        throw new ServiceError('Appointment not found', 404);
      }
    }

    const appointmentMedications = db
      .select()
      .from(medications)
      .where(eq(medications.appointmentId, appointmentId))
      .all();

    return decryptMedicationRecords(appointmentMedications);
  },

  async addMedication(
    appointmentId: number,
    userId: number,
    role: string,
    data: { name: string; dosage: string; instructions: string }
  ) {
    const appointment = db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .all();

    if (appointment.length === 0) {
      throw new ServiceError('Appointment not found', 404);
    }

    if (role === 'doctor') {
      if (appointment[0].doctorId !== userId) {
        throw new ServiceError(
          'Not authorized to add medications to this appointment',
          403
        );
      }
    } else {
      // Nurse
      const nurse = db
        .select({ id: users.id, doctorId: users.doctorId })
        .from(users)
        .where(eq(users.id, userId))
        .all();

      if (nurse.length === 0 || nurse[0].doctorId === null) {
        throw new ServiceError('Nurse is not assigned to a doctor', 403);
      }

      if (appointment[0].doctorId !== nurse[0].doctorId) {
        throw new ServiceError(
          'Not authorized to add medications to this appointment',
          403
        );
      }
    }

    const insertResult = db
      .insert(medications)
      .values({
        appointmentId,
        name: encrypt(data.name),
        dosage: encrypt(data.dosage),
        instructions: encrypt(data.instructions),
      })
      .run();

    return {
      medicationId: insertResult.lastInsertRowid,
      appointmentId,
      name: data.name,
    };
  },

  async getAllMedications(userId: number, role: string) {
    let userAppointments;

    if (role === 'patient') {
      userAppointments = db
        .select({ id: appointments.id })
        .from(appointments)
        .where(eq(appointments.patientId, userId))
        .all();
    } else {
      userAppointments = db
        .select({ id: appointments.id })
        .from(appointments)
        .where(eq(appointments.doctorId, userId))
        .all();
    }

    if (userAppointments.length === 0) {
      return [];
    }

    const appointmentIds = userAppointments.map((a) => a.id);

    const userMedications = db
      .select({
        id: medications.id,
        appointmentId: medications.appointmentId,
        name: medications.name,
        dosage: medications.dosage,
        instructions: medications.instructions,
      })
      .from(medications)
      .where(inArray(medications.appointmentId, appointmentIds))
      .all();

    return decryptMedicationRecords(userMedications);
  },
};
