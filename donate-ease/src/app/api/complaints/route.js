import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function GET(request) {
  try {
    const decoded = getUserFromRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = `SELECT c.*, u.name as reporter_name, u.email as reporter_email, d.donation_id as donation_ref
                 FROM complaints c
                 LEFT JOIN users u ON c.reporter_id = u.id
                 LEFT JOIN donations d ON c.donation_id = d.id
                 WHERE 1=1`;
    const params = [];

    if (decoded.role !== 'admin') {
      query += ' AND c.reporter_id = ?';
      params.push(decoded.id);
    }
    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.created_at DESC';
    const complaints = db.prepare(query).all(...params);

    return NextResponse.json({ complaints });
  } catch (error) {
    console.error('Get complaints error:', error);
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const decoded = getUserFromRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { donation_id, type, description } = await request.json();
    if (!type || !description) {
      return NextResponse.json({ error: 'Type and description are required' }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare(
      'INSERT INTO complaints (reporter_id, donation_id, type, description) VALUES (?, ?, ?, ?)'
    ).run(decoded.id, donation_id || null, type, description);

    return NextResponse.json({ id: Number(result.lastInsertRowid), message: 'Complaint submitted' }, { status: 201 });
  } catch (error) {
    console.error('Create complaint error:', error);
    return NextResponse.json({ error: 'Failed to submit complaint' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const decoded = getUserFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id, status, resolution } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Complaint ID and status are required' }, { status: 400 });
    }

    const db = getDb();
    db.prepare(
      'UPDATE complaints SET status = ?, resolution = ?, resolved_by = ?, resolved_at = datetime("now") WHERE id = ?'
    ).run(status, resolution || null, decoded.id, id);

    return NextResponse.json({ message: 'Complaint updated' });
  } catch (error) {
    console.error('Update complaint error:', error);
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 });
  }
}
