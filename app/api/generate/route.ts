import { NextRequest, NextResponse } from 'next/server';
import { createRemoteTask, pickStatus, pickVideoUrl, downloadVideo } from '@/app/lib/seedance';
import { resolveStoragePath, upsertJob, SeedanceJob } from '@/app/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = body.apiKey || process.env.SEEDANCE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: '缺少 API Key，请在 .env.local 配置 SEEDANCE_API_KEY 或在页面临时填写。' }, { status: 400 });
    const params = { duration: Number(body.duration || 5), ratio: body.ratio || '16:9', resolution: body.resolution || '720p', audio: Boolean(body.audio), seed: body.seed ? Number(body.seed) : undefined };
    const baseUrl = body.baseUrl || process.env.SEEDANCE_BASE_URL || 'https://api.zscc.in/v1';
    const model = body.model || process.env.SEEDANCE_MODEL || 'doubao-seedance-2.0';
    const created = await createRemoteTask({ baseUrl, apiKey, model, prompt: body.prompt, negativePrompt: body.negativePrompt, endpointMode: body.endpointMode || 'auto', ...params });
    const raw: any = created.raw;
    const now = new Date().toISOString();
    let job: SeedanceJob = {
      id: crypto.randomUUID(), remoteId: raw.id || raw.data?.id || raw.task_id || raw.data?.task_id, status: pickStatus(raw), prompt: body.prompt,
      negativePrompt: body.negativePrompt, model, baseUrl, endpointMode: created.mode, params, storagePath: resolveStoragePath(body.storagePath), sourceUrl: pickVideoUrl(raw), raw, createdAt: now, updatedAt: now,
    };
    if (job.sourceUrl && job.status === 'succeeded') job = await downloadVideo(job);
    await upsertJob(job);
    return NextResponse.json(job);
  } catch (e: any) { return NextResponse.json({ error: e.message || String(e) }, { status: 500 }); }
}
