import * as v from 'valibot';

const envSchema = v.object({
  JWT_SECRET: v.string(),
  ARCJET_KEY: v.string(),
});

export const env = v.parse(envSchema, process.env);
