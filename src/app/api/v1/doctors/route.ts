import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import {
  createUserSchema,
  deleteUserSchema,
} from '@/lib/validation/user-schemas';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import * as v from 'valibot';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  if (req.headers.get('x-user-role') !== 'admin') {
    logger.info({
      message: 'Unauthorized',
      meta: {
        'x-user-id': req.headers.get('x-user-id') ?? 'unknown',
        'x-user-role': req.headers.get('x-user-role') ?? 'unknown',
      },
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

  db.insert(users)
    .values({
      email: result.output.email,
      name: result.output.name,
      passwordHash: await bcrypt.hash(result.output.password, 10),
      role: 'doctor',
    })
    .run();

  logger.info({
    message: 'Doctor created successfully',
    meta: {
      email: result.output.email,
    },
  });

  return NextResponse.json(
    { message: 'Doctor Created' },
    { status: STATUS.CREATED }
  );
}

export async function GET(req: Request) {
  if (req.headers.get('x-user-role') !== 'admin') {
    logger.info({
      message: 'Unauthorized',
      meta: {
        'x-user-id': req.headers.get('x-user-id') ?? 'unknown',
        'x-user-role': req.headers.get('x-user-role') ?? 'unknown',
      },
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const doctors = db.select().from(users).where(eq(users.role, 'doctor')).all();

  logger.info({
    message: 'Doctors fetched',
    meta: {
      count: doctors.length,
    },
  });

  return NextResponse.json(doctors);
}

export async function DELETE(req: Request) {
  if (req.headers.get('x-user-role') !== 'admin') {
    logger.info({
      message: 'Unauthorized',
      meta: {
        'x-user-id': req.headers.get('x-user-id') ?? 'unknown',
        'x-user-role': req.headers.get('x-user-role') ?? 'unknown',
      },
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const body = await req.json();
  const result = v.safeParse(deleteUserSchema, body);

  if (!result.success) {
    logger.info({ message: 'Invalid delete doctor request', meta: body });
    return NextResponse.json(
      { error: result.issues[0].message },
      { status: STATUS.BAD_REQUEST }
    );
  }

  db.delete(users).where(eq(users.id, result.output.id)).run();

  logger.info({
    message: 'Doctor deleted successfully',
    meta: {
      id: result.output.id,
    },
  });

  return NextResponse.json(
    { message: 'Doctor Deleted' },
    { status: STATUS.OK }
  );
}
