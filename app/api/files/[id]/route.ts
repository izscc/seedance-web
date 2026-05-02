import { NextRequest, NextResponse } from 'next/server';
import { deleteJob } from '@/app/lib/store';
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; const removeFile = req.nextUrl.searchParams.get('removeFile') === '1'; return NextResponse.json(await deleteJob(id, removeFile)); }
