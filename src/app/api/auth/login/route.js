import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { comparePassword, signToken } = require('@/lib/auth');

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const normalizedEmail = (email || '').trim().toLowerCase();

    // Safe development logging (never log passwords)
    console.log(`[AUTH API] Login attempt for email: ${normalizedEmail}`);

    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required', message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address', message: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(normalizedEmail);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password', message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { success: false, error: 'Your account has been suspended. Please contact support.', message: 'Your account has been suspended. Please contact support.' },
        { status: 403 }
      );
    }

    // Check account lockout (FR-AUTH-04)
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account locked due to consecutive failed login attempts. Please try again after 15 minutes.',
          message: 'Account locked due to consecutive failed login attempts. Please try again after 15 minutes.'
        },
        { status: 403 }
      );
    }

    const valid = comparePassword(password, user.password_hash);
    if (!valid) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      if (attempts >= 5) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        db.prepare('UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?').run(attempts, lockUntil, user.id);
        return NextResponse.json(
          {
            success: false,
            error: 'Account locked due to 5 consecutive failed login attempts. Try again in 15 minutes.',
            message: 'Account locked due to 5 consecutive failed login attempts. Try again in 15 minutes.'
          },
          { status: 403 }
        );
      } else {
        db.prepare('UPDATE users SET failed_login_attempts = ? WHERE id = ?').run(attempts, user.id);
        const remaining = 5 - attempts;
        return NextResponse.json(
          {
            success: false,
            error: `Invalid email or password (${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining)`,
            message: `Invalid email or password (${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining)`
          },
          { status: 401 }
        );
      }
    }

    // Reset failed login attempts on success
    db.prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);

    // If NGO, get organization info
    let organization = null;
    if (user.role === 'ngo') {
      organization = db.prepare('SELECT * FROM organizations WHERE user_id = ?').get(user.id);
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return NextResponse.json(
      {
        success: true,
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
          donation_count: user.donation_count || 0,
          completed_donations: user.completed_donations || 0,
          impact_score: user.impact_score || 0,
          is_verified: user.is_verified,
          organization: organization ? {
            id: organization.id,
            org_name: organization.org_name,
            verification_status: organization.verification_status,
            org_type: organization.org_type,
          } : null,
        },
        message: 'Login successful',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login API unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Login failed. Please try again.',
        message: error.message || 'Login failed. Please try again.'
      },
      { status: 500 }
    );
  }
}
