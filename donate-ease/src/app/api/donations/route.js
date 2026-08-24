import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest, generateDonationId } = require('@/lib/auth');

export async function GET(request) {
  try {
    const decoded = getUserFromRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = '';
    let countQuery = '';
    const params = [];
    const countParams = [];

    if (decoded.role === 'donor') {
      query = `SELECT d.*, c.name as category_name, c.icon as category_icon, c.slug as category_slug, o.org_name
               FROM donations d
               LEFT JOIN categories c ON d.category_id = c.id
               LEFT JOIN organizations o ON d.organization_id = o.id
               WHERE d.donor_id = ?`;
      countQuery = 'SELECT COUNT(*) as total FROM donations WHERE donor_id = ?';
      params.push(decoded.id);
      countParams.push(decoded.id);
    } else if (decoded.role === 'ngo') {
      const org = db.prepare('SELECT id FROM organizations WHERE user_id = ?').get(decoded.id);
      if (!org) return NextResponse.json({ donations: [], total: 0 });
      query = `SELECT d.*, c.name as category_name, c.icon as category_icon, u.name as donor_name, u.phone as donor_phone
               FROM donations d
               LEFT JOIN categories c ON d.category_id = c.id
               LEFT JOIN users u ON d.donor_id = u.id
               WHERE d.organization_id = ?`;
      countQuery = 'SELECT COUNT(*) as total FROM donations WHERE organization_id = ?';
      params.push(org.id);
      countParams.push(org.id);
    } else if (decoded.role === 'admin') {
      query = `SELECT d.*, c.name as category_name, c.icon as category_icon, u.name as donor_name, o.org_name
               FROM donations d
               LEFT JOIN categories c ON d.category_id = c.id
               LEFT JOIN users u ON d.donor_id = u.id
               LEFT JOIN organizations o ON d.organization_id = o.id
               WHERE 1=1`;
      countQuery = 'SELECT COUNT(*) as total FROM donations WHERE 1=1';
    }

    if (status) {
      query += ' AND d.status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }

    query += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const donations = db.prepare(query).all(...params);
    const { total } = db.prepare(countQuery).get(...countParams);

    return NextResponse.json({ donations, total, page, limit });
  } catch (error) {
    console.error('Get donations error:', error);
    return NextResponse.json({ error: 'Failed to fetch donations' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const decoded = getUserFromRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { category_id, item_type, quantity, condition, description, photos, size_weight, organization_id, pickup_address, pickup_city, pickup_pin_code, pickup_date, pickup_time_slot, pickup_instructions, pickup_contact_phone, landmark, num_packages } = body;

    if (!category_id || !item_type || !quantity || !condition) {
      return NextResponse.json({ error: 'Category, item type, quantity, and condition are required' }, { status: 400 });
    }

    const db = getDb();
    const donation_id = generateDonationId();

    const stmt = db.prepare(
      `INSERT INTO donations (donation_id, donor_id, organization_id, category_id, item_type, quantity, condition, description, photos, size_weight, status, pickup_address, pickup_city, pickup_pin_code, pickup_date, pickup_time_slot, pickup_instructions, pickup_contact_phone, landmark, num_packages)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const result = stmt.run(
      donation_id, decoded.id, organization_id || null, category_id, item_type, quantity, condition,
      description || null, photos ? JSON.stringify(photos) : null, size_weight || null,
      pickup_address || null, pickup_city || null, pickup_pin_code || null,
      pickup_date || null, pickup_time_slot || null, pickup_instructions || null, pickup_contact_phone || null,
      landmark || null, num_packages ? Number(num_packages) : 1
    );

    // Status history
    db.prepare(
      'INSERT INTO donation_status_history (donation_id, from_status, to_status, changed_by, notes) VALUES (?, ?, ?, ?, ?)'
    ).run(result.lastInsertRowid, null, 'submitted', decoded.id, 'Donation created');

    // Update donor count
    db.prepare('UPDATE users SET donation_count = donation_count + 1 WHERE id = ?').run(decoded.id);

    // Notify NGO if selected
    if (organization_id) {
      const org = db.prepare('SELECT user_id, org_name FROM organizations WHERE id = ?').get(organization_id);
      if (org) {
        db.prepare(
          'INSERT INTO notifications (user_id, type, title, message, donation_id) VALUES (?, ?, ?, ?, ?)'
        ).run(org.user_id, 'new_donation', 'New Donation Request 📩',
          `${decoded.name} wants to donate ${quantity} ${item_type}. Review and accept?`, result.lastInsertRowid);
      }
    }

    return NextResponse.json({
      donation: { id: Number(result.lastInsertRowid), donation_id },
      message: 'Donation created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create donation error:', error);
    return NextResponse.json({ error: 'Failed to create donation' }, { status: 500 });
  }
}
