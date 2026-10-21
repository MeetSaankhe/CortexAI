"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressionLimiter = void 0;
const concurrency_1 = require("./concurrency");
exports.compressionLimiter = new concurrency_1.ConcurrencyLimiter(Math.max(1, parseInt(process.env.MAX_CONCURRENT_COMPRESSION || '2', 10) || 2), Math.max(0, parseInt(process.env.MAX_QUEUE_COMPRESSION || '20', 10) || 20));
//# sourceMappingURL=limiters.js.map