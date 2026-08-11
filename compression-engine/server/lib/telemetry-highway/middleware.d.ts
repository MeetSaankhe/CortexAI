import type { Monitor } from "./monitor.js";
/**
 * Framework-agnostic Express-style request logging middleware.
 *
 * Phase 1 provides the hook point; Phase 2/3 can add richer NestJS/Next.js
 * adapters on top of the same `Monitor` instance without changing the core.
 */
export declare function expressMiddleware(monitor: Monitor): (req: any, res: any, next: () => void) => void;
