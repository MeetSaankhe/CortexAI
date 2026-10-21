"use strict";
/**
 * LLM Connector Service.
 *
 * Real HTTP integration for OpenAI, Gemini, Claude, Ollama.
 * Others fall back to simulated responses (until keys/SDKs are wired up).
 *
 * Key precedence:
 *   1. User's own API key (from ApiKey table via caller)
 *   2. System-level fallback key from environment
 *   3. Fail with a clear message
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmConnector = exports.LLMConnectorService = void 0;
const logger_1 = require("../utils/logger");
const PROVIDERS = {
    openai: {
        id: 'openai',
        name: 'OpenAI',
        model: 'gpt-4o-mini',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
        maxTokens: 128000,
        costPer1kInput: 0.00015,
        costPer1kOutput: 0.0006,
        estimatedLatencyPerToken: 0.05,
    },
    gemini: {
        id: 'gemini',
        name: 'Google Gemini',
        model: 'gemini-1.5-flash',
        models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash-exp'],
        maxTokens: 1000000,
        costPer1kInput: 0.0025,
        costPer1kOutput: 0.005,
        estimatedLatencyPerToken: 0.04,
    },
    claude: {
        id: 'claude',
        name: 'Anthropic Claude',
        model: 'claude-3-5-haiku-20241022',
        models: [
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022',
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307',
        ],
        maxTokens: 200000,
        costPer1kInput: 0.00025,
        costPer1kOutput: 0.00125,
        estimatedLatencyPerToken: 0.06,
    },
    llama: {
        id: 'llama',
        name: 'Meta Llama',
        model: 'llama-3.3-70b-instruct',
        models: [
            'llama-3.3-70b-instruct',
            'llama-3.2-90b-instruct',
            'llama-3.2-11b-instruct',
            'llama-3.1-70b-instruct',
            'llama-3.1-8b-instruct',
        ],
        maxTokens: 128000,
        costPer1kInput: 0.001,
        costPer1kOutput: 0.002,
        estimatedLatencyPerToken: 0.08,
    },
    deepseek: {
        id: 'deepseek',
        name: 'DeepSeek',
        model: 'deepseek-chat',
        models: ['deepseek-chat', 'deepseek-reasoner', 'deepseek-coder'],
        maxTokens: 128000,
        costPer1kInput: 0.00014,
        costPer1kOutput: 0.00028,
        estimatedLatencyPerToken: 0.07,
    },
    mistral: {
        id: 'mistral',
        name: 'Mistral AI',
        model: 'mistral-small-latest',
        models: ['mistral-large-latest', 'mistral-small-latest', 'ministral-8b-latest', 'codestral-latest'],
        maxTokens: 32000,
        costPer1kInput: 0.001,
        costPer1kOutput: 0.003,
        estimatedLatencyPerToken: 0.05,
    },
    ollama: {
        id: 'ollama',
        name: 'Ollama (Local)',
        model: 'llama3',
        models: ['llama3', 'llama3.2', 'mistral', 'phi3', 'gemma2', 'qwen2.5', 'deepseek-coder'],
        maxTokens: 8192,
        costPer1kInput: 0,
        costPer1kOutput: 0,
        estimatedLatencyPerToken: 0.1,
    },
};
/** Provider ID → environment variable name for system-level fallback key */
const SYSTEM_KEY_ENV = {
    openai: 'OPENAI_API_KEY',
    gemini: 'GEMINI_API_KEY',
    claude: 'ANTHROPIC_API_KEY',
    deepseek: 'DEEPSEEK_API_KEY',
    mistral: 'MISTRAL_API_KEY',
    llama: 'LLAMA_API_KEY',
};
class LLMConnectorService {
    getProvider(name) {
        return PROVIDERS[name] || null;
    }
    getAllProviders() {
        return Object.values(PROVIDERS);
    }
    getProviderNames() {
        return Object.keys(PROVIDERS);
    }
    getModels(providerId) {
        return PROVIDERS[providerId]?.models || [];
    }
    estimateCost(tokens, provider, direction = 'input') {
        const p = PROVIDERS[provider];
        if (!p)
            return 0;
        const rate = direction === 'input' ? p.costPer1kInput : p.costPer1kOutput;
        return (tokens / 1000) * rate;
    }
    estimateLatency(tokens, provider) {
        const p = PROVIDERS[provider];
        if (!p)
            return 0;
        return tokens * p.estimatedLatencyPerToken;
    }
    getContextWindow(provider) {
        const p = PROVIDERS[provider];
        return p ? p.maxTokens : 8192;
    }
    resolveKey(providerId, userKey) {
        if (userKey && userKey.trim().length > 0) {
            return { key: userKey.trim(), isUserKey: true };
        }
        if (providerId === 'ollama') {
            return { key: '', isUserKey: false };
        }
        const envName = SYSTEM_KEY_ENV[providerId];
        const systemKey = envName ? process.env[envName] : undefined;
        if (systemKey && systemKey.trim().length > 0) {
            return { key: systemKey.trim(), isUserKey: false };
        }
        return null;
    }
    async send(request) {
        const provider = PROVIDERS[request.provider];
        if (!provider) {
            throw new Error(`Unknown LLM provider: ${request.provider}`);
        }
        const model = request.model || provider.model;
        const resolved = this.resolveKey(request.provider, request.apiKey);
        logger_1.logger.info(`[LLM] ${provider.name} (${model}) key=${resolved ? (resolved.isUserKey ? 'user' : 'system') : 'none'}`);
        try {
            if (request.provider === 'openai' && resolved) {
                return await this.callOpenAI(request, model, resolved.key, resolved.isUserKey);
            }
            if (request.provider === 'gemini' && resolved) {
                return await this.callGemini(request, model, resolved.key, resolved.isUserKey);
            }
            if (request.provider === 'claude' && resolved) {
                return await this.callClaude(request, model, resolved.key, resolved.isUserKey);
            }
            if (request.provider === 'ollama') {
                return await this.callOllama(request, model);
            }
        }
        catch (error) {
            logger_1.logger.error(`[LLM] Real call failed for ${request.provider}: ${error.message}`);
            throw new Error(`${provider.name} (${model}) call failed: ${error.message}. ` +
                `Verify your API key in Settings.`);
        }
        return this.simulated(request, provider, model, resolved);
    }
    async callOpenAI(request, model, apiKey, isUserKey) {
        const start = Date.now();
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: request.prompt }],
                temperature: request.temperature ?? 0.7,
                max_tokens: request.maxTokens ?? 1024,
            }),
        });
        if (!res.ok) {
            const body = await res.text();
            throw new Error(`OpenAI ${res.status}: ${body.slice(0, 200)}`);
        }
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content ?? '';
        const usage = data.usage || {};
        const inputTokens = usage.prompt_tokens || Math.ceil(request.prompt.length / 4);
        const outputTokens = usage.completion_tokens || Math.ceil(text.length / 4);
        return {
            text,
            tokens: outputTokens,
            inputTokens,
            provider: 'openai',
            model: data.model || model,
            latencyMs: Date.now() - start,
            cost: this.estimateCost(inputTokens, 'openai', 'input') +
                this.estimateCost(outputTokens, 'openai', 'output'),
            usedUserKey: isUserKey,
            simulated: false,
        };
    }
    async callGemini(request, model, apiKey, isUserKey) {
        const start = Date.now();
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: request.prompt }] }],
                generationConfig: {
                    temperature: request.temperature ?? 0.7,
                    maxOutputTokens: request.maxTokens ?? 1024,
                },
            }),
        });
        if (!res.ok) {
            const body = await res.text();
            throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
        }
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const usage = data.usageMetadata || {};
        const inputTokens = usage.promptTokenCount || Math.ceil(request.prompt.length / 4);
        const outputTokens = usage.candidatesTokenCount || Math.ceil(text.length / 4);
        return {
            text,
            tokens: outputTokens,
            inputTokens,
            provider: 'gemini',
            model,
            latencyMs: Date.now() - start,
            cost: this.estimateCost(inputTokens, 'gemini', 'input') +
                this.estimateCost(outputTokens, 'gemini', 'output'),
            usedUserKey: isUserKey,
            simulated: false,
        };
    }
    async callClaude(request, model, apiKey, isUserKey) {
        const start = Date.now();
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens: request.maxTokens ?? 1024,
                temperature: request.temperature ?? 0.7,
                messages: [{ role: 'user', content: request.prompt }],
            }),
        });
        if (!res.ok) {
            const body = await res.text();
            throw new Error(`Claude ${res.status}: ${body.slice(0, 200)}`);
        }
        const data = await res.json();
        const text = data.content?.[0]?.text ?? '';
        const usage = data.usage || {};
        const inputTokens = usage.input_tokens || Math.ceil(request.prompt.length / 4);
        const outputTokens = usage.output_tokens || Math.ceil(text.length / 4);
        return {
            text,
            tokens: outputTokens,
            inputTokens,
            provider: 'claude',
            model,
            latencyMs: Date.now() - start,
            cost: this.estimateCost(inputTokens, 'claude', 'input') +
                this.estimateCost(outputTokens, 'claude', 'output'),
            usedUserKey: isUserKey,
            simulated: false,
        };
    }
    async callOllama(request, model) {
        const start = Date.now();
        const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
        const res = await fetch(`${host}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                prompt: request.prompt,
                stream: false,
                options: { temperature: request.temperature ?? 0.7 },
            }),
        });
        if (!res.ok) {
            const body = await res.text();
            throw new Error(`Ollama ${res.status}: ${body.slice(0, 200)}`);
        }
        const data = await res.json();
        const text = data.response ?? '';
        const inputTokens = data.prompt_eval_count || Math.ceil(request.prompt.length / 4);
        const outputTokens = data.eval_count || Math.ceil(text.length / 4);
        return {
            text,
            tokens: outputTokens,
            inputTokens,
            provider: 'ollama',
            model,
            latencyMs: Date.now() - start,
            cost: 0,
            usedUserKey: false,
            simulated: false,
        };
    }
    simulated(request, provider, model, resolved) {
        logger_1.logger.warn(`[LLM] Using simulated response for ${request.provider} (no real integration yet)`);
        const inputTokens = Math.ceil(request.prompt.length / 4);
        const latency = this.estimateLatency(inputTokens, request.provider);
        const notice = `[Simulated response — ${provider.name} (${model}) integration not yet wired]\n\n` +
            `The prompt was received (${inputTokens} tokens). To get real responses, ` +
            `either configure ${SYSTEM_KEY_ENV[request.provider] || 'a system key'} in .env, ` +
            `or add your API key in Settings.`;
        const outputTokens = Math.ceil(notice.length / 4);
        return {
            text: notice,
            tokens: outputTokens,
            inputTokens,
            provider: request.provider,
            model,
            latencyMs: latency,
            cost: this.estimateCost(inputTokens, request.provider, 'input'),
            usedUserKey: resolved?.isUserKey ?? false,
            simulated: true,
        };
    }
}
exports.LLMConnectorService = LLMConnectorService;
exports.llmConnector = new LLMConnectorService();
//# sourceMappingURL=llm-connector.service.js.map