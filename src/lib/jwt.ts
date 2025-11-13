import { JWTPayload, SignJWT, jwtVerify } from 'jose';
import { UserRole } from './db/types';
import { env } from './env';

export interface JwtPayload extends JWTPayload {
  userId: number;
  role: UserRole;
}

const secret = new TextEncoder().encode(env.JWT_SECRET);

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
