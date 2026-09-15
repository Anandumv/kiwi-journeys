import type { Resend } from 'resend';

/** Resend reports rejected deliveries as {error}, not necessarily a rejection. */
export async function sendEmail(resend: Resend, message: Parameters<Resend['emails']['send']>[0]) {
  const result = await resend.emails.send(message);
  if (result.error) throw new Error(`Email delivery rejected: ${result.error.name}`);
  return result.data;
}
