"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_1 = require("../utils/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const activity_log_service_1 = require("../services/activity-log.service");
const rbac_1 = require("../middleware/rbac");
const crypto_1 = require("../utils/crypto");
const uuid_1 = require("uuid");
const jwt_1 = require("../utils/jwt");
exports.authRouter = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase(),
    password: zod_1.z.string().min(8),
    name: zod_1.z.string().min(2).max(100),
    role: zod_1.z.enum(['admin', 'developer', 'researcher', 'guest']).optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase(),
    password: zod_1.z.string(),
});
function generateTokens(userId) {
    const accessToken = jsonwebtoken_1.default.sign({ userId }, jwt_1.JWT_SECRET, { expiresIn: '24h' });
    const refreshToken = jsonwebtoken_1.default.sign({ userId, type: 'refresh' }, jwt_1.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
}
/**
 * Persist a session — we store SHA-256 hashes of the tokens, never the raw JWT.
 * That way, if the DB is compromised, an attacker can't replay tokens.
 */
async function persistSession(userId, accessToken, refreshToken, req) {
    await prisma_1.prisma.session.create({
        data: {
            id: (0, uuid_1.v4)(),
            userId,
            tokenHash: (0, crypto_1.sha256)(accessToken),
            refreshHash: (0, crypto_1.sha256)(refreshToken),
            ipAddress: req.ip?.slice(0, 45),
            userAgent: (req.headers['user-agent'] || '').slice(0, 500),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });
}
exports.authRouter.post('/register', async (req, res, next) => {
    try {
        const data = registerSchema.parse(req.body);
        const existing = await prisma_1.prisma.user.findUnique({ where: { email: data.email } });
        if (existing)
            throw new errorHandler_1.AppError('Email already registered', 409);
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 12);
        // Default to 'developer'. Admin role is never self-assigned — must be set manually via DB.
        const requestedRole = data.role && data.role !== 'admin' ? data.role : 'developer';
        const role = (0, rbac_1.isRoleValid)(requestedRole) ? requestedRole : 'developer';
        const user = await prisma_1.prisma.user.create({
            data: {
                id: (0, uuid_1.v4)(),
                email: data.email,
                password: hashedPassword,
                name: data.name,
                role: role,
            },
            select: { id: true, email: true, name: true, role: true, createdAt: true },
        });
        activity_log_service_1.ActivityLogService.log({
            userId: user.id,
            action: 'auth.register',
            resource: 'user',
            resourceId: user.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });
        const { accessToken, refreshToken } = generateTokens(user.id);
        await persistSession(user.id, accessToken, refreshToken, req);
        res.status(201).json({
            success: true,
            data: { user, accessToken, refreshToken },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            next(new errorHandler_1.AppError(error.errors[0].message, 400));
        }
        else {
            next(error);
        }
    }
});
exports.authRouter.post('/login', async (req, res, next) => {
    try {
        const data = loginSchema.parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({ where: { email: data.email } });
        if (!user)
            throw new errorHandler_1.AppError('Invalid credentials', 401);
        // Account lockout after too many failures
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new errorHandler_1.AppError('Account is temporarily locked. Try again later.', 429);
        }
        const validPassword = await bcryptjs_1.default.compare(data.password, user.password);
        if (!validPassword) {
            // Increment failed attempts and lock after 5
            const failedCount = user.failedLoginCount + 1;
            await prisma_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginCount: failedCount,
                    lockedUntil: failedCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
                },
            });
            throw new errorHandler_1.AppError('Invalid credentials', 401);
        }
        if (!user.isActive)
            throw new errorHandler_1.AppError('Account is disabled', 403);
        // Success — reset counters, record last login
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                lastLoginAt: new Date(),
                lastLoginIp: req.ip?.slice(0, 45),
                failedLoginCount: 0,
                lockedUntil: null,
            },
        });
        const { accessToken, refreshToken } = generateTokens(user.id);
        await persistSession(user.id, accessToken, refreshToken, req);
        activity_log_service_1.ActivityLogService.log({
            userId: user.id,
            action: 'auth.login',
            resource: 'user',
            resourceId: user.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });
        res.json({
            success: true,
            data: {
                user: { id: user.id, email: user.email, name: user.name, role: user.role },
                accessToken,
                refreshToken,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            next(new errorHandler_1.AppError(error.errors[0].message, 400));
        }
        else {
            next(error);
        }
    }
});
exports.authRouter.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            throw new errorHandler_1.AppError('Refresh token required', 400);
        const decoded = jsonwebtoken_1.default.verify(refreshToken, jwt_1.JWT_REFRESH_SECRET);
        const session = await prisma_1.prisma.session.findFirst({
            where: {
                refreshHash: (0, crypto_1.sha256)(refreshToken),
                userId: decoded.userId,
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
        });
        if (!session)
            throw new errorHandler_1.AppError('Invalid or expired refresh token', 401);
        const tokens = generateTokens(decoded.userId);
        // Rotate — revoke the old, create a new session
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.session.update({
                where: { id: session.id },
                data: { revokedAt: new Date() },
            }),
            prisma_1.prisma.session.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    userId: decoded.userId,
                    tokenHash: (0, crypto_1.sha256)(tokens.accessToken),
                    refreshHash: (0, crypto_1.sha256)(tokens.refreshToken),
                    ipAddress: req.ip?.slice(0, 45),
                    userAgent: (req.headers['user-agent'] || '').slice(0, 500),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            }),
        ]);
        res.json({ success: true, data: tokens });
    }
    catch (error) {
        next(error instanceof errorHandler_1.AppError ? error : new errorHandler_1.AppError('Invalid refresh token', 401));
    }
});
exports.authRouter.post('/logout', auth_1.authenticate, async (req, res, next) => {
    try {
        const token = req.headers.authorization?.slice(7);
        if (token) {
            await prisma_1.prisma.session.updateMany({
                where: { tokenHash: (0, crypto_1.sha256)(token) },
                data: { revokedAt: new Date() },
            });
        }
        if (req.userId) {
            activity_log_service_1.ActivityLogService.log({
                userId: req.userId,
                action: 'auth.logout',
                resource: 'user',
                resourceId: req.userId,
                ipAddress: req.ip,
            });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    }
    catch (error) {
        next(error);
    }
});
exports.authRouter.get('/me', auth_1.authenticate, async (req, res, next) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true, email: true, name: true, avatar: true, role: true,
                theme: true, language: true, preferredLlm: true, defaultCompression: true,
                isActive: true, emailVerified: true, lastLoginAt: true, createdAt: true,
            },
        });
        if (!user)
            throw new errorHandler_1.AppError('User not found', 404);
        res.json({ success: true, data: user });
    }
    catch (error) {
        next(error);
    }
});
exports.authRouter.get('/profile', auth_1.authenticate, async (req, res, next) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true, email: true, name: true, avatar: true, role: true,
                theme: true, language: true, preferredLlm: true, defaultCompression: true,
                isActive: true, emailVerified: true, lastLoginAt: true, createdAt: true,
            },
        });
        if (!user)
            throw new errorHandler_1.AppError('User not found', 404);
        res.json({ success: true, data: user });
    }
    catch (error) {
        next(error);
    }
});
exports.authRouter.put('/profile', auth_1.authenticate, async (req, res, next) => {
    try {
        const { name, avatar } = req.body;
        const user = await prisma_1.prisma.user.update({
            where: { id: req.userId },
            data: {
                ...(name !== undefined && { name }),
                ...(avatar !== undefined && { avatar }),
            },
            select: { id: true, email: true, name: true, avatar: true, role: true },
        });
        res.json({ success: true, data: user });
    }
    catch (error) {
        next(error);
    }
});
exports.authRouter.put('/change-password', auth_1.authenticate, async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            throw new errorHandler_1.AppError('Current and new password required', 400);
        }
        if (newPassword.length < 8) {
            throw new errorHandler_1.AppError('Password must be at least 8 characters', 400);
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id: req.userId } });
        if (!user)
            throw new errorHandler_1.AppError('User not found', 404);
        const valid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!valid)
            throw new errorHandler_1.AppError('Current password is incorrect', 401);
        const hashed = await bcryptjs_1.default.hash(newPassword, 12);
        // Invalidate ALL other sessions when password changes (security best practice)
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.user.update({ where: { id: req.userId }, data: { password: hashed } }),
            prisma_1.prisma.session.updateMany({
                where: { userId: req.userId, revokedAt: null },
                data: { revokedAt: new Date() },
            }),
        ]);
        activity_log_service_1.ActivityLogService.log({
            userId: req.userId,
            action: 'auth.password_changed',
            ipAddress: req.ip,
        });
        res.json({ success: true, message: 'Password changed successfully' });
    }
    catch (error) {
        next(error);
    }
});
exports.authRouter.post('/forgot-password', async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email)
            throw new errorHandler_1.AppError('Email required', 400);
        const user = await prisma_1.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        // Always return the same response so we don't leak which emails exist
        if (!user) {
            return res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
        }
        const resetToken = jsonwebtoken_1.default.sign({ userId: user.id, type: 'reset' }, jwt_1.JWT_SECRET, { expiresIn: '1h' });
        // Store only the HASH — the raw token goes to the user via email
        await prisma_1.prisma.passwordReset.create({
            data: {
                id: (0, uuid_1.v4)(),
                userId: user.id,
                tokenHash: (0, crypto_1.sha256)(resetToken),
                expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            },
        });
        // In production, send `resetToken` via email. For dev, return it.
        const isProd = process.env.NODE_ENV === 'production';
        res.json({
            success: true,
            message: 'Reset link sent to email',
            ...(isProd ? {} : { resetToken }),
        });
    }
    catch (error) {
        next(error);
    }
});
exports.authRouter.post('/reset-password', async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword)
            throw new errorHandler_1.AppError('Token and new password required', 400);
        if (newPassword.length < 8)
            throw new errorHandler_1.AppError('Password must be at least 8 characters', 400);
        const decoded = jsonwebtoken_1.default.verify(token, jwt_1.JWT_SECRET);
        if (decoded.type !== 'reset')
            throw new errorHandler_1.AppError('Invalid reset token', 400);
        // Verify the token was issued by us (present in password_resets and unused)
        const reset = await prisma_1.prisma.passwordReset.findFirst({
            where: {
                tokenHash: (0, crypto_1.sha256)(token),
                userId: decoded.userId,
                usedAt: null,
                expiresAt: { gt: new Date() },
            },
        });
        if (!reset)
            throw new errorHandler_1.AppError('Invalid or expired reset token', 400);
        const hashed = await bcryptjs_1.default.hash(newPassword, 12);
        // Update password, mark reset as used, revoke all sessions
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.user.update({ where: { id: decoded.userId }, data: { password: hashed } }),
            prisma_1.prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
            prisma_1.prisma.session.updateMany({
                where: { userId: decoded.userId, revokedAt: null },
                data: { revokedAt: new Date() },
            }),
        ]);
        activity_log_service_1.ActivityLogService.log({
            userId: decoded.userId,
            action: 'auth.password_reset',
            ipAddress: req.ip,
        });
        res.json({ success: true, message: 'Password reset successfully' });
    }
    catch (error) {
        next(error instanceof errorHandler_1.AppError ? error : new errorHandler_1.AppError('Invalid or expired reset token', 400));
    }
});
//# sourceMappingURL=auth.routes.js.map