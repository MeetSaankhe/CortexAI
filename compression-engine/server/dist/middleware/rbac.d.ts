/**
 * Role-Based Access Control (RBAC) middleware.
 *
 * Roles:
 * - admin: Full access to all resources
 * - developer: Standard user, can compress, upload, view own data
 * - researcher: Similar to developer, elevated for research operations
 * - guest: Read-only, limited access
 */
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
export type UserRole = 'admin' | 'developer' | 'researcher' | 'guest';
export declare const ROLES: Record<UserRole, UserRole>;
/**
 * Middleware factory that restricts access to users with specific roles.
 * Usage: router.get('/admin', authenticate, requireRole('admin'), handler)
 */
export declare function requireRole(...allowedRoles: UserRole[]): (req: AuthRequest, _res: Response, next: NextFunction) => void;
/**
 * Middleware factory that allows access to users with roles at or above the specified level.
 * Usage: router.get('/dev-only', authenticate, requireMinRole('developer'), handler)
 */
export declare function requireMinRole(minRole: UserRole): (req: AuthRequest, _res: Response, next: NextFunction) => void;
export declare function isRoleValid(role: string): role is UserRole;
//# sourceMappingURL=rbac.d.ts.map