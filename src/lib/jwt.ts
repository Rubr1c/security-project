import { JWTPayload, SignJWT, jwtVerify } from 'jose';
import { UserRole } from './db/types';

export interface JwtPayload extends JWTPayload {
  userId: number;
  role: UserRole;
}

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set');
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export const jwt = {
  sign: async <T extends JWTPayload>(payload: T, exp = '1h'): Promise<string> =>
    new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(exp)
      .setNotBefore('2s')
      .sign(secret),

  verify: async <T extends JWTPayload>(token: string): Promise<T | null> => {
    try {
      const { payload } = await jwtVerify<T>(token, secret);
      return payload;
    } catch {
      return null;
    }
  },
};
