"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
const logger_1 = require("../utils/logger");
class AppError extends Error {
    statusCode;
    errorCode;
    isOperational;
    constructor(message, statusCode, errorCode) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode || AppError.codeForStatus(statusCode);
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
    static codeForStatus(status) {
        if (status === 400)
            return 'validation_error';
        if (status === 401)
            return 'unauthorized';
        if (status === 403)
            return 'forbidden';
        if (status === 404)
            return 'not_found';
        if (status === 409)
            return 'conflict';
        if (status === 429)
            return 'rate_limit_exceeded';
        return 'internal_error';
    }
}
exports.AppError = AppError;
function errorHandler(err, req, res, _next) {
    const statusCode = err.statusCode || 500;
    const errorCode = err.errorCode || 'internal_error';
    const message = err.message || 'Internal Server Error';
    const requestId = req.requestId || '-';
    const timestamp = new Date().toISOString();
    logger_1.logger.error(`[${requestId}] ${statusCode} ${errorCode} - ${message}\n${err.stack || ''}`);
    res.status(statusCode).json({
        success: false,
        error: {
            status: statusCode,
            code: errorCode,
            message,
            timestamp,
            requestId,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
}
//# sourceMappingURL=errorHandler.js.map