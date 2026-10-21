"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConcurrencyLimiter = exports.CONCURRENCY_QUEUE_FULL = void 0;
exports.CONCURRENCY_QUEUE_FULL = 'CONCURRENCY_QUEUE_FULL';
class ConcurrencyLimiter {
    maxActive;
    maxQueue;
    active = 0;
    queue = [];
    constructor(maxActive, maxQueue = Number.POSITIVE_INFINITY) {
        this.maxActive = maxActive;
        this.maxQueue = maxQueue;
    }
    run(fn) {
        if (this.active < this.maxActive) {
            this.active += 1;
            return fn().finally(() => {
                this.active -= 1;
                this.drain();
            });
        }
        if (this.queue.length >= this.maxQueue) {
            return Promise.reject(new Error(exports.CONCURRENCY_QUEUE_FULL));
        }
        return new Promise((resolve, reject) => {
            this.queue.push({
                fn,
                resolve: resolve,
                reject,
            });
        });
    }
    stats() {
        return { active: this.active, queued: this.queue.length, maxActive: this.maxActive, maxQueue: this.maxQueue };
    }
    drain() {
        if (this.active >= this.maxActive)
            return;
        const item = this.queue.shift();
        if (!item)
            return;
        this.active += 1;
        item.fn()
            .then(item.resolve, item.reject)
            .finally(() => {
            this.active -= 1;
            this.drain();
        });
    }
}
exports.ConcurrencyLimiter = ConcurrencyLimiter;
//# sourceMappingURL=concurrency.js.map