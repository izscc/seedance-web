import fs from 'node:fs/promises';
import path from 'node:path';

export type JobStatus = 'pending'|'running'|'succeeded'|'failed';
export type SeedanceJob = {
  id: string; remoteId?: string; status: JobStatus; prompt: string; negativePrompt?: string;
  model: string; baseUrl: string; endpointMode: string; params: Record<string, unknown>;
  storagePath: string; sourceUrl?: string; localPath?: string; error?: string; raw?: unknown;
  createdAt: string; updatedAt: string;
};

export const defaultOutputDir = path.resolve(process.cwd(), 'outputs/videos');
const dbPath = path.resolve(process.cwd(), 'outputs/jobs.json');

async function ensureDb() { await fs.mkdir(path.dirname(dbPath), { recursive: true }); try { await fs.access(dbPath); } catch { await fs.writeFile(dbPath, '[]'); } }
export async function readJobs(): Promise<SeedanceJob[]> { await ensureDb(); return JSON.parse(await fs.readFile(dbPath, 'utf8')); }
export async function writeJobs(jobs: SeedanceJob[]) { await ensureDb(); await fs.writeFile(dbPath, JSON.stringify(jobs, null, 2)); }
export async function upsertJob(job: SeedanceJob) { const jobs = await readJobs(); const i = jobs.findIndex(j => j.id === job.id); if (i >= 0) jobs[i] = job; else jobs.unshift(job); await writeJobs(jobs); }
export async function getJob(id: string) { return (await readJobs()).find(j => j.id === id); }
export async function deleteJob(id: string, removeFile = false) { const jobs = await readJobs(); const job = jobs.find(j => j.id === id); if (removeFile && job?.localPath) await fs.rm(job.localPath, { force: true }).catch(() => {}); await writeJobs(jobs.filter(j => j.id !== id)); return job; }
export function safeFilename(input: string) { return input.replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]+/g, '-').slice(0, 80) || 'seedance-video'; }
export function resolveStoragePath(p?: string) { return path.resolve(p?.trim() || defaultOutputDir); }
