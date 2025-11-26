import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signJWT } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { identifier, password } = body;

  if (!identifier || !password) {
    return NextResponse.json(
      { error: '請輸入電郵/用戶名稱和密碼' },
      { status: 400 }
    );
  }

  // Check if identifier is an email or username
  const isEmail = identifier.includes('@');

  let user;
  if (isEmail) {
    user = await prisma.user.findUnique({
      where: { email: identifier },
    });
  } else {
    user = await prisma.user.findUnique({
      where: { username: identifier },
    });
  }

  if (!user) {
    return NextResponse.json(
      { error: '電郵/用戶名稱或密碼錯誤' },
      { status: 401 }
    );
  }

  const isValid = await verifyPassword(password, user.password);

  if (!isValid) {
    return NextResponse.json(
      { error: '電郵/用戶名稱或密碼錯誤' },
      { status: 401 }
    );
  }

  // Generate JWT token for mobile clients
  const token = await signJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as 'USER' | 'SUPERADMIN',
  });

  return NextResponse.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
    },
  });
}


