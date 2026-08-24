import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function GET() {
  try {
    const db = getDb();
    const items = db.prepare('SELECT * FROM prohibited_items ORDER BY name ASC').all();
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch prohibited items' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const decoded = getUserFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { name, description } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare('INSERT INTO prohibited_items (name, description) VALUES (?, ?)').run(name, description || null);

    return NextResponse.json({ id: Number(result.lastInsertRowid), message: 'Item added' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const decoded = getUserFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await request.json();
    const db = getDb();
    db.prepare('DELETE FROM prohibited_items WHERE id = ?').run(id);

    return NextResponse.json({ message: 'Item removed' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 });
  }
}
