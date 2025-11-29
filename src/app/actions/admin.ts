'use server';

import { prisma } from '@/lib/prisma';
import { getSession, hashPassword } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { User } from '@prisma/client';
import { PLANS, ROLES, type PlanType } from '@/lib/constants';

// Type for user list (without password, with dream count)
export type UserListItem = Omit<User, 'password'> & {
  dreamCount: number;
};

// Check if current user is superadmin
async function requireSuperAdmin() {
  const session = await getSession();
  if (!session?.userId) {
    throw new Error('Not authenticated');
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: { role: true },
  });
  
  if (user?.role !== ROLES.SUPERADMIN) {
    throw new Error('Unauthorized: Superadmin access required');
  }
  
  return session;
}

// Get all users with dream counts (superadmin only)
export async function getAllUsers(): Promise<UserListItem[]> {
  await requireSuperAdmin();
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      role: true,
      plan: true,
      planExpiresAt: true,
      createdAt: true,
      updatedAt: true,
      lifetimeAnalysisCount: true,
      lifetimeWeeklyReportCount: true,
      upgradedByAdmin: true,
      hasSeenUpgradePopup: true,
      _count: {
        select: {
          dreams: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  
  // Map to include dreamCount
  return users.map(user => ({
    ...user,
    dreamCount: user._count.dreams,
    _count: undefined, // Remove _count from the output
  })) as UserListItem[];
}

// Get user statistics (superadmin only)
export async function getUserStats() {
  await requireSuperAdmin();
  
  const totalUsers = await prisma.user.count();
  const freeUsers = await prisma.user.count({ where: { plan: PLANS.FREE } });
  const deepUsers = await prisma.user.count({ where: { plan: PLANS.DEEP } });
  const totalDreams = await prisma.dream.count();
  
  return {
    totalUsers,
    freeUsers,
    deepUsers,
    totalDreams,
  };
}

// Update user plan (superadmin only)
export async function updateUserPlan(
  userId: string, 
  plan: PlanType, 
  durationMonths?: number // For DEEP plan: 1 = monthly, 12 = yearly
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireSuperAdmin();
    
    const session = await getSession();
    
    // Prevent self-modification of critical fields
    if (userId === session?.userId) {
      return { success: false, error: 'Cannot modify your own plan' };
    }
    
    // Get user's current state to determine if this is a new upgrade
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true }
    });
    
    let planExpiresAt: Date | null = null;
    
    if (plan === PLANS.DEEP && durationMonths) {
      planExpiresAt = new Date();
      planExpiresAt.setMonth(planExpiresAt.getMonth() + durationMonths);
    }

    // If upgrading from FREE to DEEP via admin, mark as trial and reset popup flag
    const isNewUpgrade = currentUser?.plan === PLANS.FREE && plan === PLANS.DEEP;
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan,
        planExpiresAt,
        // Mark as admin-upgraded trial if it's a new upgrade to DEEP
        ...(isNewUpgrade && {
          upgradedByAdmin: true,
          hasSeenUpgradePopup: false, // Reset so they see the popup
        }),
        // If downgrading to FREE, reset the admin upgrade flag
        ...(plan === PLANS.FREE && {
          upgradedByAdmin: false,
        }),
      },
    });
    
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Update user plan error:', error);
    return { success: false, error: 'Failed to update user plan' };
  }
}

// Update user role (superadmin only)
export async function updateUserRole(
  userId: string, 
  role: 'USER' | 'SUPERADMIN'
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireSuperAdmin();
    
    const session = await getSession();
    
    // Prevent self-modification of role
    if (userId === session?.userId) {
      return { success: false, error: 'Cannot modify your own role' };
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Update user role error:', error);
    return { success: false, error: 'Failed to update user role' };
  }
}

// Get user's dream count
export async function getUserDreamCount(userId: string): Promise<number> {
  await requireSuperAdmin();
  
  return await prisma.dream.count({
    where: { userId },
  });
}

// Reset user password (superadmin only)
export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireSuperAdmin();
    
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: '密碼必須至少 6 個字元' };
    }
    
    const hashedPassword = await hashPassword(newPassword);
    
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Reset user password error:', error);
    return { success: false, error: '重設密碼失敗' };
  }
}

// Update user plan with custom expiry date (superadmin only)
export async function updateUserPlanWithExpiry(
  userId: string,
  plan: PlanType,
  planExpiresAt: Date | null
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireSuperAdmin();
    
    const session = await getSession();
    
    // Prevent self-modification of critical fields
    if (userId === session?.userId) {
      return { success: false, error: '無法修改自己的計劃' };
    }

    // Get user's current state to determine if this is a new upgrade
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true }
    });

    // If upgrading from FREE to DEEP via admin, mark as trial and reset popup flag
    const isNewUpgrade = currentUser?.plan === PLANS.FREE && plan === PLANS.DEEP;
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan,
        planExpiresAt: plan === PLANS.FREE ? null : planExpiresAt,
        // Mark as admin-upgraded trial if it's a new upgrade to DEEP
        ...(isNewUpgrade && {
          upgradedByAdmin: true,
          hasSeenUpgradePopup: false, // Reset so they see the popup
        }),
        // If downgrading to FREE, reset the admin upgrade flag
        ...(plan === PLANS.FREE && {
          upgradedByAdmin: false,
        }),
      },
    });
    
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Update user plan with expiry error:', error);
    return { success: false, error: '更新計劃失敗' };
  }
}

// Reset user's daily analysis usage (superadmin only)
// This resets lifetimeAnalysisCount to 0 (free users have 20 lifetime)
export async function resetUserDailyAnalysisUsage(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireSuperAdmin();
    
    await prisma.user.update({
      where: { id: userId },
      data: { lifetimeAnalysisCount: 0 },
    });
    
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Reset daily analysis usage error:', error);
    return { success: false, error: '重設每日解析次數失敗' };
  }
}

// Reset user's weekly report usage (superadmin only)
// This resets lifetimeWeeklyReportCount to 0 (free users have 3 lifetime)
export async function resetUserWeeklyReportUsage(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireSuperAdmin();
    
    await prisma.user.update({
      where: { id: userId },
      data: { lifetimeWeeklyReportCount: 0 },
    });
    
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Reset weekly report usage error:', error);
    return { success: false, error: '重設週報次數失敗' };
  }
}

// Get user's current usage stats (for display in admin panel)
export async function getUserUsageStats(userId: string): Promise<{
  lifetimeAnalysisCount: number;
  lifetimeWeeklyReportCount: number;
} | null> {
  try {
    await requireSuperAdmin();
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        lifetimeAnalysisCount: true,
        lifetimeWeeklyReportCount: true,
      },
    });
    
    return user;
  } catch (error) {
    console.error('Get user usage stats error:', error);
    return null;
  }
}

