import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const status = searchParams.get('status') || 'verified';

    let query = `SELECT o.*, u.name as user_name, u.email as user_email
                 FROM organizations o
                 JOIN users u ON o.user_id = u.id
                 WHERE o.verification_status = ?`;
    const params = [status];

    if (city) {
      query += ' AND o.city LIKE ?';
      params.push(`%${city}%`);
    }
    if (search) {
      query += ' AND (o.org_name LIKE ? OR o.city LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY o.org_name ASC';

    const organizations = db.prepare(query).all(...params);

    // Parse JSON fields and query dynamic statistics
    const parsed = organizations.map(org => {
      // 1. Get total donations received (status received, sorted, distributed, completed)
      const receivedCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM donations 
        WHERE organization_id = ? AND status IN ('received', 'sorted', 'distributed', 'completed')
      `).get(org.id)?.count || 0;

      // 2. Get active urgent needs
      const activeNeeds = db.prepare(`
        SELECT item_type, quantity_needed, quantity_fulfilled, priority
        FROM donation_requests
        WHERE organization_id = ? AND status IN ('active', 'partially_fulfilled')
        ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END
        LIMIT 3
      `).all(org.id);

      return {
        ...org,
        service_area: org.service_area ? JSON.parse(org.service_area) : [],
        accepted_categories: org.accepted_categories ? JSON.parse(org.accepted_categories) : [],
        total_donations_received: receivedCount,
        active_needs: activeNeeds,
      };
    });

    return NextResponse.json({ organizations: parsed });
  } catch (error) {
    console.error('Get organizations error:', error);
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
}
