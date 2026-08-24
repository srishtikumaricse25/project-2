import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    let query = `SELECT dr.*, o.org_name, c.name as category_name, c.icon as category_icon
                 FROM donation_requests dr
                 LEFT JOIN organizations o ON dr.organization_id = o.id
                 LEFT JOIN categories c ON dr.category_id = c.id
                 WHERE 1=1`;
    const params = [];

    if (status) {
      query += ' AND dr.status = ?';
      params.push(status);
    }
    if (category) {
      query += ' AND dr.category_id = ?';
      params.push(category);
    }

    query += ' ORDER BY CASE dr.priority WHEN "urgent" THEN 1 WHEN "high" THEN 2 WHEN "medium" THEN 3 ELSE 4 END, dr.created_at DESC';

    const requests = db.prepare(query).all(...params);
    return NextResponse.json({ requests });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch donation requests' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const decoded = getUserFromRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const org = db.prepare("SELECT id FROM organizations WHERE user_id = ? AND verification_status = 'verified'").get(decoded.id);
    if (!org) {
      return NextResponse.json({ error: 'Only verified organizations can create donation requests' }, { status: 403 });
    }

    const { category_id, item_type, quantity_needed, priority, required_before, description, beneficiary_category } = await request.json();

    if (!item_type || !quantity_needed) {
      return NextResponse.json({ error: 'Item type and quantity are required' }, { status: 400 });
    }

    const result = db.prepare(
      `INSERT INTO donation_requests (organization_id, category_id, item_type, quantity_needed, priority, required_before, description, beneficiary_category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(org.id, category_id || null, item_type, quantity_needed, priority || 'medium', required_before || null, description || null, beneficiary_category || null);

    return NextResponse.json({ id: Number(result.lastInsertRowid), message: 'Request created' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create donation request' }, { status: 500 });
  }
}
