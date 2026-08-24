import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { comparePassword, signToken } = require('@/lib/auth');

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'Your account has been suspended. Contact support.' }, { status: 403 });
    }

    // Check account lockout (FR-AUTH-04)
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return NextResponse.json({
        error: 'Account locked due to repeated failed login attempts. Please try again after 15 minutes.'
      }, { status: 403 });
    }

    const valid = comparePassword(password, user.password_hash);
    if (!valid) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      if (attempts >= 5) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        db.prepare('UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?').run(attempts, lockUntil, user.id);
        return NextResponse.json({
          error: 'Account locked due to 5 consecutive failed login attempts. Try again in 15 minutes.'
        }, { status: 403 });
      } else {
        db.prepare('UPDATE users SET failed_login_attempts = ? WHERE id = ?').run(attempts, user.id);
        return NextResponse.json({ error: `Invalid email or password (${5 - attempts} attempts remaining)` }, { status: 401 });
      }
    }

    // Reset failed login attempts on success
    db.prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);

    // If NGO, get organization info
    let organization = null;
    if (user.role === 'ngo') {
      organization = db.prepare('SELECT * FROM organizations WHERE user_id = ?').get(user.id);
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        city: user.city,
        pin_code: user.pin_code,
        photo: user.photo,
        donation_count: user.donation_count,
        completed_donations: user.completed_donations,
        impact_score: user.impact_score,
        is_verified: user.is_verified,
        organization: organization ? {
          id: organization.id,
          org_name: organization.org_name,
          verification_status: organization.verification_status,
        } : null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
