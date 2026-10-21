"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const { combine, timestamp, printf, colorize } = winston_1.default.format;
const logFormat = printf(({ level, message, timestamp: ts }) => {
    return `${ts} [${level}]: ${message}`;
});
const isVercel = Boolean(process.env.VERCEL);
exports.logger = winston_1.default.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
    transports: isVercel
        ? [
            new winston_1.default.transports.Console({
                format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
            }),
        ]
        : [
            new winston_1.default.transports.Console({
                format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
            }),
            new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
            new winston_1.default.transports.File({ filename: 'logs/combined.log' }),
        ],
});
//# sourceMappingURL=logger.js.map