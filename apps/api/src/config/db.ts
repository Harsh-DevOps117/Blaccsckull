import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB,
    maxPoolSize: 50,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 12000,
    autoIndex: env.NODE_ENV !== 'production',
  });
}
