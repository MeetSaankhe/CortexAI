"use strict";
/**
 * LLM Provider Routes.
 *
 * GET  /llm/providers   - List all available LLM providers with metadata
 * POST /llm/test        - Test connection to an LLM provider (uses stored key)
 * POST /llm/compress    - Compress a prompt and send it to the target LLM
 * POST /llm/chat        - Direct chat with an LLM provider
 *
 * All key resolution goes through ApiKeyService which decrypts just-in-time
 * and enforces per-user ownership.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const services_1 = require("../services");
const api_key_service_1 = require("../services/api-key.service");
const agents_1 = require("../agents");
const tokens_1 = require("../utils/tokens");
const activity_log_service_1 = require("../services/activity-log.service");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
exports.llmRouter = (0, express_1.Router)();
const supervisor = new agents_1.SupervisorAgent();
exports.llmRouter.get('/providers', auth_1.authenticate, async (_req, res, next) => {
    try {
        const providers = services_1.llmConnector.getAllProviders();
        res.json({
            success: true,
            data: providers.map((p) => ({
                id: p.id,
                name: p.name,
                model: p.model,
                models: p.models,
                contextWindow: p.maxTokens,
                costPer1kInput: p.costPer1kInput,
                costPer1kOutput: p.costPer1kOutput,
                estimatedLatencyPerToken: p.estimatedLatencyPerToken,
            })),
        });
    }
    catch (error) {
        next(error);
    }
});
exports.llmRouter.post('/test', auth_1.authenticate, async (req, res, next) => {
    try {
        const { provider } = req.body;
        if (!provider)
            throw new errorHandler_1.AppError('Provider is required', 400);
        const providerInfo = services_1.llmConnector.getProvider(provider);
        if (!providerInfo)
            throw new errorHandler_1.AppError('Unknown provider', 400);
        // Resolve the user's key (decrypts just-in-time)
        const resolved = await api_key_service_1.ApiKeyService.resolve(req.userId, provider);
        let result;
        const testStart = Date.now();
        try {
            const testResult = await services_1.llmConnector.send({
                prompt: 'Say "OK" in one word.',
                provider,
                maxTokens: 10,
                apiKey: resolved.key || undefined,
            });
            result = {
                ok: true,
                latency: Date.now() - testStart,
                usedUserKey: resolved.source === 'user',
                simulated: testResult.simulated,
                sample: testResult.text.slice(0, 100),
            };
        }
        catch (err) {
            result = {
                ok: false,
                latency: Date.now() - testStart,
                usedUserKey: resolved.source === 'user',
                simulated: false,
                error: err.message,
            };
        }
        await activity_log_service_1.ActivityLogService.log({
            userId: req.userId,
            action: 'llm.tested',
            resource: 'llm_provider',
            resourceId: provider,
            metadata: { ok: result.ok, keySource: resolved.source, latency: result.latency },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });
        res.json({
            success: result.ok,
            data: {
                provider,
                model: providerInfo.model,
                reachable: result.ok,
                latencyMs: result.latency,
                usedUserKey: result.usedUserKey,
                keySource: resolved.source,
                simulated: result.simulated,
                sampleResponse: result.sample,
                error: result.error,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.llmRouter.post('/compress', auth_1.authenticate, async (req, res, next) => {
    try {
        const { text, level = 'medium', provider = 'openai', model } = req.body;
        if (!text)
            throw new errorHandler_1.AppError('Text is required', 400);
        const providerInfo = services_1.llmConnector.getProvider(provider);
        if (!providerInfo)
            throw new errorHandler_1.AppError('Unknown provider', 400);
        logger_1.logger.info(`[LLM] Compress-and-send: user=${req.userId} provider=${provider} level=${level}`);
        const pipelineResult = await supervisor.orchestrate({
            text,
            userId: req.userId,
            compressionLevel: level,
            llmProvider: provider,
        });
        if (pipelineResult.status === 'failed') {
            throw new errorHandler_1.AppError(`Pipeline failed: ${pipelineResult.error}`, 500);
        }
        const resolved = await api_key_service_1.ApiKeyService.resolve(req.userId, provider);
        const llmResponse = await services_1.llmConnector.send({
            prompt: pipelineResult.compressedText,
            provider,
            model,
            apiKey: resolved.key || undefined,
        });
        res.json({
            success: true,
            data: {
                compression: {
                    originalTokens: pipelineResult.analytics?.originalTokens ?? 0,
                    compressedTokens: pipelineResult.analytics?.compressedTokens ?? 0,
                    compressionRatio: pipelineResult.analytics?.compressionRatio ?? 0,
                    semanticScore: pipelineResult.analytics?.semanticScore ?? 0,
                    compressedText: pipelineResult.compressedText,
                },
                llmResponse: {
                    text: llmResponse.text,
                    tokens: llmResponse.tokens,
                    model: llmResponse.model,
                    latencyMs: llmResponse.latencyMs,
                    cost: llmResponse.cost,
                    keySource: resolved.source,
                },
                savings: {
                    tokensSaved: (pipelineResult.analytics?.originalTokens ?? 0) - (pipelineResult.analytics?.compressedTokens ?? 0),
                    costSaved: pipelineResult.analytics?.costSavings ?? 0,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.llmRouter.post('/chat', auth_1.authenticate, async (req, res, next) => {
    try {
        const { prompt, provider = 'openai', model, temperature = 0.7, maxTokens } = req.body;
        if (!prompt)
            throw new errorHandler_1.AppError('Prompt is required', 400);
        const providerInfo = services_1.llmConnector.getProvider(provider);
        if (!providerInfo)
            throw new errorHandler_1.AppError('Unknown provider', 400);
        const resolved = await api_key_service_1.ApiKeyService.resolve(req.userId, provider);
        const response = await services_1.llmConnector.send({
            prompt,
            provider,
            model,
            temperature,
            maxTokens,
            apiKey: resolved.key || undefined,
        });
        const inputTokens = (0, tokens_1.estimateTokens)(prompt);
        const inputCost = (0, tokens_1.estimateCost)(inputTokens, provider);
        res.json({
            success: true,
            data: {
                provider,
                model: response.model,
                response: response.text,
                inputTokens,
                outputTokens: response.tokens,
                inputCost,
                outputCost: response.cost,
                totalCost: inputCost + response.cost,
                latencyMs: response.latencyMs,
                usedUserKey: resolved.source === 'user',
                keySource: resolved.source,
                simulated: response.simulated,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=llm.routes.js.map