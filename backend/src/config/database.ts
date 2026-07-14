import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

// Prefer public DNS resolvers — Windows/ISP SRV lookups for mongodb+srv can
// intermittently fail with querySrv ECONNREFUSED while A/AAAA records still work.
dns.setServers(['8.8.8.8', '1.1.1.1']);

mongoose.set('strictQuery', true);

export async function connectDB(): Promise<void> {
  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected', {
      host: mongoose.connection.host,
      db: mongoose.connection.name,
    });
  });
  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', { err: err.message });
  });
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  try {
    await mongoose.connect(env.MONGODB_URI, {
      // How many sockets the driver keeps open to Atlas
      maxPoolSize: 10,
      minPoolSize: 2,
      // How long to wait for a server to be found before throwing
      serverSelectionTimeoutMS: 5_000,
      // How long an idle socket stays open
      socketTimeoutMS: 45_000,
      // Reconnect automatically on transient network blips
      heartbeatFrequencyMS: 10_000,
    });
  } catch (err) {
    logger.error('Failed to connect to MongoDB', { err: (err as Error).message });
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected gracefully');
}
