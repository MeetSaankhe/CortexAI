import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    userId?: string;
    user?: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
}
export declare function authenticate(req: AuthRequest, _res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.d.ts.map