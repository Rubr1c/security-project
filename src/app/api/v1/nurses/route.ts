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
import { encrypt, hashEmail } from '@/lib/security/crypto';
import { decryptUserRecords } from '@/lib/security/fields';

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

  const emailHashValue = hashEmail(result.output.email);

  const existingUser = db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.emailHash, emailHashValue))
    .all();

  if (existingUser.length > 0) {
    logger.info({
      message: 'Email already exists',
      meta: { email: result.output.email },
    });

    return NextResponse.json(
      { error: 'Email already exists' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  db.insert(users)
    .values({
      email: encrypt(result.output.email),
      emailHash: emailHashValue,
      name: encrypt(result.output.name),
      passwordHash: await bcrypt.hash(result.output.password, 10),
      role: 'nurse',
    })
    .run();

  logger.info({
    message: 'Nurse created successfully',
    meta: {
      email: result.output.email,
      createdBy: session.userId,
    },
  });

  return NextResponse.json(
    { message: 'Nurse Created' },
    { status: STATUS.CREATED }
  );
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

  const nurses = db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      doctorId: users.doctorId,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.role, 'nurse'))
    .all();

  logger.info({
    message: 'Nurses fetched',
    meta: {
      count: nurses.length,
      requestedBy: session.role,
    },
  });

  return NextResponse.json(
    decryptUserRecords(nurses, [
      'id',
      'email',
      'name',
      'role',
      'doctorId',
      'createdAt',
      'updatedAt',
    ])
  );
}
