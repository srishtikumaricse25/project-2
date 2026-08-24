import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const db = getDb();

    const org = db.prepare(
      `SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.created_at as user_created_at
       FROM organizations o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`
    ).get(id);

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get donation stats
    const stats = db.prepare(
      `SELECT
        COUNT(*) as total_donations,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status IN ('submitted', 'pending_acceptance') THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'accepted' OR status = 'pickup_scheduled' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'received' OR status = 'sorted' THEN 1 ELSE 0 END) as received,
        SUM(CASE WHEN status = 'distributed' THEN 1 ELSE 0 END) as distributed,
        SUM(quantity) as total_items
       FROM donations WHERE organization_id = ?`
    ).get(org.id);

    return NextResponse.json({
      organization: {
        ...org,
        service_area: org.service_area ? JSON.parse(org.service_area) : [],
        accepted_categories: org.accepted_categories ? JSON.parse(org.accepted_categories) : [],
        documents: org.documents ? JSON.parse(org.documents) : [],
      },
      stats
    });
  } catch (error) {
    console.error('Get organization error:', error);
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const decoded = getUserFromRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(id);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { org_name, contact_person, phone, address, city, service_area, org_type, website, accepted_categories } = body;

    const updates = [];
    const updateParams = [];

    if (org_name) { updates.push('org_name = ?'); updateParams.push(org_name); }
    if (contact_person) { updates.push('contact_person = ?'); updateParams.push(contact_person); }
    if (phone) { updates.push('phone = ?'); updateParams.push(phone); }
    if (address) { updates.push('address = ?'); updateParams.push(address); }
    if (city) { updates.push('city = ?'); updateParams.push(city); }
    if (service_area) { updates.push('service_area = ?'); updateParams.push(JSON.stringify(service_area)); }
    if (org_type) { updates.push('org_type = ?'); updateParams.push(org_type); }
    if (website !== undefined) { updates.push('website = ?'); updateParams.push(website); }
    if (accepted_categories) { updates.push('accepted_categories = ?'); updateParams.push(JSON.stringify(accepted_categories)); }

    if (updates.length > 0) {
      updates.push('updated_at = datetime("now")');
      updateParams.push(id);
      db.prepare(`UPDATE organizations SET ${updates.join(', ')} WHERE id = ?`).run(...updateParams);
    }

    return NextResponse.json({ message: 'Organization updated successfully' });
  } catch (error) {
    console.error('Update organization error:', error);
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
  }
}
