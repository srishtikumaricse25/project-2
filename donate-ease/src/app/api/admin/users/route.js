import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function GET(request) {
  try {
    const decoded = getUserFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = 'SELECT id, name, email, phone, role, city, is_active, is_verified, donation_count, completed_donations, created_at FROM users WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const params = [];
    const countParams = [];

    if (role) {
      query += ' AND role = ?';
      countQuery += ' AND role = ?';
      params.push(role);
      countParams.push(role);
    }
    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR city LIKE ?)';
      countQuery += ' AND (name LIKE ? OR email LIKE ? OR city LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const users = db.prepare(query).all(...params);
    const { total } = db.prepare(countQuery).get(...countParams);

    return NextResponse.json({ users, total, page, limit });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const decoded = getUserFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id, is_active } = await request.json();
    if (!id || is_active === undefined) {
      return NextResponse.json({ error: 'User ID and is_active are required' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, id);

    return NextResponse.json({ message: is_active ? 'User activated' : 'User suspended' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
