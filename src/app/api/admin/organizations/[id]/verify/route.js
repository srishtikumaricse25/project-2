import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function PATCH(request, { params }) {
  try {
    const decoded = getUserFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const { verification_status, verification_notes } = await request.json();

    if (!verification_status || !['verified', 'rejected', 'suspended', 'under_review'].includes(verification_status)) {
      return NextResponse.json({ error: 'Invalid verification status' }, { status: 400 });
    }

    const db = getDb();
    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(id);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    db.prepare(
      'UPDATE organizations SET verification_status = ?, verification_notes = ?, verified_by = ?, verified_at = datetime("now"), updated_at = datetime("now") WHERE id = ?'
    ).run(verification_status, verification_notes || null, decoded.id, id);

    // Update user verification
    if (verification_status === 'verified') {
      db.prepare('UPDATE users SET is_verified = 1 WHERE id = ?').run(org.user_id);
    }

    // Notify the NGO
    const statusMessages = {
      verified: { title: 'Organization Verified! ✅', message: 'Congratulations! Your organization has been verified. You can now receive donations.' },
      rejected: { title: 'Verification Declined ❌', message: `Your verification was declined. ${verification_notes || 'Please contact support for details.'}` },
      suspended: { title: 'Organization Suspended ⚠️', message: 'Your organization has been suspended. Please contact support.' },
      under_review: { title: 'Under Review 🔍', message: 'Your organization documents are being reviewed. We\'ll notify you soon.' },
    };

    const notif = statusMessages[verification_status];
    if (notif) {
      db.prepare(
        'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)'
      ).run(org.user_id, 'verification_update', notif.title, notif.message);
    }

    return NextResponse.json({ message: `Organization ${verification_status}` });
  } catch (error) {
    console.error('Verify organization error:', error);
    return NextResponse.json({ error: 'Failed to update verification' }, { status: 500 });
  }
}
