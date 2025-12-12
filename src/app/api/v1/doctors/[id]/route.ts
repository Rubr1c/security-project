import { db, sqlite } from '@/lib/db/client';
import { appointments, medications, users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await requireRole('admin');

  if (!session) {
    logger.info({
      message: 'Unauthorized: Only admin can delete doctors',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const { id } = await params;
  const doctorId = parseInt(id);

  if (Number.isNaN(doctorId) || doctorId <= 0) {
    return NextResponse.json(
      { error: 'Invalid doctor ID' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  // Only select needed columns - avoid fetching passwordHash/otpHash etc.
  const doctor = db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(and(eq(users.id, doctorId), eq(users.role, 'doctor')))
    .all();

  if (doctor.length === 0) {
    return NextResponse.json(
      { error: 'Doctor not found' },
      { status: STATUS.NOT_FOUND }
    );
  }

  const url = new URL(req.url);
  const force =
    url.searchParams.get('force') === 'true' ||
    url.searchParams.get('force') === '1';

  const nowIso = new Date().toISOString();

  // Prevent deleting doctors that are still referenced by appointments (doctorId is NOT nullable)
  const appts = db
    .select({ id: appointments.id })
    .from(appointments)
    .where(eq(appointments.doctorId, doctorId))
    .all();

  if (appts.length > 0 && !force) {
    logger.info({
      message: 'Doctor delete blocked: doctor has appointments',
      meta: { id: doctorId, appointmentCount: appts.length },
    });

    return NextResponse.json(
      {
        error:
          'This doctor has appointments. Delete anyway to remove the doctor and all associated appointments/medications.',
      },
      { status: STATUS.CONFLICT }
    );
  }

  // Transaction to avoid partial deletes.
  sqlite.transaction(() => {
    // Unassign nurses from this doctor (doctorId is nullable on users)
    db.update(users)
      .set({ doctorId: null, updatedAt: nowIso })
      .where(eq(users.doctorId, doctorId))
      .run();

    if (appts.length > 0) {
      const apptIds = appts.map((a) => a.id);

      // Delete medications before deleting appointments (FK: medications -> appointments)
      db.delete(medications)
        .where(inArray(medications.appointmentId, apptIds))
        .run();

      db.delete(appointments).where(inArray(appointments.id, apptIds)).run();
    }

    // Constrain delete to role='doctor' for safety
    const deleteResult = db
      .delete(users)
      .where(and(eq(users.id, doctorId), eq(users.role, 'doctor')))
      .run();

    if (deleteResult.changes === 0) {
      throw new Error('Doctor not found or already deleted');
    }
  })();

  logger.info({
    message: 'Doctor deleted successfully',
    meta: {
      id: doctorId,
      deletedBy: session.userId,
    },
  });

  return NextResponse.json(
    { message: 'Doctor Deleted' },
    { status: STATUS.OK }
  );
}
