import { prisma } from '../utils/prisma';
import { v4 as uuid } from 'uuid';
import type { CompressionLevel } from '../agents/types';
import { compressAndPersist } from './compression-execution.service';

const instanceId = process.env.JOB_WORKER_INSTANCE_ID || uuid();

type JobRow = {
  id: string;
  userId: string;
  type: string;
  input: string;
  // parsed input fields (populated after reading `input`)
  inputText?: string | null;
  inputFilename?: string | null;
  inputMimeType?: string | null;
  inputImageBase64?: string | null;
  language?: string | null;
  compressionLevel?: string | null;
  llmProvider?: string | null;
  accuracyTarget?: number | null;
};

async function setJobState(
  jobId: string,
  data: Partial<{
    status: string;
    progress: number;
    stage: string | null;
    result: unknown;
    errorMessage: string | null;
    startedAt: Date | null;
    finishedAt: Date | null;
  }>
) {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      ...(data.status != null ? { status: data.status } : {}),
      ...(data.progress != null ? { progress: data.progress } : {}),
      ...(data.stage !== undefined && data.stage !== null ? { stage: data.stage } : {}),
      ...(data.result !== undefined ? { result: data.result as any } : {}),
      ...(data.errorMessage !== undefined ? { error: data.errorMessage } : {}),
      ...(data.startedAt !== undefined ? { startedAt: data.startedAt } : {}),
      ...(data.finishedAt !== undefined ? { completedAt: data.finishedAt } : {}),
    },
  });
}

async function claimNextPendingJob(): Promise<JobRow | null> {
  return prisma.$transaction(async (tx) => {
    const job = await tx.job.findFirst({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        userId: true,
        type: true,
        input: true,
      },
    });

    if (!job) return null;

    const claimed = await tx.job.updateMany({
      where: { id: job.id, status: 'pending' },
      data: { status: 'running', progress: 1, stage: `claimed:${instanceId}`, startedAt: new Date() },
    });

    if (claimed.count === 0) return null;

    // parse the JSON input into the expected fields
    const parsed = (() => {
      try {
        return JSON.parse(job.input || '{}');
      } catch (e) {
        return {};
      }
    })();

    return {
      ...job,
      inputText: parsed.text ?? null,
      inputFilename: parsed.filename ?? null,
      inputMimeType: parsed.mimeType ?? null,
      inputImageBase64: parsed.imageBase64 ?? null,
      language: parsed.language ?? parsed.lang ?? null,
      compressionLevel: parsed.compressionLevel ?? null,
      llmProvider: parsed.llmProvider ?? null,
      accuracyTarget: parsed.accuracyTarget ?? null,
    } as JobRow;
  });
}

async function processJob(job: JobRow) {
  const { id: jobId } = job;

  try {
    if (job.type === 'compression') {
      if (!job.inputText) throw new Error('Missing input text');
      await setJobState(jobId, { progress: 5, stage: 'compress:start' });
      const { apiResult } = await compressAndPersist({
        text: job.inputText,
        userId: job.userId,
        compressionLevel: (job.compressionLevel || 'medium') as CompressionLevel,
        llmProvider: job.llmProvider || 'openai',
        filename: job.inputFilename || undefined,
        accuracyTarget: job.accuracyTarget ?? undefined,
      });
      await setJobState(jobId, { progress: 100, stage: 'completed', status: 'completed', result: apiResult, finishedAt: new Date() });
      return;
    }


    throw new Error(`Unsupported job type: ${job.type}`);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Job failed';
    await setJobState(jobId, {
      status: 'failed',
      progress: Math.max(1, Math.min(99, (await prisma.job.findUnique({ where: { id: jobId }, select: { progress: true } }))?.progress ?? 1)),
      stage: 'failed',
      errorMessage: message,
      finishedAt: new Date(),
    });
  }
}

export async function processNextJob(): Promise<{ processed: boolean; jobId?: string }> {
  const job = await claimNextPendingJob();
  if (!job) return { processed: false };
  await processJob(job);
  return { processed: true, jobId: job.id };
}

export async function processJobById(jobId: string): Promise<void> {
  const job = await prisma.job.findFirst({
    where: { id: jobId, status: { in: ['pending', 'running'] } },
    select: {
      id: true,
      userId: true,
      type: true,
      input: true,
      status: true,
    },
  });
  if (!job) return;
  if (job.status === 'pending') {
    await prisma.job.update({ where: { id: jobId }, data: { status: 'running', progress: 1, stage: `claimed:${instanceId}`, startedAt: new Date() } });
  }
  const parsed = (() => {
    try {
      return JSON.parse((job as any).input || '{}');
    } catch (e) {
      return {};
    }
  })();

  const mapped = {
    ...job,
    inputText: parsed.text ?? null,
    inputFilename: parsed.filename ?? null,
    inputMimeType: parsed.mimeType ?? null,
    inputImageBase64: parsed.imageBase64 ?? null,
    language: parsed.language ?? parsed.lang ?? null,
    compressionLevel: parsed.compressionLevel ?? null,
    llmProvider: parsed.llmProvider ?? null,
    accuracyTarget: parsed.accuracyTarget ?? null,
  } as JobRow;

  await processJob(mapped);
}

