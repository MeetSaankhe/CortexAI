export declare const CONCURRENCY_QUEUE_FULL = "CONCURRENCY_QUEUE_FULL";
export declare class ConcurrencyLimiter {
    private readonly maxActive;
    private readonly maxQueue;
    private active;
    private queue;
    constructor(maxActive: number, maxQueue?: number);
    run<T>(fn: () => Promise<T>): Promise<T>;
    stats(): {
        active: number;
        queued: number;
        maxActive: number;
        maxQueue: number;
    };
    private drain;
}
//# sourceMappingURL=concurrency.d.ts.map