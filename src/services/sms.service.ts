import AfricasTalking from 'africastalking';
import logger from '../config/logger';

const at = AfricasTalking({
  apiKey: process.env.AT_API_KEY as string,
  username: process.env.AT_USERNAME as string,
});

const sms = at.SMS;

export const sendSMS = async (phone: string, message: string): Promise<void> => {
  try {
    await sms.send({ to: [phone], message, from: process.env.AT_SENDER_ID });
    logger.info(`SMS sent to ${phone}`);
  } catch (err) {
    logger.error('SMS send failed:', err);
    throw err;
  }
};

export const bulkSMS = async (phones: string[], message: string): Promise<void> => {
  try {
    await sms.send({ to: phones, message, from: process.env.AT_SENDER_ID });
    logger.info(`Bulk SMS sent to ${phones.length} recipients`);
  } catch (err) {
    logger.error('Bulk SMS failed:', err);
    throw err;
  }
};
