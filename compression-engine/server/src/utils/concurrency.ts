export const CONCURRENCY_QUEUE_FULL = 'CONCURRENCY_QUEUE_FULL';

export class ConcurrencyLimiter {
  private active = 0;
  private queue: Array<{
    fn: () => Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor(
    private readonly maxActive: number,
    private readonly maxQueue: number = Number.POSITIVE_INFINITY
  ) {}

  run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active < this.maxActive) {
      this.active += 1;
      return fn().finally(() => {
        this.active -= 1;
        this.drain();
      });
    }

    if (this.queue.length >= this.maxQueue) {
      return Promise.reject(new Error(CONCURRENCY_QUEUE_FULL));
    }

    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn,
        resolve: resolve as unknown as (value: unknown) => void,
        reject,
      });
    });
  }

  stats() {
    return { active: this.active, queued: this.queue.length, maxActive: this.maxActive, maxQueue: this.maxQueue };
  }

  private drain() {
    if (this.active >= this.maxActive) return;
    const item = this.queue.shift();
    if (!item) return;

    this.active += 1;
    item.fn()
      .then(item.resolve, item.reject)
      .finally(() => {
        this.active -= 1;
        this.drain();
      });
  }
}
