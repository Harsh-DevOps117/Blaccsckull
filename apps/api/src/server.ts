import mongoose from 'mongoose';
import { app } from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';

try {
  await connectDatabase();
  const server = app.listen(env.PORT, '0.0.0.0', () =>
    console.log(`Feedants API listening on port ${env.PORT}`),
  );
  const shutdown = () => {
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
} catch (error) {
  console.error(
    'Unable to start API. Check MongoDB connectivity and environment configuration.',
    (error as Error).name,
  );
  process.exit(1);
}
