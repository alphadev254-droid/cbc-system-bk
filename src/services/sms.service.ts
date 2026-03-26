// @ts-nocheck
import logger from '../config/logger';

export type SchoolAdminSmsPayload = {
  schoolName: string;
  adminEmail: string;
  tempPassword: string;
  loginUrl: string;
};

async function postTextSms(to: string, message: string): Promise<void> {
  const apiUrl = process.env.TEXTSMS_API_URL ?? 'https://sms.textsms.co.ke/api/services/sendsms/';
  const apiKey = process.env.TEXTSMS_API_KEY;
  const partnerId = process.env.TEXTSMS_PARTNER_ID;

  const mobile = to.replace(/\s/g, '');

  // TextSMS (sms.textsms.co.ke) uses partnerID + apikey in the body
  const body: Record<string, unknown> = partnerId
    ? {
        apikey: apiKey,
        partnerID: partnerId,
        message,
        shortcode: process.env.TEXTSMS_SENDER_ID ?? 'TextSMS',
        mobile,
      }
    : {
        to: mobile,
        message,
        sender: process.env.TEXTSMS_SENDER_ID,
      };

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!partnerId && apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const res = await fetch(apiUrl, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    logger.error(`[SMS] Provider error ${res.status}: ${text}`);
    throw new Error(`SMS provider error (${res.status})`);
  }
}

/** Generic SMS — used by notifications when channel is SMS */
export async function sendSMS(to: string, message: string): Promise<void> {
  const enabled = process.env.TEXTSMS_ENABLED === 'true' || Boolean(process.env.TEXTSMS_API_URL) || Boolean(process.env.TEXTSMS_PARTNER_ID);
  if (!enabled) {
    logger.warn(`[SMS] skipped (SMS not enabled): ${to}`);
    return;
  }
  await postTextSms(to, message);
  logger.info(`[SMS] sent to ${to}`);
}

export async function bulkSMS(phones: string[], message: string): Promise<void> {
  for (const p of phones) {
    await sendSMS(p, message);
  }
}

/**
 * School admin welcome SMS — same provider as `sendSMS` when TEXTSMS_ENABLED=true.
 */
export async function sendSchoolAdminCredentialsSms(
  phoneE164OrLocal: string,
  payload: SchoolAdminSmsPayload
): Promise<{ ok: boolean; skipped?: boolean }> {
  const enabled = process.env.TEXTSMS_ENABLED === 'true' || Boolean(process.env.TEXTSMS_API_URL) || Boolean(process.env.TEXTSMS_PARTNER_ID);
  if (!enabled) {
    logger.warn(
      `[SMS] TEXTSMS_ENABLED is not true — credentials not sent via SMS (phone ${phoneE164OrLocal})`
    );
    return { ok: true, skipped: true };
  }

  const apiUrl = process.env.TEXTSMS_API_URL ?? 'https://sms.textsms.co.ke/api/services/sendsms/';
  if (!apiUrl) {
    logger.error('[SMS] TEXTSMS_API_URL is missing');
    throw new Error('SMS is enabled but TEXTSMS_API_URL is not configured');
  }

  const message =
    process.env.TEXTSMS_MESSAGE_TEMPLATE?.replace(/\{school\}/g, payload.schoolName)
      .replace(/\{email\}/g, payload.adminEmail)
      .replace(/\{password\}/g, payload.tempPassword)
      .replace(/\{url\}/g, payload.loginUrl) ??
    `CBC Platform: Your school "${payload.schoolName}" is ready. Sign in: ${payload.loginUrl} Email: ${payload.adminEmail} Temporary password: ${payload.tempPassword} Please change your password after login.`;

  await postTextSms(phoneE164OrLocal, message);
  logger.info(`[SMS] Credentials SMS sent to ${phoneE164OrLocal}`);
  return { ok: true };
}
