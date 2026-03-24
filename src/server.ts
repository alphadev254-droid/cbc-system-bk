import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { sequelize } from './config/database';
import logger from './config/logger';

const PORT = process.env.PORT || 5000;

async function startServer(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established.');

    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database synced.');
    }

    app.listen(PORT, () => {
      logger.info(`CBC Platform API running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
