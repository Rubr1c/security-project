import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole, getSession } from '@/lib/auth/get-session';
import { createUserSchema } from '@/lib/validation/user-schemas';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import * as v from 'valibot';
import { eq } from 'drizzle-orm';

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

export async function GET() {
  const session = await getSession();

  if (!session || !['admin', 'patient', 'nurse'].includes(session.role)) {
    logger.info({
      message:
        'Unauthorized: Only admin, patients, and nurses can list doctors',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const doctors = db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, 'doctor'))
    .all();

  logger.info({
    message: 'Doctors fetched',
    meta: {
      count: doctors.length,
      requestedBy: session.role,
    },
  });

  return NextResponse.json(doctors);
}
