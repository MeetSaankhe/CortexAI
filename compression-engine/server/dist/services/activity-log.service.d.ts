/**
 * Activity Log Service.
 *
 * Records user actions for audit trail, security, and analytics.
 * Non-blocking: logs are written asynchronously and never block the request.
 */
export type ActivityAction = 'auth.login' | 'auth.logout' | 'auth.register' | 'auth.password_changed' | 'auth.password_reset' | 'document.uploaded' | 'document.deleted' | 'document.previewed' | 'compression.created' | 'compression.deleted' | 'settings.updated' | 'apikey.added' | 'apikey.deleted' | 'apikey.toggled' | 'llm.tested';
export interface LogEntry {
    userId: string;
    action: ActivityAction;
    resource?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}
export declare class ActivityLogService {
    private static normalizeMetadata;
    /**
     * Log a user activity. Fire-and-forget: never throws.
     */
    static log(entry: LogEntry): Promise<void>;
    /**
     * Get recent activity for a user.
     */
    static getForUser(userId: string, limit?: number): Promise<{
        metadata: any;
        id: string;
        userId: string;
        ipAddress: string | null;
        userAgent: string | null;
        createdAt: Date;
        action: string;
        resource: string | null;
        resourceId: string | null;
    }[]>;
}
//# sourceMappingURL=activity-log.service.d.ts.map