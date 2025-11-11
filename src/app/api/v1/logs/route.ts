import { db } from '@/lib/db/client';
import { logs } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  if (req.headers.get('x-user-role') !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }
  const result = db.select().from(logs).all();
  return NextResponse.json(result);
}
