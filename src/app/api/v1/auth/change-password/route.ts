import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { getSession } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';
import * as v from 'valibot';
import { eq } from 'drizzle-orm';
import { authService, ServiceError } from '@/services/auth-service';

export async function PUT(req: Request) {
  const session = await getSession();

  if (!session) {
    logger.info({
      message: 'Unauthorized: No valid session',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const { userId, role: userRole } = session;

  const body = await req.json();
  
  const verifySchema = v.object({
    code: v.pipe(v.string(), v.regex(/^\d{6}$/, 'Code must be 6 digits')),
  });

  const verifyParsed = v.safeParse(verifySchema, body);
  
  try {
      if (verifyParsed.success) {
          await authService.changePassword(Number(userId), { 
              type: 'verify', 
              code: verifyParsed.output.code 
          });
          
          logger.info({
              message: 'Password changed (OTP verified)',
              meta: { userId, role: userRole },
          });

          return NextResponse.json(
              { message: 'Password changed successfully' },
              { status: STATUS.OK }
          );
      }

      // If not verify, try request schema
      const requestParamsSchema = v.object({
        oldPassword: v.pipe(v.string(), v.minLength(1, 'Old password is required')),
        newPassword: v.pipe(
          v.string(),
          v.minLength(8, 'Password must be at least 8 characters'),
          v.regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
          )
        ),
      });

      const requestParsed = v.safeParse(requestParamsSchema, body);
      
      if (!requestParsed.success) {
         logger.info({ message: 'Invalid change password request', meta: { userId } });
         return NextResponse.json(
             { error: requestParsed.issues[0].message },
             { status: STATUS.BAD_REQUEST }
         );
      }

      const result = await authService.changePassword(Number(userId), {
          type: 'request',
          oldPassword: requestParsed.output.oldPassword,
          newPassword: requestParsed.output.newPassword
      });

      if (result && 'otpRequired' in result) {
          logger.info({
            message: 'Change password OTP sent',
            meta: { userId, role: userRole },
          });

          return NextResponse.json(
            { otpRequired: true, email: result.email },
            { status: STATUS.OK }
          );
      }
      
      return NextResponse.json({ success: true }, { status: STATUS.OK });

  } catch (error) {
      if (error instanceof ServiceError) {
          return NextResponse.json({ error: error.message }, { status: error.status });
      }
      logger.error({ message: 'Change password error', error: error as Error });
      return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
