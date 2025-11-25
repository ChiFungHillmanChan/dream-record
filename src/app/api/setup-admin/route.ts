import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { ROLES } from '@/lib/constants';

/**
 * POST /api/setup-admin
 * 
 * Creates a superadmin account in production.
 * Requires ADMIN_SETUP_SECRET in headers for security.
 * 
 * Usage:
 * curl -X POST https://your-domain.vercel.app/api/setup-admin \
 *   -H "Content-Type: application/json" \
 *   -H "x-admin-setup-secret: YOUR_SECRET" \
 *   -d '{"email": "admin@example.com", "password": "securepassword", "name": "Admin"}'
 */
export async function POST(request: NextRequest) {
  // Verify the secret key
  const secret = request.headers.get('x-admin-setup-secret');
  const expectedSecret = process.env.ADMIN_SETUP_SECRET;
  
  if (!expectedSecret) {
    return NextResponse.json(
      { error: 'ADMIN_SETUP_SECRET not configured on server' },
      { status: 500 }
    );
  }
  
  if (secret !== expectedSecret) {
    return NextResponse.json(
      { error: 'Invalid or missing admin setup secret' },
      { status: 401 }
    );
  }
  
  // Parse request body
  const body = await request.json();
  const { email, password, name } = body;
  
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }
  
  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters' },
      { status: 400 }
    );
  }
  
  // Check if superadmin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: ROLES.SUPERADMIN },
  });
  
  if (existingAdmin) {
    return NextResponse.json(
      { error: 'Superadmin already exists', existingEmail: existingAdmin.email },
      { status: 409 }
    );
  }
  
  // Check if email is already registered
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  
  if (existingUser) {
    // Promote existing user to superadmin
    const promotedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: { role: ROLES.SUPERADMIN },
      select: { id: true, email: true, name: true, role: true },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Existing user promoted to superadmin',
      user: promotedUser,
    });
  }
  
  // Create new superadmin account
  const hashedPassword = await hashPassword(password);
  
  const newAdmin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: name ?? 'Super Admin',
      role: ROLES.SUPERADMIN,
    },
    select: { id: true, email: true, name: true, role: true },
  });
  
  return NextResponse.json({
    success: true,
    message: 'Superadmin account created successfully',
    user: newAdmin,
  });
}

// GET method to check if superadmin exists (for debugging)
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-admin-setup-secret');
  const expectedSecret = process.env.ADMIN_SETUP_SECRET;
  
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const existingAdmin = await prisma.user.findFirst({
    where: { role: ROLES.SUPERADMIN },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  
  return NextResponse.json({
    superadminExists: !!existingAdmin,
    admin: existingAdmin,
  });
}

