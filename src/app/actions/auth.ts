'use server';

import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword, setSession, clearSession, getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function register(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const name = formData.get('name') as string;

  if (!email || !password || !name) {
    return { error: '所有欄位皆為必填' };
  }

  if (password.length < 6) {
    return { error: '密碼長度至少需為 6 個字元' };
  }

  if (password !== confirmPassword) {
    return { error: '兩次輸入的密碼不相符' };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: '此電郵已被註冊' };
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    await setSession({ 
      userId: user.id, 
      email: user.email, 
      name: user.name,
      role: user.role as 'USER' | 'SUPERADMIN'
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return { error: '發生錯誤，請稍後再試' };
  }
  
  redirect('/');
}

export async function login(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: '請輸入電郵和密碼' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: '電郵或密碼錯誤' };
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return { error: '電郵或密碼錯誤' };
    }

    await setSession({ 
      userId: user.id, 
      email: user.email, 
      name: user.name,
      role: user.role as 'USER' | 'SUPERADMIN'
    });

  } catch (error) {
    console.error('Login error:', error);
    return { error: '發生錯誤，請稍後再試' };
  }

  redirect('/');
}

export async function logout() {
  await clearSession();
  redirect('/login');
}

export async function deleteAccount(prevState: unknown, formData: FormData) {
  const session = await getSession();
  if (!session?.userId) {
    return { error: 'Not authenticated' };
  }

  try {
    // Delete user (cascade deletes dreams due to schema)
    await prisma.user.delete({
      where: { id: session.userId as string },
    });

    await clearSession();
  } catch (error) {
    console.error('Delete account error:', error);
    return { error: 'Failed to delete account' };
  }

  redirect('/login');
}

// Check if superadmin exists
export async function checkSuperAdminExists(): Promise<boolean> {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'SUPERADMIN' },
  });
  return !!existingAdmin;
}

// Initial superadmin setup - can only be used when no superadmin exists
export async function setupSuperAdmin(): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if any superadmin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'SUPERADMIN' },
    });

    if (existingAdmin) {
      return { success: false, error: 'Superadmin already exists' };
    }

    // Make current user the superadmin
    await prisma.user.update({
      where: { id: session.userId as string },
      data: { role: 'SUPERADMIN' },
    });

    // Update session
    const updatedUser = await prisma.user.findUnique({
      where: { id: session.userId as string },
    });

    if (updatedUser) {
      await setSession({
        userId: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role as 'USER' | 'SUPERADMIN',
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Setup superadmin error:', error);
    return { success: false, error: 'Failed to setup superadmin' };
  }
}

export async function updateSettings(prevState: unknown, formData: FormData) {
  const session = await getSession();
  if (!session?.userId) {
    return { error: 'Not authenticated' };
  }

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const dataToUpdate: { name?: string; email?: string; password?: string } = {};
    if (name) dataToUpdate.name = name;
    if (email) dataToUpdate.email = email; // Note: changing email might require re-verification in a real app
    if (password && password.length >= 6) {
      dataToUpdate.password = await hashPassword(password);
    } else if (password && password.length < 6) {
        return { error: "Password must be at least 6 characters" };
    }

    if (Object.keys(dataToUpdate).length > 0) {
      const updatedUser = await prisma.user.update({
        where: { id: session.userId as string },
        data: dataToUpdate,
      });
      
      // Update session with new details if needed
      await setSession({ 
        userId: updatedUser.id, 
        email: updatedUser.email, 
        name: updatedUser.name,
        role: updatedUser.role as 'USER' | 'SUPERADMIN'
      });
      revalidatePath('/settings');
      return { success: 'Settings updated successfully' };
    }
  } catch (error) {
    console.error('Update settings error:', error);
    return { error: 'Failed to update settings' };
  }
  
  return { success: 'No changes made' };
}
