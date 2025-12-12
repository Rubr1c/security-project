import { cookies } from 'next/headers';
import { generateCsrfToken, CSRF_COOKIE_NAME } from '@/lib/security/csrf';

const TOKEN_EXPIRY_SECONDS = 24 * 60 * 60; // 24 hours

async function ensureCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(CSRF_COOKIE_NAME);

  if (existingToken?.value) {
    return existingToken.value;
  }

  const token = generateCsrfToken();

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: TOKEN_EXPIRY_SECONDS,
  });

  return token;
}

export async function CsrfProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureCsrfToken();
  return <>{children}</>;
}
