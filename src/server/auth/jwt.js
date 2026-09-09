import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'crm-acme-super-secret-key-2026-high-security-token';
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET_STRING);

export async function signToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch {
    return null;
  }
}
