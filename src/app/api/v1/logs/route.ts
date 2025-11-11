import { db } from '@/lib/db/client';
import { logs } from '@/lib/db/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  const result = db.select().from(logs).all();
  return NextResponse.json(result);
}
