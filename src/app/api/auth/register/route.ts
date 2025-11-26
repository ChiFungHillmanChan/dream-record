import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signJWT } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password, confirmPassword, name, username } = body;

  if (!email || !password || !name) {
    return NextResponse.json(
      { error: '所有欄位皆為必填' },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: '密碼長度至少需為 6 個字元' },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: '兩次輸入的密碼不相符' },
      { status: 400 }
    );
  }

  // Validate username format if provided
  const trimmedUsername = username?.trim() || null;
  if (trimmedUsername) {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmedUsername)) {
      return NextResponse.json(
        { error: '用戶名稱只可使用 3-20 個英文字母、數字或底線' },
        { status: 400 }
      );
    }
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: '此電郵已被註冊' },
      { status: 409 }
    );
  }

  // Check if username is taken (if provided)
  if (trimmedUsername) {
    const existingUsername = await prisma.user.findUnique({
      where: { username: trimmedUsername },
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: '此用戶名稱已被使用' },
        { status: 409 }
      );
    }
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      username: trimmedUsername,
    },
  });

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

