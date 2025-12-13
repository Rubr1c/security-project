import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { createUserSchema } from '@/lib/validation/user-schemas';
import { NextResponse } from 'next/server';
import * as v from 'valibot';
import { nurseService } from '@/services/nurse-service';
import { ServiceError } from '@/services/errors';

export async function POST(req: Request) {
  const session = await requireRole('admin');

  if (!session) {
    logger.info({
      message: 'Unauthorized: Only admin can create nurses',
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

    logger.info({ message: 'Invalid create nurse request', meta: body });

    return NextResponse.json(
      { error: result.issues[0].message },
      { status: STATUS.BAD_REQUEST }
    );
  }

  try {
    const nurse = await nurseService.createNurse(result.output);

    logger.info({
      message: 'Nurse created successfully',
      meta: {
        email: nurse.email,
        createdBy: session.userId,
      },
    });

    return NextResponse.json(
      { message: 'Nurse Created' },
      { status: STATUS.CREATED }
    );
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error({ message: 'Create nurse error', error: error as Error });
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function GET() {
  const session = await requireRole('admin', 'doctor');

  if (!session) {
    logger.info({
      message: 'Unauthorized: Only admin and doctors can list nurses',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  try {
    const nurses = await nurseService.getAllNurses();

    logger.info({
      message: 'Nurses fetched',
      meta: {
        count: nurses.length,
        requestedBy: session.role,
      },
    });

    return NextResponse.json(nurses);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error({ message: 'Get nurses error', error: error as Error });
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
