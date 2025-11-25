import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import SettingsForm from './form';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.userId) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: { name: true, email: true }
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24">
       <SettingsForm user={user} />
    </div>
  );
}

