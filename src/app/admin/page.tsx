import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ROLES } from '@/lib/constants';
import AdminPageClient from './AdminPageClient';
import { getAllUsers, getUserStats } from '@/app/actions/admin';

export default async function AdminPage() {
  const session = await getSession();
  if (!session?.userId) {
    redirect('/login');
  }

  // Check if user is superadmin
  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: { role: true },
  });

  if (user?.role !== ROLES.SUPERADMIN) {
    redirect('/');
  }

  const users = await getAllUsers();
  const stats = await getUserStats();

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24">
      <AdminPageClient users={users} stats={stats} />
    </div>
  );
}

