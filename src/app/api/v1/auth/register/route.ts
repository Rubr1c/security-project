import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { createUserSchema } from '@/lib/validation/user-schemas';
import { aj } from '@/proxy';
import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';
import * as v from 'valibot';

export async function POST(req: Request) {
  const decision = await aj.protect(req, { requested: 7 });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json(
        { error: 'Too Many Requests', reason: decision.reason },

        { status: STATUS.TOO_MANY_REQUESTS }
      );
    } else if (decision.reason.isBot()) {
      return NextResponse.json(
        { error: 'No bots allowed', reason: decision.reason },

        { status: STATUS.FORBIDDEN }
      );
    } else {
      return NextResponse.json(
        { error: 'Forbidden', reason: decision.reason },

        { status: STATUS.FORBIDDEN }
      );
    }
  }

  const body = await req.json();

  const result = v.safeParse(createUserSchema, body);

  if (!result.success) {
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

  return NextResponse.json(
    { message: 'User Created' },
    { status: STATUS.CREATED }
  );
}
