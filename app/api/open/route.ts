import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
export async function POST(req: NextRequest) { const { path } = await req.json(); if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 }); spawn('open', ['-R', path], { detached: true, stdio: 'ignore' }).unref(); return NextResponse.json({ ok: true }); }
