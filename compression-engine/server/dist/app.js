"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = require("./middleware/errorHandler");
const requestId_1 = require("./middleware/requestId");
const requestLogger_1 = require("./middleware/requestLogger");
const auth_routes_1 = require("./routes/auth.routes");
const compression_routes_1 = require("./routes/compression.routes");
const document_routes_1 = require("./routes/document.routes");
const analytics_routes_1 = require("./routes/analytics.routes");
const settings_routes_1 = require("./routes/settings.routes");
const playground_routes_1 = require("./routes/playground.routes");
const llm_routes_1 = require("./routes/llm.routes");
dotenv_1.default.config();
const app = (0, express_1.default)();
const normalizeOrigin = (value) => value.replace(/\/$/, '').toLowerCase();
const allowedCorsOrigins = (() => {
    const raw = process.env.CORS_ORIGIN;
    const fallbacks = [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:3001',
        'https://cortex-ai-xi.vercel.app',
        'https://cortexai.vercel.app',
    ];
    if (!raw)
        return fallbacks.map(normalizeOrigin);
    const parts = raw.split(',').map((v) => v.trim()).filter(Boolean).map(normalizeOrigin);
    return Array.from(new Set([...parts, ...fallbacks.map(normalizeOrigin)]));
})();
const isAllowedOrigin = (origin) => {
    if (process.env.CORS_ORIGIN === '*')
        return true;
    const normalized = normalizeOrigin(origin);
    if (allowedCorsOrigins.includes(normalized))
        return true;
    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin))
        return true;
    if (/^http:\/\/(localhost|127\.0\.0\.1):[0-9]+$/i.test(origin))
        return true;
    return false;
};
const apiBasePath = (() => {
    const raw = process.env.API_BASE_PATH?.trim();
    if (raw != null) {
        if (!raw || raw === '/')
            return '';
        const cleaned = raw.replace(/\/$/, '');
        return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
    }
    return process.env.VERCEL ? '' : '/api';
})();
const withApiBase = (path) => `${apiBasePath}${path}`;
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use((0, helmet_1.default)());
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || isAllowedOrigin(origin)) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true,
    exposedHeaders: ['X-Request-ID'],
};
app.use((0, cors_1.default)(corsOptions));
app.options('*', (0, cors_1.default)(corsOptions));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use((0, cookie_parser_1.default)());
app.use(requestId_1.requestIdMiddleware);
app.use(requestLogger_1.requestLoggerMiddleware);
app.use(limiter);
app.use(withApiBase('/auth'), auth_routes_1.authRouter);
app.use(withApiBase('/compression'), compression_routes_1.compressionRouter);
app.use(withApiBase('/documents'), document_routes_1.documentRouter);
app.use(withApiBase('/analytics'), analytics_routes_1.analyticsRouter);
app.use(withApiBase('/settings'), settings_routes_1.settingsRouter);
app.use(withApiBase('/playground'), playground_routes_1.playgroundRouter);
app.use(withApiBase('/llm'), llm_routes_1.llmRouter);
app.get(withApiBase('/health'), (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map