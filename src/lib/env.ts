import * as v from 'valibot';

const envSchema = v.object({
  JWT_SECRET: v.string(),
  ARCJET_KEY: v.string(),
  GMAIL_USER: v.string(),
  GMAIL_APP_PASSWORD: v.string(),
});

export const env = v.parse(envSchema, process.env);
