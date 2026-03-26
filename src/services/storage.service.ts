// @ts-nocheck
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export const getFileUrl = (filename: string): string =>
  `${process.env.APP_URL}/uploads/${filename}`;

export const deleteFile = (filename: string): void => {
  const filePath = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

export const uploadFile = (file: Express.Multer.File): string => {
  // File is already saved by multer; return the URL
  return getFileUrl(file.filename);
};
