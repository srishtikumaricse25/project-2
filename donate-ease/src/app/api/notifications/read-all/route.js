import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function PATCH(request) {
  try {
    const decoded = getUserFromRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(decoded.id);

    return NextResponse.json({ message: 'All notifications marked as read' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
