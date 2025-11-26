import { getWeeklyReports, getCurrentUser } from '@/app/actions';
import WeeklyReportsClient from './WeeklyReportsClient';
import { redirect } from 'next/navigation';

export default async function WeeklyReportsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const reports = await getWeeklyReports();

  return (
    <main className="min-h-screen bg-black text-white">
       <WeeklyReportsClient initialReports={reports} userPlan={user.plan} />
    </main>
  );
}

