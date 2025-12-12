import * as v from 'valibot';

const envSchema = v.object({
  NODE_ENV: v.optional(v.picklist(['development', 'production', 'test']), 'development'),
  JWT_SECRET: v.string(),
  ARCJET_KEY: v.string(),
  GMAIL_USER: v.string(),
  GMAIL_APP_PASSWORD: v.string(),
  APP_URL: v.string(),
});

export const env = v.parse(envSchema, process.env);
