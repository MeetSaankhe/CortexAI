/**
 * Centralized JWT secrets with safe fallback defaults.
 * Prevents 500 Internal Server Errors when env variables are missing in serverless environments.
 */

export const JWT_SECRET =
  process.env.JWT_SECRET ||
  'cortex-ai-fallback-jwt-secret-key-39be975a69644d4deaf5b21cc32c01c1';

export const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  'cortex-ai-fallback-refresh-secret-key-78cc125d503bbf5bdeba399c8779dbf3';
