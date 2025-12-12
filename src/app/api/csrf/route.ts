import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function GET() {
  const token = randomBytes(32).toString('hex');

  const response = NextResponse.json({ csrfToken: token });
  response.cookies.set('csrf-token', token, {
    path: '/',
    sameSite: 'strict',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
