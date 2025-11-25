import { SignJWT, jwtVerify, JWTPayload as JoseJWTPayload } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'default-dev-secret-key-change-in-prod';
const key = new TextEncoder().encode(SECRET_KEY);

export type SessionPayload = JoseJWTPayload & {
  userId: string;
  email: string;
  name?: string | null;
  role: 'USER' | 'SUPERADMIN';
};

export async function signJWT(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function verifyJWT(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch (error) {
    return null;
  }
}
