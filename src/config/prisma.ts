// src/config/prisma.ts
import "dotenv/config";     // 👈 must come first
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export const prisma = new PrismaClient(); // no options needed in Prisma 7