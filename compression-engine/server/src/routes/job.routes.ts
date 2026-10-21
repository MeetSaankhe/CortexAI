import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../utils/prisma';
import { processNextJob, processJobById } from '../services/job-worker.service';

export const jobRouter = Router();

jobRouter.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        type: true,
        status: true,
        progress: true,
        stage: true,
        error: true,
        createdAt: true,
        updatedAt: true,
        startedAt: true,
        completedAt: true,
      },
    });
    res.json({ success: true, data: jobs });
  } catch (error) {
    next(error);
  }
});

jobRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const job = await prisma.job.findFirst({
      where: { id, userId: req.userId },
      select: {
        id: true,
        type: true,
        status: true,
        progress: true,
        stage: true,
        result: true,
        error: true,
        createdAt: true,
        updatedAt: true,
        startedAt: true,
        completedAt: true,
      },
    });
    if (!job) throw new AppError('Job not found', 404);
    res.json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
});

jobRouter.post('/:id/run', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const job = await prisma.job.findFirst({ where: { id, userId: req.userId } });
    if (!job) throw new AppError('Job not found', 404);
    if (job.status !== 'pending') throw new AppError('Job is not pending', 400);
    await processJobById(job.id);
    const updated = await prisma.job.findFirst({
      where: { id: job.id, userId: req.userId },
      select: {
        id: true,
        type: true,
        status: true,
        progress: true,
        stage: true,
        result: true,
        error: true,
        createdAt: true,
        updatedAt: true,
        startedAt: true,
        completedAt: true,
      },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

jobRouter.post('/worker/run-once', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const required = (process.env.WORKER_SECRET || '').trim();
    if (!required) throw new AppError('WORKER_SECRET is not configured', 500);
    const provided = (req.headers['x-worker-secret'] as string | undefined) || '';
    if (provided !== required) throw new AppError('Forbidden', 403);

    const result = await processNextJob();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

