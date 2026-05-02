import { NextRequest, NextResponse } from 'next/server';
import { downloadVideo, pollRemote } from '@/app/lib/seedance';
import { getJob, upsertJob } from '@/app/lib/store';
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; let job = await getJob(id);
  if (!job) return NextResponse.json({ error: '任务不存在' }, { status: 404 });
  const apiKey = process.env.SEEDANCE_API_KEY;
  try {
    if (apiKey && job.remoteId && !['succeeded','failed'].includes(job.status)) job = await pollRemote(job, apiKey);
    if (job.status === 'succeeded' && job.sourceUrl && !job.localPath) job = await downloadVideo(job);
    await upsertJob(job); return NextResponse.json(job);
  } catch (e: any) { job = { ...job, error: e.message, updatedAt: new Date().toISOString() }; await upsertJob(job); return NextResponse.json(job); }
}
