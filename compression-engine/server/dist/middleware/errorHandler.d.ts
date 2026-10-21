import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    errorCode: string;
    isOperational: boolean;
    constructor(message: string, statusCode: number, errorCode?: string);
    private static codeForStatus;
}
export declare function errorHandler(err: Error | AppError, req: Request, res: Response, _next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map