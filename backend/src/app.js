require('dotenv').config();
const app = require('./config/express');
const logger = require('./config/logger');
const { checkDbConnection } = require('./config/database');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await checkDbConnection();
    app.listen(PORT, () => {
      logger.info({ port: PORT, env: process.env.NODE_ENV }, 'FitTrack API started');
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

start();
