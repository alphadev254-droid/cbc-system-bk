// @ts-nocheck
import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import logger from '../config/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const loadTemplate = (templateName: string): HandlebarsTemplateDelegate => {
  const filePath = path.join(__dirname, '../templates/emails', `${templateName}.hbs`);
  const source = fs.readFileSync(filePath, 'utf8');
  return Handlebars.compile(source);
};

export const sendEmail = async (
  to: string,
  templateName: string,
  data: Record<string, unknown>,
  subject: string
): Promise<void> => {
  try {
    const template = loadTemplate(templateName);
    const html = template(data);
    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to} [${templateName}]`);
  } catch (err) {
    logger.error('Email send failed:', err);
    throw err;
  }
};
