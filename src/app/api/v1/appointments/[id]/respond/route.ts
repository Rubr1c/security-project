import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { appointmentResponseSchema } from '@/lib/validation/appointment-schemas';
import { NextResponse } from 'next/server';
import * as v from 'valibot';
import { appointmentService } from '@/services/appointment-service';
import { ServiceError } from '@/services/errors';

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

  try {
      const response = await appointmentService.respondToAppointment(
          appointmentId, 
          session.userId, 
          result.output.action
      );
      
      logger.info({
        message: `Appointment ${response.status} by doctor`,
        meta: {
          appointmentId,
          doctorId: session.userId,
          patientId: response.patientId,
          action: result.output.action,
        },
      });

      return NextResponse.json(
        {
          message: `Appointment ${response.status} successfully`,
          status: response.status,
        },
        { status: STATUS.OK }
      );
  } catch (error) {
      if (error instanceof ServiceError) {
          return NextResponse.json({ error: error.message }, { status: error.status });
      }
      logger.error({ message: 'Respond to appointment error', error: error as Error });
      return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
