import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');

export async function GET() {
  try {
    const db = getDb();
    const slots = db.prepare('SELECT * FROM pickup_slots WHERE is_active = 1 ORDER BY start_time ASC').all();
    return NextResponse.json({ slots });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch pickup slots' }, { status: 500 });
  }
}
