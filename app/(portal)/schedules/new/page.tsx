import { redirect } from 'next/navigation';

export default function NewScheduleRedirectPage() {
  redirect('/schedules');
}
