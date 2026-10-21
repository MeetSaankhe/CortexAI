"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../utils/prisma");
const errorHandler_1 = require("./errorHandler");
const crypto_1 = require("../utils/crypto");
const jwt_1 = require("../utils/jwt");
async function authenticate(req, _res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (!token)
            throw new errorHandler_1.AppError('Authentication required', 401);
        // 1) Verify the JWT signature and expiry
        const decoded = jsonwebtoken_1.default.verify(token, jwt_1.JWT_SECRET);
        // 2) Confirm the session still exists and is not revoked
        //    (allows admin-triggered mass logout by revoking all sessions)
        const session = await prisma_1.prisma.session.findFirst({
            where: {
                tokenHash: (0, crypto_1.sha256)(token),
                userId: decoded.userId,
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
        });
        if (!session)
            throw new errorHandler_1.AppError('Session revoked or expired', 401);
        // 3) Load the user (also verifies the account still exists and is active)
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, name: true, role: true, isActive: true },
        });
        if (!user)
            throw new errorHandler_1.AppError('User not found', 401);
        if (!user.isActive)
            throw new errorHandler_1.AppError('Account is disabled', 403);
        req.userId = user.id;
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        };
        next();
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError) {
            next(error);
        }
        else {
            next(new errorHandler_1.AppError('Invalid token', 401));
        }
    }
}
//# sourceMappingURL=auth.js.map