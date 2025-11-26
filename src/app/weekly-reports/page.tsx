import { getWeeklyReports, getCurrentUser, getWeeklyReportStatus } from '@/app/actions';
import WeeklyReportsClient from './WeeklyReportsClient';
import { redirect } from 'next/navigation';

export default async function WeeklyReportsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const [reports, status] = await Promise.all([
    getWeeklyReports(),
    getWeeklyReportStatus()
  ]);

  return (
    <main className="min-h-screen bg-[#0f1230]">
       <WeeklyReportsClient 
         initialReports={reports} 
         userPlan={user.plan} 
         reportStatus={status}
       />
    </main>
  );
}
