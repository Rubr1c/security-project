import { db } from '@/lib/db/client';
import { appointments } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { appointmentResponseSchema } from '@/lib/validation/appointment-schemas';
import { NextResponse } from 'next/server';
import * as v from 'valibot';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, { params }: RouteParams) {
  const session = await requireRole('doctor');

  if (!session) {
    logger.info({
      message: 'Unauthorized: Only doctors can respond to appointment requests',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const { id } = await params;
  const appointmentId = parseInt(id);

  if (isNaN(appointmentId) || appointmentId <= 0) {
    logger.info({
      message: 'Invalid appointment ID',
      meta: { id },
    });

    return NextResponse.json(
      { error: 'Invalid appointment ID' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  const body = await req.json();
  const result = v.safeParse(appointmentResponseSchema, body);

  if (!result.success) {
    logger.info({
      message: 'Invalid appointment response request',
      meta: body,
    });

    return NextResponse.json(
      { error: result.issues[0].message },
      { status: STATUS.BAD_REQUEST }
    );
  }

  const doctorId = session.userId;

  // Verify the appointment exists, belongs to this doctor, and is pending
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
    logger.info({
      message: 'Appointment not found or not assigned to this doctor',
      meta: { appointmentId, doctorId },
    });

    return NextResponse.json(
      { error: 'Appointment not found' },
      { status: STATUS.NOT_FOUND }
    );
  }

  if (appointment[0].status !== 'pending') {
    logger.info({
      message: 'Appointment has already been responded to',
      meta: {
        appointmentId,
        currentStatus: appointment[0].status,
      },
    });

    return NextResponse.json(
      { error: `Appointment has already been ${appointment[0].status}` },
      { status: STATUS.BAD_REQUEST }
    );
  }

  const newStatus = result.output.action === 'confirm' ? 'confirmed' : 'denied';

  // Atomic update scoped to this doctor's pending appointment
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
    // Re-check to provide accurate error message
    const current = db
      .select({ status: appointments.status, doctorId: appointments.doctorId })
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .all();

    if (current.length === 0 || current[0].doctorId !== doctorId) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: STATUS.NOT_FOUND }
      );
    }

    if (current[0].status !== 'pending') {
      return NextResponse.json(
        { error: `Appointment has already been ${current[0].status}` },
        { status: STATUS.BAD_REQUEST }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: STATUS.INTERNAL_SERVER_ERROR }
    );
  }

  logger.info({
    message: `Appointment ${newStatus} by doctor`,
    meta: {
      appointmentId,
      doctorId,
      patientId: appointment[0].patientId,
      action: result.output.action,
    },
  });

  return NextResponse.json(
    {
      message: `Appointment ${newStatus} successfully`,
      status: newStatus,
    },
    { status: STATUS.OK }
  );
}
