"use strict";
/**
 * Request ID middleware.
 * Attaches a unique request ID to each request for tracing and correlation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = requestIdMiddleware;
const uuid_1 = require("uuid");
function requestIdMiddleware(req, res, next) {
    const incoming = req.headers['x-request-id'];
    const requestId = (typeof incoming === 'string' && incoming.length > 0)
        ? incoming
        : (0, uuid_1.v4)();
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
}
//# sourceMappingURL=requestId.js.map