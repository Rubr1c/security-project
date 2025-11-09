import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { loginSchema } from '@/lib/validation/user-schemas';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import * as v from 'valibot';

export async function POST(req: Request) {
  const body = await req.json();

  const result = v.safeParse(loginSchema, body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.issues[0].message },
      { status: STATUS.BAD_REQUEST }
    );
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, result.output.email));

  if (!user) {
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
    return NextResponse.json(
      { error: 'Invalid Credentials' },
      { status: STATUS.UNAUTHORIZED }
    );
  }
}
