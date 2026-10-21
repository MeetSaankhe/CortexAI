"use strict";
/**
 * Role-Based Access Control (RBAC) middleware.
 *
 * Roles:
 * - admin: Full access to all resources
 * - developer: Standard user, can compress, upload, view own data
 * - researcher: Similar to developer, elevated for research operations
 * - guest: Read-only, limited access
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLES = void 0;
exports.requireRole = requireRole;
exports.requireMinRole = requireMinRole;
exports.isRoleValid = isRoleValid;
const errorHandler_1 = require("./errorHandler");
exports.ROLES = {
    admin: 'admin',
    developer: 'developer',
    researcher: 'researcher',
    guest: 'guest',
};
const ROLE_HIERARCHY = {
    guest: 0,
    developer: 1,
    researcher: 2,
    admin: 3,
};
/**
 * Middleware factory that restricts access to users with specific roles.
 * Usage: router.get('/admin', authenticate, requireRole('admin'), handler)
 */
function requireRole(...allowedRoles) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AppError('Authentication required', 401));
        }
        const userRole = req.user.role;
        if (!allowedRoles.includes(userRole)) {
            return next(new errorHandler_1.AppError(`Insufficient permissions. Required role: ${allowedRoles.join(' or ')}`, 403));
        }
        next();
    };
}
/**
 * Middleware factory that allows access to users with roles at or above the specified level.
 * Usage: router.get('/dev-only', authenticate, requireMinRole('developer'), handler)
 */
function requireMinRole(minRole) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AppError('Authentication required', 401));
        }
        const userRole = req.user.role;
        const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
        const requiredLevel = ROLE_HIERARCHY[minRole];
        if (userLevel < requiredLevel) {
            return next(new errorHandler_1.AppError(`Requires minimum role: ${minRole}`, 403));
        }
        next();
    };
}
function isRoleValid(role) {
    return Object.keys(ROLE_HIERARCHY).includes(role);
}
//# sourceMappingURL=rbac.js.map