import { config } from '../config.js';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function send(options: EmailOptions): Promise<void> {
  if (config.nodeEnv !== "production") {
    console.info(`[Email Service] To: ${options.to} | Subject: ${options.subject}\n${options.html}`);
    return;
  }
  console.warn(
    `[Email Service] Email delivery not configured. Would send to ${options.to} with subject "${options.subject}".`
  );
}
