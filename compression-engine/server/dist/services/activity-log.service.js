"use strict";
/**
 * Activity Log Service.
 *
 * Records user actions for audit trail, security, and analytics.
 * Non-blocking: logs are written asynchronously and never block the request.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLogService = void 0;
const prisma_1 = require("../utils/prisma");
const logger_1 = require("../utils/logger");
const uuid_1 = require("uuid");
class ActivityLogService {
    static normalizeMetadata(metadata) {
        if (!metadata) {
            return undefined;
        }
        try {
            return JSON.stringify(metadata);
        }
        catch {
            return undefined;
        }
    }
    /**
     * Log a user activity. Fire-and-forget: never throws.
     */
    static async log(entry) {
        try {
            const metadata = this.normalizeMetadata(entry.metadata);
            await prisma_1.prisma.activityLog.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    userId: entry.userId,
                    action: entry.action,
                    resource: entry.resource,
                    resourceId: entry.resourceId,
                    metadata,
                    ipAddress: entry.ipAddress,
                    userAgent: entry.userAgent,
                },
            });
        }
        catch (error) {
            logger_1.logger.error(`Failed to log activity: ${error.message}`);
            // Never throw - activity logging must not break the request
        }
    }
    /**
     * Get recent activity for a user.
     */
    static async getForUser(userId, limit = 50) {
        const logs = await prisma_1.prisma.activityLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return logs.map((log) => ({
            ...log,
            metadata: typeof log.metadata === 'string'
                ? (() => {
                    try {
                        return JSON.parse(log.metadata);
                    }
                    catch {
                        return log.metadata;
                    }
                })()
                : log.metadata,
        }));
    }
}
exports.ActivityLogService = ActivityLogService;
//# sourceMappingURL=activity-log.service.js.map