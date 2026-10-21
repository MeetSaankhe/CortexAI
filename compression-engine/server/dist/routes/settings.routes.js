"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../utils/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const crypto_1 = require("../utils/crypto");
const activity_log_service_1 = require("../services/activity-log.service");
const uuid_1 = require("uuid");
exports.settingsRouter = (0, express_1.Router)();
const VALID_PROVIDERS = [
    'openai', 'gemini', 'claude', 'llama', 'deepseek', 'mistral', 'ollama', 'qwen', 'gemma',
];
exports.settingsRouter.get('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                theme: true, language: true, preferredLlm: true, defaultCompression: true,
            },
        });
        // Return API keys WITHOUT the ciphertext — only masked prefix
        const apiKeys = await prisma_1.prisma.apiKey.findMany({
            where: { userId: req.userId },
            select: {
                id: true,
                provider: true,
                label: true,
                keyPrefix: true,
                isActive: true,
                lastUsedAt: true,
                usageCount: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: { ...user, apiKeys } });
    }
    catch (error) {
        next(error);
    }
});
exports.settingsRouter.put('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const { theme, language, preferredLlm, defaultCompression } = req.body;
        const user = await prisma_1.prisma.user.update({
            where: { id: req.userId },
            data: {
                ...(theme && { theme }),
                ...(language && { language }),
                ...(preferredLlm && { preferredLlm }),
                ...(defaultCompression && { defaultCompression }),
            },
            select: {
                theme: true, language: true, preferredLlm: true, defaultCompression: true,
            },
        });
        res.json({ success: true, data: user });
    }
    catch (error) {
        next(error);
    }
});
exports.settingsRouter.post('/api-keys', auth_1.authenticate, async (req, res, next) => {
    try {
        const { provider, key, label } = req.body;
        if (!provider || !key) {
            throw new errorHandler_1.AppError('Provider and key are required', 400);
        }
        if (!VALID_PROVIDERS.includes(provider)) {
            throw new errorHandler_1.AppError('Invalid provider', 400);
        }
        if (typeof key !== 'string' || key.length < 8) {
            throw new errorHandler_1.AppError('API key looks invalid (too short)', 400);
        }
        // Encrypt the plaintext key immediately — never persist it in cleartext
        const encryptedKey = (0, crypto_1.encrypt)(key);
        const fingerprint = (0, crypto_1.sha256)(key.trim());
        const prefix = (0, crypto_1.keyPrefix)(key, 8);
        // Enforce per-user unique fingerprint (no duplicate keys)
        const existing = await prisma_1.prisma.apiKey.findUnique({
            where: {
                userId_provider_keyFingerprint: {
                    userId: req.userId,
                    provider: provider,
                    keyFingerprint: fingerprint,
                },
            },
        });
        if (existing) {
            throw new errorHandler_1.AppError('This API key is already saved', 409);
        }
        const apiKey = await prisma_1.prisma.apiKey.create({
            data: {
                id: (0, uuid_1.v4)(),
                userId: req.userId,
                provider: provider,
                label: label || provider,
                encryptedKey,
                keyFingerprint: fingerprint,
                keyPrefix: prefix,
            },
            select: {
                id: true,
                provider: true,
                label: true,
                keyPrefix: true,
                isActive: true,
                createdAt: true,
            },
        });
        activity_log_service_1.ActivityLogService.log({
            userId: req.userId,
            action: 'apikey.added',
            resource: 'api_key',
            resourceId: apiKey.id,
            metadata: { provider },
            ipAddress: req.ip,
        });
        res.status(201).json({ success: true, data: apiKey });
    }
    catch (error) {
        next(error);
    }
});
exports.settingsRouter.delete('/api-keys/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await prisma_1.prisma.apiKey.deleteMany({
            where: { id, userId: req.userId },
        });
        if (result.count === 0) {
            throw new errorHandler_1.AppError('API key not found', 404);
        }
        activity_log_service_1.ActivityLogService.log({
            userId: req.userId,
            action: 'apikey.deleted',
            resource: 'api_key',
            resourceId: id,
            ipAddress: req.ip,
        });
        res.json({ success: true, message: 'API key deleted' });
    }
    catch (error) {
        next(error);
    }
});
exports.settingsRouter.put('/api-keys/:id/toggle', auth_1.authenticate, async (req, res, next) => {
    try {
        const id = req.params.id;
        const key = await prisma_1.prisma.apiKey.findFirst({
            where: { id, userId: req.userId },
        });
        if (!key)
            throw new errorHandler_1.AppError('API key not found', 404);
        const updated = await prisma_1.prisma.apiKey.update({
            where: { id: key.id },
            data: { isActive: !key.isActive },
            select: { id: true, provider: true, label: true, isActive: true },
        });
        activity_log_service_1.ActivityLogService.log({
            userId: req.userId,
            action: 'apikey.toggled',
            resource: 'api_key',
            resourceId: id,
            metadata: { isActive: updated.isActive },
            ipAddress: req.ip,
        });
        res.json({ success: true, data: updated });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=settings.routes.js.map