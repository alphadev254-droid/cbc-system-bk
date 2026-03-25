import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaMariaDb({
  host:           process.env.DB_HOST     ?? 'localhost',
  port:           parseInt(process.env.DB_PORT ?? '3306', 10),
  user:           process.env.DB_USER     ?? 'root',
  password:       process.env.DB_PASSWORD ?? '',
  database:       process.env.DB_NAME     ?? '',
  connectTimeout: 5_000,
});

export const prisma = new PrismaClient({ adapter });
