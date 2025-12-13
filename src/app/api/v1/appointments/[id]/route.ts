import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { getSession, requireRole } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';
import { appointmentService } from '@/services/appointment-service';
import { ServiceError } from '@/services/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await requireRole('patient', 'doctor', 'nurse');

  if (!session) {
    logger.info({
      message:
        'Unauthorized: Only patients and doctors can view appointment details',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const { userId, role: userRole } = session;

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

  try {
      const appointment = await appointmentService.getAppointmentById(appointmentId, userId, userRole);
      
      logger.info({
        message: 'Appointment details fetched',
        meta: {
          appointmentId,
          userId,
          role: userRole,
        },
      });

      return NextResponse.json(appointment);
  } catch (error) {
      if (error instanceof ServiceError) {
          return NextResponse.json({ error: error.message }, { status: error.status });
      }
      logger.error({ message: 'Get appointment details error', error: error as Error });
      return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
