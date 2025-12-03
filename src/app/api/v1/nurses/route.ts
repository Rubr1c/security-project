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
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request) {
  if (req.headers.get('x-user-role') !== 'admin') {
    logger.info({
      message: 'Unauthorized: Only admin can create nurses',
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

    logger.info({ message: 'Invalid create nurse request', meta: body });

    return NextResponse.json(
      { error: result.issues[0].message },
      { status: STATUS.BAD_REQUEST }
    );
  }

  // Check if email already exists
  const existingUser = db
    .select()
    .from(users)
    .where(eq(users.email, result.output.email))
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
      email: result.output.email,
      name: result.output.name,
      passwordHash: await bcrypt.hash(result.output.password, 10),
      role: 'nurse',
    })
    .run();

  logger.info({
    message: 'Nurse created successfully',
    meta: {
      email: result.output.email,
      createdBy: req.headers.get('x-user-id'),
    },
  });

  return NextResponse.json(
    { message: 'Nurse Created' },
    { status: STATUS.CREATED }
  );
}

export async function GET(req: Request) {
  if (req.headers.get('x-user-role') !== 'admin') {
    logger.info({
      message: 'Unauthorized: Only admin can list nurses',
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
    },
  });

  return NextResponse.json(nurses);
}

export async function DELETE(req: Request) {
  if (req.headers.get('x-user-role') !== 'admin') {
    logger.info({
      message: 'Unauthorized: Only admin can delete nurses',
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
    logger.info({ message: 'Invalid delete nurse request', meta: body });
    return NextResponse.json(
      { error: result.issues[0].message },
      { status: STATUS.BAD_REQUEST }
    );
  }

  // Verify the user being deleted is actually a nurse
  const nurse = db
    .select()
    .from(users)
    .where(and(eq(users.id, result.output.id), eq(users.role, 'nurse')))
    .all();

  if (nurse.length === 0) {
    logger.info({
      message: 'Nurse not found',
      meta: { id: result.output.id },
    });

    return NextResponse.json(
      { error: 'Nurse not found' },
      { status: STATUS.NOT_FOUND }
    );
  }

  db.delete(users).where(eq(users.id, result.output.id)).run();

  logger.info({
    message: 'Nurse deleted successfully',
    meta: {
      id: result.output.id,
      deletedBy: req.headers.get('x-user-id'),
    },
  });

  return NextResponse.json({ message: 'Nurse Deleted' }, { status: STATUS.OK });
}
