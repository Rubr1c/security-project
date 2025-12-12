import nodemailer from 'nodemailer';
import { env } from '@/lib/env';

export const mailer = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_APP_PASSWORD,
  },
});


