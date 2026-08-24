import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(email);

    if (user) {
      console.log(`[AUTH] Password reset requested for user ${user.email} (ID: ${user.id})`);
      // Simulated token log
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: 'If an account with this email exists, password reset instructions have been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
