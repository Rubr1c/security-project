import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

const TEST_PASSWORD = 'Test123!';

const testAccounts = [
  {
    email: 'admin@hospital.com',
    name: 'Admin User',
    role: 'admin' as const,
  },
  {
    email: 'doctor@hospital.com',
    name: 'Dr. Sarah Johnson',
    role: 'doctor' as const,
  },
  {
    email: 'doctor2@hospital.com',
    name: 'Dr. Michael Chen',
    role: 'doctor' as const,
  },
  {
    email: 'nurse@hospital.com',
    name: 'Nurse Emily Davis',
    role: 'nurse' as const,
  },
  {
    email: 'nurse2@hospital.com',
    name: 'Nurse James Wilson',
    role: 'nurse' as const,
  },
  {
    email: 'patient@hospital.com',
    name: 'Patient John Doe',
    role: 'patient' as const,
  },
  {
    email: 'patient2@hospital.com',
    name: 'Patient Jane Smith',
    role: 'patient' as const,
  },
];

export async function POST() {
  try {
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    const results: Array<{ email: string; status: string }> = [];

    for (const account of testAccounts) {
      const existing = db
        .select()
        .from(users)
        .where(eq(users.email, account.email))
        .all();

      if (existing.length > 0) {
        results.push({ email: account.email, status: 'skipped (already exists)' });
        continue;
      }

      db.insert(users)
        .values({
          email: account.email,
          name: account.name,
          passwordHash,
          role: account.role,
        })
        .run();

      results.push({ email: account.email, status: 'created' });
    }

    logger.info({
      message: 'Test accounts seeded',
      meta: { count: results.length },
    });

    return NextResponse.json({
      message: 'Test accounts seeded successfully',
      password: TEST_PASSWORD,
      accounts: testAccounts.map((acc) => ({
        email: acc.email,
        name: acc.name,
        role: acc.role,
      })),
      results,
    });
  } catch (error) {
    logger.error({
      message: 'Failed to seed test accounts',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to seed test accounts' },
      { status: STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

