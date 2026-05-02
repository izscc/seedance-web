import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
export async function GET(req: NextRequest) { const p = req.nextUrl.searchParams.get('path'); if (!p) return new NextResponse('missing path',{status:400}); const data = await fs.readFile(p); return new NextResponse(data, { headers: { 'Content-Type': 'video/mp4' } }); }
