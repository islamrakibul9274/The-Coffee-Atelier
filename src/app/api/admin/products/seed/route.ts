import { NextResponse } from 'next/server';

// Inventory setup is an offline operation; HTTP requests must not erase the catalog.
export async function POST() {
  return NextResponse.json({ error: 'Inventory seeding is disabled.' }, { status: 410 });
}
