import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'C:/Users/aliza/Programming/JS/security-project/security-project/db.sqlite',
  },
} satisfies Config;
