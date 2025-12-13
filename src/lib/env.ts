import * as v from 'valibot';

const envSchema = v.object({
  NODE_ENV: v.optional(
    v.picklist(['development', 'production', 'test']),
    'development'
  ),
  JWT_SECRET: v.pipe(
    v.string(),
    v.length(32, 'JWT_SECRET must be 32 characters')
  ),
  ARCJET_KEY: v.string(),
  GMAIL_USER: v.string(),
  GMAIL_APP_PASSWORD: v.string(),
  APP_URL: v.string(),
  HASH_PEPPER: v.string(),
  ENCRYPTION_KEY: v.pipe(
    v.string(),
    v.length(64, 'ENCRYPTION_KEY must be 64 hex characters')
  ),
});

export const env = v.parse(envSchema, process.env);
