import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { createUserSchema } from '@/lib/validation/user-schemas';
import { aj } from '@/proxy';
import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';
import * as v from 'valibot';

// Patient can register themselves
export async function POST(req: Request) {
  const decision = await aj.protect(req, { requested: 7 });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      logger.info({
        message: 'Too Many Requests',
        meta: { reason: decision.reason },
      });
      return NextResponse.json({}, { status: STATUS.TOO_MANY_REQUESTS });
    } else if (decision.reason.isBot()) {
      logger.info({
        message: 'No bots allowed',
        meta: { reason: decision.reason },
      });
      return NextResponse.json(
        { error: 'No bots allowed' },
        { status: STATUS.FORBIDDEN }
      );
    } else {
      logger.info({
        message: 'Forbidden',
        meta: { reason: decision.reason },
      });
      return NextResponse.json({}, { status: STATUS.FORBIDDEN });
    }
  }

  const body = await req.json();

  const result = v.safeParse(createUserSchema, body);

  if (!result.success) {
    delete body.password;

    logger.info({ message: 'Invalid register request', meta: body });

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
      role: 'patient',
    })
    .run();

  logger.info({
    message: 'User created successfully',
    meta: {
      email: result.output.email,
    },
  });

  return NextResponse.json(
    { message: 'User Created' },
    { status: STATUS.CREATED }
  );
}
