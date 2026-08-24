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
    const user = db.prepare('SELECT id, name, email, phone, role, city, pin_code, photo, donation_count, completed_donations, impact_score, is_verified, is_active, created_at FROM users WHERE id = ?').get(decoded.id);

    if (!user || !user.is_active) {
      return NextResponse.json({ error: 'User not found or suspended' }, { status: 404 });
    }

    let organization = null;
    if (user.role === 'ngo') {
      organization = db.prepare('SELECT * FROM organizations WHERE user_id = ?').get(user.id);
    }

    return NextResponse.json({
      user: {
        ...user,
        organization: organization ? {
          id: organization.id,
          org_name: organization.org_name,
          verification_status: organization.verification_status,
          org_type: organization.org_type,
          city: organization.city,
          registration_number: organization.registration_number,
        } : null,
      },
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
