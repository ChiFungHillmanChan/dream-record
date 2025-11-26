import bcrypt from 'bcryptjs';
import { cookies, headers } from 'next/headers';
import { signJWT, verifyJWT, SessionPayload } from './jwt';

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export { signJWT, verifyJWT };
export type { SessionPayload };

/**
 * Get session from either:
 * 1. Authorization: Bearer <token> header (for mobile/API clients)
 * 2. session_token cookie (for web clients)
 */
export async function getSession(): Promise<SessionPayload | null> {
  // First, try to get token from Authorization header (for mobile/API clients)
  const headerStore = await headers();
  const authHeader = headerStore.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const session = await verifyJWT(token);
    if (session) return session;
  }

  // Fall back to cookie-based session (for web clients)
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) return null;
  return await verifyJWT(token);
}

export async function setSession(payload: SessionPayload) {
  const token = await signJWT(payload);
  const cookieStore = await cookies();
  cookieStore.set('session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    path: '/',
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session_token');
}
