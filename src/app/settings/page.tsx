import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import SettingsForm from './form';
import { checkSuperAdminExists } from '@/app/actions/auth';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.userId) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: { 
      name: true, 
      email: true, 
      role: true, 
      plan: true, 
      planExpiresAt: true 
    }
  });

  if (!user) {
    redirect('/login');
  }

  const superAdminExists = await checkSuperAdminExists();

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24">
      <Suspense fallback={<SettingsFormSkeleton />}>
        <SettingsForm user={user} showSuperAdminSetup={!superAdminExists} />
      </Suspense>
    </div>
  );
}

function SettingsFormSkeleton() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      <div className="h-10 bg-white/10 rounded-xl mb-8 w-48" />
      <div className="bg-surface/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-6">
        <div className="h-6 bg-white/10 rounded w-32 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-white/5 rounded-2xl" />
          <div className="h-32 bg-white/5 rounded-2xl" />
        </div>
      </div>
      <div className="bg-surface/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
        <div className="h-6 bg-white/10 rounded w-48 mb-6" />
        <div className="space-y-4">
          <div className="h-12 bg-white/5 rounded-xl" />
          <div className="h-12 bg-white/5 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

