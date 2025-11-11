import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { loginSchema } from '@/lib/validation/user-schemas';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import * as v from 'valibot';
import { logger } from '@/lib/logger';
import { jwt } from '@/lib/jwt';

export async function POST(req: Request) {
  const body = await req.json();
  const result = v.safeParse(loginSchema, body);

  if (!result.success) {
    delete body.password;

    logger.info({ message: 'Invalid login request', meta: body });
    return NextResponse.json(
      { error: result.issues[0].message },
      { status: STATUS.BAD_REQUEST }
    );
  }

  logger.info({
    message: 'Fetching user from database',
    meta: {
      email: result.output.email,
    },
  });
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, result.output.email));

  if (!user) {
    logger.info({
      message: 'User not found',
      meta: {
        email: result.output.email,
      },
    });

    return NextResponse.json(
      { error: 'Invalid Credentials' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const passwordMatched = await bcrypt.compare(
    result.output.password,
    user.passwordHash
  );

  if (!passwordMatched) {
    logger.info({
      message: 'Invalid password',
      meta: {
        email: result.output.email,
      },
    });

    return NextResponse.json(
      { error: 'Invalid Credentials' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  logger.info({
    message: 'User logged in successfully',
    meta: {
      email: result.output.email,
    },
  });

  return NextResponse.json(
    {
      token: jwt.sign({ userId: user.id, role: user.role }),
    },
    { status: STATUS.OK }
  );
}
