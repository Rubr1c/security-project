import { NextResponse } from 'next/server';
import * as v from 'valibot';
import { resetPasswordSchema } from '@/lib/validation/auth-schemas';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { authService } from '@/services/auth-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = v.safeParse(resetPasswordSchema, body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: STATUS.BAD_REQUEST }
      );
    }

    const { token, password } = result.output;

    const serviceResult = await authService.resetPassword(token, password);

    logger.info({
      message: 'Password reset successful',
      meta: { userId: serviceResult.userId },
    });

    return NextResponse.json({
      message: 'Password reset successful',
    });
  } catch (error) {
    logger.error({
      message: 'Error processing password reset',
      error: error as Error,
    });
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: STATUS.INTERNAL_ERROR }
    );
  }
}
