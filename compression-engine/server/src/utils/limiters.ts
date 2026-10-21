import { ConcurrencyLimiter } from './concurrency';

export const compressionLimiter = new ConcurrencyLimiter(
  Math.max(1, parseInt(process.env.MAX_CONCURRENT_COMPRESSION || '2', 10) || 2),
  Math.max(0, parseInt(process.env.MAX_QUEUE_COMPRESSION || '20', 10) || 20)
);

