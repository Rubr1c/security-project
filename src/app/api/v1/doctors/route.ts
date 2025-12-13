import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { createUserSchema } from '@/lib/validation/user-schemas';
import { NextResponse } from 'next/server';
import * as v from 'valibot';
import { doctorService } from '@/services/doctor-service';
import { ServiceError } from '@/services/errors';

export async function POST(req: Request) {
  const session = await requireRole('admin');

  if (!session) {
    logger.info({
      message: 'Unauthorized',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const body = await req.json();
  const result = v.safeParse(createUserSchema, body);

  if (!result.success) {
    delete body.password;

    logger.info({ message: 'Invalid create doctor request', meta: body });

    return NextResponse.json(
      { error: result.issues[0].message },
      { status: STATUS.BAD_REQUEST }
    );
  }

  try {
    const doctor = await doctorService.createDoctor(result.output);

    logger.info({
      message: 'Doctor created successfully',
      meta: {
        email: doctor.email,
      },
    });

    return NextResponse.json(
      { message: 'Doctor Created' },
      { status: STATUS.CREATED }
    );
  } catch (error) {
    // Handle unique constraint or other errors if needed, though service currently doesn't wrap them explicitly except generic errors
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error({ message: 'Create doctor error', error: error as Error });
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function GET() {
  const session = await requireRole('admin', 'patient', 'nurse');

  if (!session) {
    logger.info({
      message:
        'Unauthorized: Only admin, patients, and nurses can list doctors',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  try {
    const doctors = await doctorService.getAllDoctors();

    logger.info({
      message: 'Doctors fetched',
      meta: {
        count: doctors.length,
        requestedBy: session.role,
      },
    });

    return NextResponse.json(doctors);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error({ message: 'Get doctors error', error: error as Error });
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
