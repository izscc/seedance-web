import fs from 'node:fs/promises';
import path from 'node:path';
import { SeedanceJob, safeFilename } from './store';

const TASK_PATH = '/api/v3/contents/generations/tasks';
const CONTENT_TASK_SUFFIX = '/contents/generations/tasks';
const OPENAI_VIDEO_PATH = '/video/generations';

function joinUrl(base: string, suffix: string) {
  const b = base.replace(/\/+$/, '');
  if (suffix.startsWith('/v1/') || suffix === '/v1') return b.replace(/\/v1$/, '') + suffix;
  return b + suffix;
}
function officialTaskUrl(baseUrl: string, taskId?: string) {
  const b = baseUrl.replace(/\/+$/, '');
  const suffix = taskId ? `${CONTENT_TASK_SUFFIX}/${taskId}` : CONTENT_TASK_SUFFIX;
  if (b.endsWith('/api/v3') || b.endsWith('/api/coding/v3') || b.endsWith('/v3')) return b + suffix;
  return b.replace(/\/v1$/, '') + (taskId ? `${TASK_PATH}/${taskId}` : TASK_PATH);
}
function bearer(key: string) { return key.startsWith('Bearer ') ? key : `Bearer ${key}`; }
export function pickVideoUrl(raw: any): string | undefined {
  return raw?.content?.video_url || raw?.content?.[0]?.url || raw?.data?.[0]?.url || raw?.data?.video_url || raw?.video_url || raw?.url || raw?.output?.video_url || raw?.result?.video_url;
}
export function pickStatus(raw: any): SeedanceJob['status'] {
  const s = String(raw?.status || raw?.data?.status || raw?.state || '').toLowerCase();
  if (['succeeded','success','completed','done'].includes(s)) return 'succeeded';
  if (['failed','error','cancelled','canceled'].includes(s)) return 'failed';
  if (['running','processing','in_progress'].includes(s)) return 'running';
  return 'pending';
}
export async function createRemoteTask(args: { baseUrl: string; apiKey: string; model: string; prompt: string; negativePrompt?: string; duration: number; ratio: string; resolution: string; audio: boolean; seed?: number; endpointMode: string; }) {
  const prompt = `${args.prompt}${args.negativePrompt ? `\nNegative prompt: ${args.negativePrompt}` : ''} --ratio ${args.ratio} --duration ${args.duration} --resolution ${args.resolution}${args.audio ? ' --audio true' : ''}${args.seed ? ` --seed ${args.seed}` : ''}`;
  const officialBody = { model: args.model, content: [{ type: 'text', text: prompt }] };
  const [width, height] = args.ratio === '9:16' ? [720,1280] : args.ratio === '4:3' ? [1024,768] : args.ratio === '3:4' ? [768,1024] : args.ratio === '1:1' ? [1024,1024] : [1280,720];
  const openaiBody = { model: args.model, prompt: args.prompt, duration: args.duration, width, height, seed: args.seed, metadata: { duration: args.duration, seed: args.seed || 0, resolution: args.resolution, bgm: args.audio, payload: prompt } };
  const attempts = args.endpointMode === 'openai'
    ? [{ url: joinUrl(args.baseUrl, OPENAI_VIDEO_PATH), body: openaiBody, mode: 'openai' }]
    : args.endpointMode === 'official'
      ? [{ url: officialTaskUrl(args.baseUrl), body: officialBody, mode: 'official' }]
      : [
          { url: officialTaskUrl(args.baseUrl), body: officialBody, mode: 'official' },
          { url: joinUrl(args.baseUrl, OPENAI_VIDEO_PATH), body: openaiBody, mode: 'openai' },
        ];
  const errors: string[] = [];
  for (const a of attempts) {
    const res = await fetch(a.url, { method: 'POST', headers: { Authorization: bearer(args.apiKey), 'Content-Type': 'application/json' }, body: JSON.stringify(a.body) });
    const text = await res.text(); let raw: any; try { raw = JSON.parse(text); } catch { raw = { text }; }
    if (res.ok && !raw.error && raw.code !== 'invalid_request' && raw.code !== 'do_request_failed') return { raw, mode: a.mode };
    errors.push(`${a.mode} ${res.status}: ${raw?.error?.message || raw?.message || text.slice(0, 200)}`);
  }
  throw new Error(errors.join('\n'));
}
export async function pollRemote(job: SeedanceJob, apiKey: string) {
  if (!job.remoteId) return job;
  const url = job.endpointMode === 'official' ? officialTaskUrl(job.baseUrl, job.remoteId) : joinUrl(job.baseUrl, `/video/generations/${job.remoteId}`);
  const res = await fetch(url, { headers: { Authorization: bearer(apiKey) } });
  const raw = await res.json().catch(async () => ({ text: await res.text() }));
  return { ...job, status: pickStatus(raw), sourceUrl: pickVideoUrl(raw) || job.sourceUrl, raw, updatedAt: new Date().toISOString() } as SeedanceJob;
}
export async function downloadVideo(job: SeedanceJob) {
  if (!job.sourceUrl || job.localPath) return job;
  await fs.mkdir(job.storagePath, { recursive: true });
  const res = await fetch(job.sourceUrl); if (!res.ok) throw new Error(`视频下载失败：${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const file = path.join(job.storagePath, `${new Date().toISOString().replace(/[:.]/g, '-')}-${safeFilename(job.prompt)}.mp4`);
  await fs.writeFile(file, buf);
  const meta = { ...job, localPath: file, downloadedAt: new Date().toISOString() };
  await fs.writeFile(file.replace(/\.mp4$/, '.metadata.json'), JSON.stringify(meta, null, 2));
  return { ...job, localPath: file, updatedAt: new Date().toISOString() } as SeedanceJob;
}
