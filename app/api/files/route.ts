import { NextResponse } from 'next/server';
import { readJobs } from '@/app/lib/store';
export async function GET() { return NextResponse.json((await readJobs()).filter(j => j.localPath)); }
