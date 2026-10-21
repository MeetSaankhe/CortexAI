"use strict";
/**
 * Request logging middleware.
 * Logs each API request with method, path, status, duration, and request ID.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLoggerMiddleware = requestLoggerMiddleware;
const logger_1 = require("../utils/logger");
function requestLoggerMiddleware(req, res, next) {
    const start = Date.now();
    const { method, originalUrl } = req;
    const requestId = req.requestId || '-';
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { statusCode } = res;
        const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
        logger_1.logger.log(level, `[${requestId}] ${method} ${originalUrl} ${statusCode} ${duration}ms`);
    });
    next();
}
//# sourceMappingURL=requestLogger.js.map