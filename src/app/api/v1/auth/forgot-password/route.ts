import { NextResponse } from 'next/server';
import { sendPasswordResetEmail } from '@/lib/email/mailer';
import * as v from 'valibot';
import { forgotPasswordSchema } from '@/lib/validation/auth-schemas';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { authService, ServiceError } from '@/services/auth-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = v.safeParse(forgotPasswordSchema, body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: STATUS.BAD_REQUEST }
      );
    }

    const { email } = result.output;
    
    // Always return success message to prevent enumeration, even if service returns undefined
    const serviceResult = await authService.forgotPassword(email);

    if (serviceResult) {
        logger.info({
          message: 'Password reset link sent',
          meta: { userId: serviceResult.userId },
        });
    } else {
        logger.info({
          message: 'Password reset requested for non-existent email',
          meta: { email },
        });
    }

    return NextResponse.json({
      message: 'If an account exists, a reset link has been sent.',
    });
  } catch (error) {
    if (error instanceof ServiceError) {
        // Should usually be silent for this route but let's follow pattern
        logger.error({ message: 'Forgot password service error', error: error as Error });
    } else {
        logger.error({
          message: 'Error processing forgot password request',
          error: error as Error,
        });
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: STATUS.INTERNAL_ERROR }
    );
  }
}
