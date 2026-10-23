import { NextResponse } from 'next/server';

// Diagnostics must never publish customer orders or stack traces.
export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
