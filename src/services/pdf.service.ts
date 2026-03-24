import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

export const generatePDF = async (
  templateName: string,
  data: Record<string, unknown>
): Promise<Buffer> => {
  const filePath = path.join(__dirname, '../templates/pdf', `${templateName}.hbs`);
  const source = fs.readFileSync(filePath, 'utf8');
  const template = Handlebars.compile(source);
  const html = template(data);

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  return Buffer.from(pdf);
};
