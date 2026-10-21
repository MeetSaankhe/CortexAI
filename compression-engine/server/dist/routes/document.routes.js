"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../utils/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const tokens_1 = require("../utils/tokens");
const activity_log_service_1 = require("../services/activity-log.service");
const uuid_1 = require("uuid");
const jwt_1 = require("../utils/jwt");
exports.documentRouter = (0, express_1.Router)();
const isVercel = Boolean(process.env.VERCEL);
const uploadsDir = isVercel ? path_1.default.join('/tmp', 'uploads') : path_1.default.join(process.cwd(), 'uploads');
const ensureUploadsDir = () => {
    if (!fs_1.default.existsSync(uploadsDir)) {
        fs_1.default.mkdirSync(uploadsDir, { recursive: true });
    }
};
const storage = isVercel
    ? multer_1.default.memoryStorage()
    : multer_1.default.diskStorage({
        destination: (_req, _file, cb) => {
            ensureUploadsDir();
            cb(null, uploadsDir);
        },
        filename: (_req, file, cb) => {
            const uniqueName = `${(0, uuid_1.v4)()}-${file.originalname}`;
            cb(null, uniqueName);
        },
    });
const ALLOWED_EXTENSIONS = [
    '.txt', '.pdf', '.docx', '.md', '.json', '.csv',
    '.py', '.js', '.ts', '.java', '.cpp', '.c', '.log',
];
const fileFilter = (_req, file, cb) => {
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
        cb(null, true);
    }
    else {
        cb(new Error(`File type ${ext} not supported`));
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
});
function sanitizeString(str) {
    if (!str)
        return '';
    return str.replace(/\u0000/g, '');
}
async function extractContent(file) {
    const filePath = 'path' in file && typeof file.path === 'string' ? file.path : null;
    const originalName = file.originalname;
    const ext = path_1.default.extname(originalName).toLowerCase();
    const buffer = 'buffer' in file && file.buffer instanceof Buffer ? file.buffer : null;
    let raw = '';
    if (['.txt', '.md', '.json', '.csv', '.py', '.js', '.ts', '.java', '.cpp', '.c', '.log'].includes(ext)) {
        if (buffer)
            raw = buffer.toString('utf-8');
        else if (filePath)
            raw = await fs_1.default.promises.readFile(filePath, 'utf-8');
    }
    else if (ext === '.pdf') {
        try {
            const pdfParse = await Promise.resolve().then(() => __importStar(require('pdf-parse')));
            const dataBuffer = buffer ?? (filePath ? await fs_1.default.promises.readFile(filePath) : Buffer.from(''));
            const data = await pdfParse.default(dataBuffer);
            raw = data.text;
        }
        catch (e) {
            console.error('Failed to parse PDF document content:', e);
            raw = '';
        }
    }
    else if (ext === '.docx') {
        try {
            const mammoth = await Promise.resolve().then(() => __importStar(require('mammoth')));
            const result = buffer
                ? await mammoth.extractRawText({ buffer })
                : await mammoth.extractRawText({ path: filePath });
            raw = result.value;
        }
        catch (e) {
            console.error('Failed to parse DOCX document content:', e);
            raw = '';
        }
    }
    else {
        if (buffer)
            raw = buffer.toString('utf-8');
        else if (filePath)
            raw = await fs_1.default.promises.readFile(filePath, 'utf-8');
    }
    return sanitizeString(raw);
}
/**
 * POST /documents/upload - upload and process a file
 */
exports.documentRouter.post('/upload', auth_1.authenticate, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file)
            throw new errorHandler_1.AppError('No file uploaded', 400);
        const storedFilename = 'filename' in req.file && typeof req.file.filename === 'string'
            ? req.file.filename
            : `${(0, uuid_1.v4)()}-${req.file.originalname}`;
        const content = await extractContent(req.file);
        const documentType = (0, tokens_1.detectDocumentType)(content, req.file.originalname);
        const language = (0, tokens_1.detectLanguage)(content);
        const words = (0, tokens_1.countWords)(content);
        const characters = (0, tokens_1.countCharacters)(content);
        const tokens = (0, tokens_1.estimateTokens)(content, documentType);
        const document = await prisma_1.prisma.document.create({
            data: {
                id: (0, uuid_1.v4)(),
                userId: req.userId,
                filename: sanitizeString(storedFilename),
                originalName: sanitizeString(req.file.originalname),
                mimeType: sanitizeString(req.file.mimetype),
                size: req.file.size,
                words,
                characters,
                tokens,
                content: sanitizeString(content),
                documentType: documentType,
                language: sanitizeString(language),
                storagePath: !isVercel ? sanitizeString(storedFilename) : null,
            },
        });
        activity_log_service_1.ActivityLogService.log({
            userId: req.userId,
            action: 'document.uploaded',
            resource: 'document',
            resourceId: document.id,
            metadata: { filename: req.file.originalname, size: req.file.size, tokens },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });
        res.status(201).json({
            success: true,
            data: {
                id: document.id,
                filename: document.originalName,
                size: document.size,
                words,
                characters,
                tokens,
                documentType,
                language,
                content: content.slice(0, 5000),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /documents/preview - preview an uploaded file (extract without persisting)
 */
exports.documentRouter.post('/preview', auth_1.authenticate, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file)
            throw new errorHandler_1.AppError('No file uploaded', 400);
        const content = await extractContent(req.file);
        const documentType = (0, tokens_1.detectDocumentType)(content, req.file.originalname);
        const language = (0, tokens_1.detectLanguage)(content);
        const words = (0, tokens_1.countWords)(content);
        const characters = (0, tokens_1.countCharacters)(content);
        const tokens = (0, tokens_1.estimateTokens)(content, documentType);
        if ('path' in req.file && typeof req.file.path === 'string') {
            try {
                await fs_1.default.promises.unlink(req.file.path);
            }
            catch { }
        }
        res.json({
            success: true,
            data: {
                filename: req.file.originalname,
                size: req.file.size,
                mimeType: req.file.mimetype,
                words,
                characters,
                tokens,
                documentType,
                language,
                estimatedCompression: 'medium',
                preview: content.slice(0, 2000),
                contentLength: content.length,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /documents/extract - extract structured content from a file
 * Returns metadata + full content (respects size limits)
 */
exports.documentRouter.post('/extract', auth_1.authenticate, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file)
            throw new errorHandler_1.AppError('No file uploaded', 400);
        const content = await extractContent(req.file);
        const documentType = (0, tokens_1.detectDocumentType)(content, req.file.originalname);
        const language = (0, tokens_1.detectLanguage)(content);
        if ('path' in req.file && typeof req.file.path === 'string') {
            try {
                await fs_1.default.promises.unlink(req.file.path);
            }
            catch { }
        }
        res.json({
            success: true,
            data: {
                filename: req.file.originalname,
                content,
                documentType,
                language,
                metadata: {
                    size: req.file.size,
                    mimeType: req.file.mimetype,
                    words: (0, tokens_1.countWords)(content),
                    characters: (0, tokens_1.countCharacters)(content),
                    tokens: (0, tokens_1.estimateTokens)(content, documentType),
                    lines: content.split('\n').length,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /documents - list all documents for the current user
 */
exports.documentRouter.get('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const documents = await prisma_1.prisma.document.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                originalName: true,
                mimeType: true,
                size: true,
                words: true,
                characters: true,
                tokens: true,
                documentType: true,
                language: true,
                createdAt: true,
            },
        });
        res.json({ success: true, data: documents });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /documents/:id - fetch a single document with content
 */
exports.documentRouter.get('/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const id = req.params.id;
        const document = await prisma_1.prisma.document.findFirst({
            where: { id, userId: req.userId },
        });
        if (!document)
            throw new errorHandler_1.AppError('Document not found', 404);
        res.json({ success: true, data: document });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /documents/:id - update document metadata (e.g., rename)
 */
exports.documentRouter.put('/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const id = req.params.id;
        const { originalName } = req.body;
        const document = await prisma_1.prisma.document.findFirst({
            where: { id, userId: req.userId },
        });
        if (!document)
            throw new errorHandler_1.AppError('Document not found', 404);
        const updated = await prisma_1.prisma.document.update({
            where: { id },
            data: {
                ...(originalName && { originalName }),
            },
        });
        res.json({ success: true, data: updated });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /documents/:id/download - stream the original binary file
 * Serves the file with correct MIME type and Content-Disposition header.
 * Auth via query param token to support direct browser downloads.
 */
exports.documentRouter.get('/:id/download', async (req, res, next) => {
    try {
        const id = req.params.id;
        // Support token via query for browser downloads (native <a href> can't set headers)
        const queryToken = typeof req.query.token === 'string' ? req.query.token : null;
        const headerToken = req.headers.authorization?.startsWith('Bearer ')
            ? req.headers.authorization.slice(7)
            : null;
        const token = queryToken || headerToken;
        if (!token)
            throw new errorHandler_1.AppError('Authentication required', 401);
        // Verify token manually to avoid the standard middleware for this route
        const jwt = await Promise.resolve().then(() => __importStar(require('jsonwebtoken')));
        let userId;
        try {
            const decoded = jwt.verify(token, jwt_1.JWT_SECRET);
            userId = decoded.userId;
        }
        catch {
            throw new errorHandler_1.AppError('Invalid token', 401);
        }
        const document = await prisma_1.prisma.document.findFirst({
            where: { id, userId },
        });
        if (!document)
            throw new errorHandler_1.AppError('Document not found', 404);
        const filePath = path_1.default.join(uploadsDir, document.filename);
        if (!fs_1.default.existsSync(filePath)) {
            throw new errorHandler_1.AppError('File not found on disk', 404);
        }
        // Set proper headers so the browser handles the file correctly
        res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.originalName)}"`);
        res.setHeader('Content-Length', String(document.size));
        // Stream file to response
        const stream = fs_1.default.createReadStream(filePath);
        stream.pipe(res);
        stream.on('error', (err) => {
            next(new errorHandler_1.AppError(`File read error: ${err.message}`, 500));
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /documents/:id/raw - inline preview of the binary file (e.g., PDF in-browser viewer)
 */
exports.documentRouter.get('/:id/raw', async (req, res, next) => {
    try {
        const id = req.params.id;
        const queryToken = typeof req.query.token === 'string' ? req.query.token : null;
        const headerToken = req.headers.authorization?.startsWith('Bearer ')
            ? req.headers.authorization.slice(7)
            : null;
        const token = queryToken || headerToken;
        if (!token)
            throw new errorHandler_1.AppError('Authentication required', 401);
        const jwt = await Promise.resolve().then(() => __importStar(require('jsonwebtoken')));
        let userId;
        try {
            const decoded = jwt.verify(token, jwt_1.JWT_SECRET);
            userId = decoded.userId;
        }
        catch {
            throw new errorHandler_1.AppError('Invalid token', 401);
        }
        const document = await prisma_1.prisma.document.findFirst({
            where: { id, userId },
        });
        if (!document)
            throw new errorHandler_1.AppError('Document not found', 404);
        const filePath = path_1.default.join(uploadsDir, document.filename);
        if (!fs_1.default.existsSync(filePath)) {
            throw new errorHandler_1.AppError('File not found on disk', 404);
        }
        res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.originalName)}"`);
        res.setHeader('Content-Length', String(document.size));
        const stream = fs_1.default.createReadStream(filePath);
        stream.pipe(res);
        stream.on('error', (err) => {
            next(new errorHandler_1.AppError(`File read error: ${err.message}`, 500));
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /documents/:id - delete a document and its file
 */
exports.documentRouter.delete('/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const id = req.params.id;
        const document = await prisma_1.prisma.document.findFirst({
            where: { id, userId: req.userId },
        });
        if (!document)
            throw new errorHandler_1.AppError('Document not found', 404);
        const filePath = path_1.default.join(uploadsDir, document.filename);
        if (fs_1.default.existsSync(filePath)) {
            try {
                await fs_1.default.promises.unlink(filePath);
            }
            catch { }
        }
        await prisma_1.prisma.document.delete({ where: { id: document.id } });
        activity_log_service_1.ActivityLogService.log({
            userId: req.userId,
            action: 'document.deleted',
            resource: 'document',
            resourceId: document.id,
            metadata: { filename: document.originalName },
            ipAddress: req.ip,
        });
        res.json({ success: true, message: 'Document deleted' });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=document.routes.js.map